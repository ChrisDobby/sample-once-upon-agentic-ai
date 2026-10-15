/**
 * A local stand-in for the Chapter 7 API, so the web interface can play with the Game Master on AgentCore.
 * Browsers can't sign requests to AgentCore with your AWS credentials; this proxy can. It serves the routes
 * the web interface calls on http://127.0.0.1:8009 and forwards each one to InvokeAgentRuntime.
 *
 * Run it with the ARN printed by `agentcore status`:
 *     AGENT_RUNTIME_ARN=arn:aws:bedrock-agentcore:... npm run ch8:proxy
 */
import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express from 'express'
// TODO: Step 5 - Import BedrockAgentCoreClient and InvokeAgentRuntimeCommand from @aws-sdk/client-bedrock-agentcore
import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from '@aws-sdk/client-bedrock-agentcore'

const AGENT_RUNTIME_ARN = process.env.AGENT_RUNTIME_ARN
if (!AGENT_RUNTIME_ARN) {
  console.error('Set AGENT_RUNTIME_ARN to the ARN printed by `agentcore status`')
  process.exit(1)
}
// The region is part of the ARN: arn:aws:bedrock-agentcore:<region>:<account>:runtime/<id>
const client = new BedrockAgentCoreClient({ region: AGENT_RUNTIME_ARN.split(':')[3] })

// One AgentCore session per proxy run: the same microVM, and the same campaign, until you restart the proxy.
// AgentCore wants at least 33 characters; a UUID has 36.
const runtimeSessionId = randomUUID()

/** Sends one action to the Game Master on AgentCore and returns its JSON answer. */
async function invoke(payload: Record<string, unknown>): Promise<unknown> {
  // TODO: Step 5 - Send an InvokeAgentRuntimeCommand with agentRuntimeArn, runtimeSessionId,
  //   payload: JSON.stringify(payload) and contentType: 'application/json'
  const response = await client.send(
    new InvokeAgentRuntimeCommand({
      agentRuntimeArn: AGENT_RUNTIME_ARN,
      runtimeSessionId,
      payload: JSON.stringify(payload),
      contentType: 'application/json',
    }),
  )
  return JSON.parse(await response.response!.transformToString())
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

app.get('/messages', async (req, res) => {
  res.json(await invoke({ action: 'messages' }))
})

app.get('/user/:userName', async (req, res) => {
  res.json(await invoke({ action: 'user', userName: req.params.userName }))
})

app.post('/inquire', async (req, res) => {
  console.log(`Inquire: ${req.body.question}`)
  try {
    res.json(await invoke({ action: 'inquire', question: req.body.question }))
  } catch (error) {
    console.log(`Error occurred: ${error}`)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(8009, '127.0.0.1', () => {
  console.log(`Proxy for ${AGENT_RUNTIME_ARN} (session ${runtimeSessionId})`)
  console.log('listening on http://127.0.0.1:8009')
})
