/**
 * The http_request tool: lets an agent call a web API.
 *
 * Strands ships this as a vended tool; LangChain.js has no prebuilt HTTP tool, so this workshop
 * provides one. You do not need to change this file.
 */
import { tool } from 'langchain'
import { z } from 'zod'

const MAX_BODY = 20_000 // characters of the response body returned to the model

export const httpRequest = tool(
  async ({ method, url, headers, body }) => {
    const response = await fetch(url, { method, headers, body })
    const text = await response.text()
    return JSON.stringify({
      status: response.status,
      body: text.length > MAX_BODY ? `${text.slice(0, MAX_BODY)}… (truncated)` : text,
    })
  },
  {
    name: 'http_request',
    description: 'Send an HTTP request and return the status code and the response body.',
    schema: z.object({
      method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET').describe('The HTTP method'),
      url: z.string().describe('The full URL, e.g. https://www.dnd5eapi.co/api/2014/spells/fireball'),
      headers: z.record(z.string(), z.string()).optional().describe('Request headers'),
      body: z.string().optional().describe('Request body, for POST, PUT and PATCH'),
    }),
  },
)
