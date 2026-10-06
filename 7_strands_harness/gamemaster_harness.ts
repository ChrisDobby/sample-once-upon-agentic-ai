import { existsSync, readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import { z } from 'zod'
import { makeA2aClient } from '../5_a2a_integration/utils/a2a_client.ts'
// TODO: Step 1 - Import createHarness from @strands-agents/harness
import { createHarness } from '@strands-agents/harness'

const app = express()
app.use(cors())
app.use(express.json())

const CHARACTERS_DB = new URL('../5_a2a_integration/agents/character_agent/characters.json', import.meta.url)

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

// Domain instructions only: Strands harness prepends its own behavioral contract.
const INSTRUCTIONS = `You are a D&D Game Master. Never make up what a tool can tell you.
- roll_dice (dice MCP server) rolls the dice.
- a2a_client talks to the Rules Agent (http://127.0.0.1:8000) and the Character Agent (http://127.0.0.1:8001).
Only use those endpoints. Keep each turn short: a few sentences of narration, then the options.`

// Same A2A client tool as in Chapter 5: the Rules Agent and the Character Agent are still just tools.
const a2aClient = makeA2aClient({
  allowedEndpoints: [
    'http://127.0.0.1:8000', // Rules Agent
    'http://127.0.0.1:8001', // Character Agent
  ],
})

const agent = await createHarness({
  // TODO: Step 1 - Pass the INSTRUCTIONS to the harness
  instructions: INSTRUCTIONS,
  // TODO: Step 2 - Add the dice MCP server { dice: { url: 'http://127.0.0.1:8002/mcp' } } to mcpServers
  mcpServers: { dice: { url: 'http://127.0.0.1:8002/mcp' } },
  // TODO: Step 3 - Add the a2aClient tool to the harness
  tools: [a2aClient],
  // TODO: Step 4 - Disable the built-in tools
  builtinTools: [],
  // TODO: Step 5 - Name the session "dnd-campaign"
  session: { id: 'dnd-campaign' },
  // TODO: Step 6 - Force the response to use the StoryOutput schema (structuredOutputSchema)
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

app.listen(8009, () => console.log('D&D Game Master API (Strands harness) listening on http://localhost:8009'))
