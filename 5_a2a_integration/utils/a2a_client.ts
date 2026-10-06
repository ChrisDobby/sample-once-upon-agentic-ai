/**
 * The `a2a_client` tool: lets an agent discover remote A2A agents and send them messages.
 *
 * The Python SDK ships this as a vended tool (`strands.vended_tools.make_a2a_client`); the
 * TypeScript SDK has the building block (`A2AAgent`) but not the tool, so this workshop
 * provides it. You do not need to change this file.
 */
import { tool } from '@strands-agents/sdk'
import { A2AAgent } from '@strands-agents/sdk/a2a'
import { z } from 'zod'

const AGENT_CARD_PATH = '/.well-known/agent-card.json'

export interface A2aClientOptions {
  /** Base URLs of the A2A agents the model is allowed to reach, e.g. "http://127.0.0.1:8000". */
  allowedEndpoints: string[]
}

export function makeA2aClient({ allowedEndpoints }: A2aClientOptions) {
  const endpoints = allowedEndpoints.map((url) => url.replace(/\/+$/, ''))
  const remoteAgents = new Map<string, A2AAgent>()

  function remoteAgent(url: string): A2AAgent {
    const endpoint = url.replace(/\/+$/, '')
    if (!endpoints.includes(endpoint)) {
      throw new Error(`Endpoint ${url} is not allowed. Allowed endpoints: ${endpoints.join(', ')}`)
    }
    let agent = remoteAgents.get(endpoint)
    if (!agent) {
      agent = new A2AAgent({ url: endpoint })
      remoteAgents.set(endpoint, agent)
    }
    return agent
  }

  return tool({
    name: 'a2a_client',
    description: `Talk to remote agents over the A2A protocol.

- action "discover": returns the agent card (name, description, skills) of every reachable agent.
  Call it first to learn which agent handles what.
- action "send": sends a message to one agent (its url, from discover) and returns its answer.

Only these endpoints are reachable: ${endpoints.join(', ')}.`,
    inputSchema: z.object({
      action: z.enum(['discover', 'send']).describe('"discover" to list the agents, "send" to message one'),
      url: z.string().optional().describe('For "send": the base URL of the agent to message'),
      message: z.string().optional().describe('For "send": the message to the agent, in plain English'),
    }),
    callback: async ({ action, url, message }) => {
      if (action === 'discover') {
        return Promise.all(
          endpoints.map(async (endpoint) => {
            try {
              const response = await fetch(endpoint + AGENT_CARD_PATH)
              if (!response.ok) throw new Error(`HTTP ${response.status}`)
              const card = await response.json()
              return { url: endpoint, name: card.name, description: card.description, skills: card.skills ?? [] }
            } catch (error) {
              return { url: endpoint, error: `Agent unreachable: ${(error as Error).message}` }
            }
          }),
        )
      }
      if (!url || !message) {
        throw new Error('The "send" action needs both a url and a message')
      }
      const result = await remoteAgent(url).invoke(message)
      return result.toString()
    },
  })
}
