import { Agent } from '@strands-agents/sdk'
// TODO: Step 1 - Import McpClient from @strands-agents/sdk
import { McpClient } from '@strands-agents/sdk'

// TODO: Step 1 - Create an McpClient connecting to "http://localhost:8002/mcp" (a url builds a streamable HTTP transport)
const mcpClient = new McpClient({ url: 'http://localhost:8002/mcp' })

const gamemaster = new Agent({
  systemPrompt: `You are Lady Luck, the mystical keeper of dice and fortune in D&D adventures.
    You speak with theatrical flair and always announce dice rolls with appropriate drama.
    You know all about D&D mechanics, always use the appropriate tools when applicable - never make up results!`,
  // TODO: Step 2 - Add the MCP client to the gamemaster agent's tools
  tools: [mcpClient],
})

await gamemaster.invoke(
  'Help me create a new D&D character! Roll the strength, wisdom, charisma and intelligence abilities scores using 4d6 drop lowest method.',
)
await mcpClient.disconnect() // close the connection so the script can exit
