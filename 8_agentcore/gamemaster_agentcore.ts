import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import express from 'express'
import { z } from 'zod'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { createDeepAgent } from 'deepagents'
import { toolStrategy } from 'langchain'
import { model } from '../shared/model.ts'
import { latestTurn, toMessageData } from '../shared/messages.ts'
import { printMessages } from '../shared/print.ts'
import { characterAgent } from '../5_subagents/agents/character_agent/character_agent.ts'
import { rulesAgent } from '../5_subagents/agents/rules_agent/rules_agent.ts'

// AgentCore Runtime only routes two paths to the container, on port 8080: POST /invocations and GET /ping.
const PORT = Number(process.env.PORT ?? 8080)

const app = express()
app.use(express.json())

const CHARACTERS_DB = new URL('../5_subagents/agents/character_agent/characters.json', import.meta.url)

// The Chapter 7 Game Master, unchanged: same schema, same instructions, same tools and subagents.
const DiceOutput = z.object({
  dice_type: z.string().describe('The dice type. Ex: d4, d6, d20, etc'),
  result: z.number().int().describe('The dice result value alone'),
  reason: z.string().describe('The reason the dice was rolled. Ex: attack roll. And the modificators if there was any'),
})

const StoryOutput = z
  .object({
    response: z.string().describe('Your narative response as Game Master'),
    actions_suggestions: z.array(z.string()).describe("['Action 1', 'Action 2', 'Action 3']"),
    details: z.string().describe('Brief summary of tools/agents used'),
    dice_rolls: z.array(DiceOutput).default([]).describe('List of dice rolls with dice_type, result, and reason'),
  })
  .describe('A single Game Master turn: the narration, what the player could do next, and any dice rolled.')
  .meta({ title: 'StoryOutput' })

const INSTRUCTIONS = `You are a D&D Game Master. Never make up what a tool can tell you.
- roll_dice (dice MCP server) rolls the dice.
- the task tool delegates to your subagents: rules_agent answers rules questions, character_agent creates, finds and lists characters.
- before asking character_agent to create a character, roll each ability score the player did not give with 4d6 drop lowest (four roll_dice calls with faces 6, keep the three highest), then pass all six scores to character_agent.
Keep each turn short: a few sentences of narration, then the options.`

// The dice server runs in the same container (see start.sh), so 127.0.0.1 still finds it.
const mcpClient = new MultiServerMCPClient({
  mcpServers: { dice: { url: 'http://127.0.0.1:8002/mcp', transport: 'http' } },
  prefixToolNameWithServerName: false,
})

// Each AgentCore session runs in its own microVM: this database lives as long as the session does.
mkdirSync('.agent', { recursive: true })
const checkpointer = SqliteSaver.fromConnString('.agent/sessions.sqlite')

const agent = createDeepAgent({
  model,
  systemPrompt: INSTRUCTIONS,
  tools: await mcpClient.getTools(),
  subagents: [rulesAgent, characterAgent].map((subagent) => ({
    name: subagent.options.name!,
    description: subagent.options.description!,
    runnable: subagent,
  })),
  checkpointer,
  responseFormat: toolStrategy(StoryOutput),
})

// The three Chapter 7 routes, now actions of a single /invocations payload.
async function inquire(question: string, config: object) {
  const response = await agent.invoke({ messages: [{ role: 'user', content: question }] }, config)
  printMessages(latestTurn(response.messages))
  console.log(response.structuredResponse)
  return { response: response.structuredResponse }
}

async function messages(config: object) {
  const state = await agent.graph.getState(config)
  return (state.values.messages ?? []).map(toMessageData)
}

function findUser(userName: string) {
  const characters = existsSync(CHARACTERS_DB) ? (JSON.parse(readFileSync(CHARACTERS_DB, 'utf-8'))._default ?? {}) : {}
  const character = Object.values<any>(characters).find((c) => c.name === userName)
  return character ?? `:x: Character with name '${userName}' not found`
}

// TODO: Step 1 - Answer the health check: GET /ping returns { status: 'Healthy' }

app.post('/invocations', async (req, res) => {
  // TODO: Step 2 - Use the AgentCore session id as the thread id: the X-Amzn-Bedrock-AgentCore-Runtime-Session-Id header
  const config = { configurable: { thread_id: sessionId } }

  // `agentcore invoke "..."` sends { prompt: "..." }: a plain question to the Game Master.
  const { action = 'inquire', question = req.body?.prompt, userName } = req.body ?? {}
  console.log(`Processing ${action} (session ${sessionId})...`)
  try {
    // TODO: Step 3 - Dispatch on action: 'inquire' calls inquire(question, config), 'messages' calls messages(config),
    //   'user' calls findUser(userName); anything else is a 400
  } catch (error) {
    console.log(`Error occurred: ${error}`)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// TODO: Step 4 - Listen on 0.0.0.0, not localhost: AgentCore reaches the container from outside
