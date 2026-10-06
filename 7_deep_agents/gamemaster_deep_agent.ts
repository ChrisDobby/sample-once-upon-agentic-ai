import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import { z } from 'zod'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { toolStrategy } from 'langchain'
import { model } from '../shared/model.ts'
import { latestTurn, toMessageData } from '../shared/messages.ts'
import { printMessages } from '../shared/print.ts'
import { characterAgent } from '../5_subagents/agents/character_agent/character_agent.ts'
import { rulesAgent } from '../5_subagents/agents/rules_agent/rules_agent.ts'
// TODO: Step 1 - Import createDeepAgent from deepagents

const app = express()
app.use(cors())
app.use(express.json())

const CHARACTERS_DB = new URL('../5_subagents/agents/character_agent/characters.json', import.meta.url)

// Keys stay snake_case: this is the JSON the web interface reads.
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
  // The title names the tool LangChain uses for structured output; without one it changes on every request.
  .meta({ title: 'StoryOutput' })

// Domain instructions only: deepagents adds its own instructions for its built-in tools.
const INSTRUCTIONS = `You are a D&D Game Master. Never make up what a tool can tell you.
- roll_dice (dice MCP server) rolls the dice.
- the task tool delegates to your subagents: rules_agent answers rules questions, character_agent creates, finds and lists characters.
Keep each turn short: a few sentences of narration, then the options.`

// Same MCP server as in Chapter 4.
const mcpClient = new MultiServerMCPClient({
  mcpServers: { dice: { url: 'http://127.0.0.1:8002/mcp', transport: 'http' } },
  prefixToolNameWithServerName: false,
})

// The session is stored on disk, so the campaign survives a restart.
mkdirSync('.agent', { recursive: true })
const checkpointer = SqliteSaver.fromConnString('.agent/sessions.sqlite')

const agent = createDeepAgent({
  model,
  // TODO: Step 1 - Pass the INSTRUCTIONS as the systemPrompt
  // TODO: Step 2 - Add the dice MCP tools (await mcpClient.getTools())
  // TODO: Step 3 - Add the Chapter 5 rulesAgent and characterAgent as subagents: { name, description, runnable } for each
  // TODO: Step 4 - Keep the session on disk: pass the checkpointer (the session name is the thread id, below)
  // TODO: Step 5 - Force the response to use the StoryOutput schema (responseFormat: toolStrategy(StoryOutput))
})

// TODO: Step 4 - Name the session "dnd-campaign"

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

app.get('/messages', async (req, res) => {
  const state = await agent.graph.getState(config)
  res.json((state.values.messages ?? []).map(toMessageData))
})

app.get('/user/:userName', (req, res) => {
  const { userName } = req.params
  const characters = existsSync(CHARACTERS_DB) ? (JSON.parse(readFileSync(CHARACTERS_DB, 'utf-8'))._default ?? {}) : {}
  const character = Object.values<any>(characters).find((c) => c.name === userName)
  if (!character) {
    res.json(`:x: Character with name '${userName}' not found`)
    return
  }

  console.log(
    `✅ Found character: ${character.name} (ID: ${character.character_id}, ${character.character_class} ${character.race})`,
  )
  res.json(character)
})

app.post('/inquire', async (req, res) => {
  console.log('Processing request...')
  try {
    const response = await agent.invoke({ messages: [{ role: 'user', content: req.body.question }] }, config)
    printMessages(latestTurn(response.messages))
    console.log(response.structuredResponse)
    res.json({ response: response.structuredResponse })
  } catch (error) {
    console.log(`Error occurred: ${error}`)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(8009, () => console.log('D&D Game Master API (deepagents) listening on http://localhost:8009'))
