import { existsSync, readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import { z } from 'zod'
import { Agent, McpClient } from '@strands-agents/sdk'
import { makeA2aClient } from '../../utils/a2a_client.ts'

const app = express()
app.use(cors())
app.use(express.json())

const CHARACTERS_DB = new URL('../character_agent/characters.json', import.meta.url)

// TODO: Step 1 - Create an McpClient connecting to "http://localhost:8002/mcp"
const mcpClient = new McpClient({ url: 'http://localhost:8002/mcp' })

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

// TODO: Step 2 - Create the A2A client tool with makeA2aClient and the allowed agent endpoints
const a2aClient = makeA2aClient({
  allowedEndpoints: [
    'http://127.0.0.1:8000', // Rules Agent
    'http://127.0.0.1:8001', // Character Agent
  ],
})

const agent = new Agent({
  systemPrompt: `You are a D&D Game Master. Discover the agents you can reach and ask them instead of guessing: rules questions, character creation and lookups are their job. Every dice roll goes through roll_dice. Never make up what a tool can tell you, and narrate with flair.`,
  // TODO: Step 3 - Add the mcpClient and a2aClient tools to the agent
  tools: [mcpClient, a2aClient],
  // TODO: Step 4 - Force the response to use the StoryOutput schema (structuredOutputSchema)
  structuredOutputSchema: StoryOutput,
})

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

app.get('/messages', (req, res) => {
  res.json(agent.messages)
})

app.get('/user/:userName', (req, res) => {
  const { userName } = req.params
  const characters = existsSync(CHARACTERS_DB) ? JSON.parse(readFileSync(CHARACTERS_DB, 'utf-8'))._default ?? {} : {}
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
    const response = await agent.invoke(req.body.question)
    console.log(response.structuredOutput)
    res.json({ response: response.structuredOutput })
  } catch (error) {
    console.log(`Error occurred: ${error}`)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(8009, () => console.log('D&D Game Master API listening on http://localhost:8009'))
