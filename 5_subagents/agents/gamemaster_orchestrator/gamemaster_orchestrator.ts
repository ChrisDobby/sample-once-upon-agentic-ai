import { existsSync, readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import { z } from 'zod'
import { MemorySaver } from '@langchain/langgraph'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { createAgent, tool, type ReactAgent } from 'langchain'
import { model } from '../../../shared/model.ts'
import { latestTurn, toMessageData } from '../../../shared/messages.ts'
import { printMessages } from '../../../shared/print.ts'
import { characterAgent } from '../character_agent/character_agent.ts'
import { rulesAgent } from '../rules_agent/rules_agent.ts'

const app = express()
app.use(cors())
app.use(express.json())

const CHARACTERS_DB = new URL('../character_agent/characters.json', import.meta.url)

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

/** Wraps a subagent as a tool: the tool's name and description are the subagent's, and its answer is the result. */
function subagentTool(agent: ReactAgent<any>) {
  return tool(
    async ({ request }) => {
      const result = await agent.invoke({ messages: [{ role: 'user', content: request }] })
      return result.messages.at(-1)?.text ?? ''
    },
    {
      name: agent.options.name!,
      description: agent.options.description!,
      schema: z.object({ request: z.string().describe('What you need from this agent, in plain English') }),
    },
  )
}

// TODO: Step 1 - Create a MultiServerMCPClient with one server, dice: { url: "http://localhost:8002/mcp", transport: "http" },
//   and prefixToolNameWithServerName: false so the tool keeps its name, roll_dice
const mcpClient = new MultiServerMCPClient({
  mcpServers: { dice: { url: 'http://localhost:8002/mcp', transport: 'http' } },
  prefixToolNameWithServerName: false,
})

// TODO: Step 2 - Turn the rulesAgent and the characterAgent into tools with subagentTool
const subagents = [subagentTool(rulesAgent), subagentTool(characterAgent)]

const agent = createAgent({
  model,
  systemPrompt: `You are a D&D Game Master. Ask your subagents instead of guessing: rules_agent answers rules questions, character_agent creates, finds and lists characters. Every dice roll goes through roll_dice. Never make up what a tool can tell you, and narrate with flair.`,
  // TODO: Step 3 - Add the MCP tools (await mcpClient.getTools()) and the subagent tools to the agent
  tools: [...(await mcpClient.getTools()), ...subagents],
  // TODO: Step 4 - Force the response to use the StoryOutput schema (responseFormat)
  responseFormat: StoryOutput,
  // The checkpointer keeps the conversation between requests, in memory, under the thread id below.
  checkpointer: new MemorySaver(),
})

const config = { configurable: { thread_id: 'dnd-game' } }

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

app.listen(8009, () => console.log('D&D Game Master API listening on http://localhost:8009'))
