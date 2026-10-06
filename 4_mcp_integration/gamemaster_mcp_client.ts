import { createAgent } from 'langchain'
import { model } from '../shared/model.ts'
import { runAndPrint } from '../shared/print.ts'
// TODO: Step 1 - Import MultiServerMCPClient from @langchain/mcp-adapters
import { MultiServerMCPClient } from '@langchain/mcp-adapters'

// TODO: Step 1 - Create a MultiServerMCPClient with one server, dice: { url: "http://localhost:8002/mcp", transport: "http" },
//   and prefixToolNameWithServerName: false so the tool keeps its name, roll_dice
const mcpClient = new MultiServerMCPClient({
  mcpServers: { dice: { url: 'http://localhost:8002/mcp', transport: 'http' } },
  prefixToolNameWithServerName: false,
})

const gamemaster = createAgent({
  model,
  systemPrompt: `You are Lady Luck, the mystical keeper of dice and fortune in D&D adventures.
    You speak with theatrical flair and always announce dice rolls with appropriate drama.
    You know all about D&D mechanics, always use the appropriate tools when applicable - never make up results!`,
  // TODO: Step 2 - Add the MCP tools (await mcpClient.getTools()) to the gamemaster agent
  tools: await mcpClient.getTools(),
})

await runAndPrint(gamemaster, {
  messages: [
    {
      role: 'user',
      content:
        'Help me create a new D&D character! Roll the strength, wisdom, charisma and intelligence abilities scores using 4d6 drop lowest method.',
    },
  ],
})
await mcpClient.close() // close the connection so the script can exit
