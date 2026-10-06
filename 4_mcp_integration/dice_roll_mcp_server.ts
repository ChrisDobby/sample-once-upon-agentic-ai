import { z } from 'zod'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
// TODO: Step 1 - Import McpServer from @modelcontextprotocol/sdk/server/mcp.js
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

const PORT = 8002

const log = (message: string) => console.log(`${new Date().toISOString()} - INFO - ${message}`)

function rollDice(faces: number = 6): number {
  if (faces < 1) {
    throw new Error('Dice must have at least 1 face')
  }

  const result = Math.floor(Math.random() * faces) + 1

  log(`🎲 DICE ROLL: d${faces} = ${result}`)

  return result
}

const ROLL_DICE_DESCRIPTION = `Roll one die with a given number of faces and return the result.

Use it every time the game needs a random roll: ability scores, attack rolls,
saving throws, damage. Call it once per die; for "4d6 drop lowest", call it
four times with faces=6 and discard the lowest result yourself.

Example response: 14

Notes:
    - One die per call: there is no count parameter.
    - Each roll is independent and uniformly random.

Returns:
    An integer between 1 and faces, inclusive.`

// The server is stateless: every HTTP request gets a fresh McpServer and transport.
function createServer(): McpServer {
  // TODO: Step 1 - Create an McpServer named "dice-roll"
  const mcp = new McpServer({ name: 'dice-roll', version: '1.0.0' })

  // TODO: Step 2 - Register rollDice as the MCP tool "roll_dice" with registerTool
  //   - description: ROLL_DICE_DESCRIPTION
  //   - inputSchema: { faces: z.number().int().default(6).describe('Number of faces on the die, 1 or more. Use 20 for a d20, 6 for a d6, 100 for a percentile die. Defaults to 6.') }
  //   - callback: return { content: [{ type: 'text', text: String(rollDice(faces)) }] }
  mcp.registerTool(
    'roll_dice',
    {
      description: ROLL_DICE_DESCRIPTION,
      inputSchema: {
        faces: z
          .number()
          .int()
          .default(6)
          .describe('Number of faces on the die, 1 or more. Use 20 for a d20, 6 for a d6, 100 for a percentile die. Defaults to 6.'),
      },
    },
    async ({ faces }) => ({ content: [{ type: 'text', text: String(rollDice(faces)) }] }),
  )

  return mcp
}

const app = createMcpExpressApp()

app.post('/mcp', async (req, res) => {
  const mcp = createServer()
  // TODO: Step 3 - Create the streamable HTTP transport: a StreamableHTTPServerTransport with sessionIdGenerator: undefined (stateless)
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  res.on('close', () => {
    transport.close()
    mcp.close()
  })
  await mcp.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

console.log('Starting D&D Dice Roll MCP Server...')
app.listen(PORT, () => log(`MCP server listening on http://localhost:${PORT}/mcp`))
