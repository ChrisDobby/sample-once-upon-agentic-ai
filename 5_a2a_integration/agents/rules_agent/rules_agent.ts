import { Agent, tool } from '@strands-agents/sdk'
import { A2AExpressServer } from '@strands-agents/sdk/a2a/express'
import { ChromaClient, type Collection } from 'chromadb'
import { z } from 'zod'

// The knowledge base is served by a local Chroma server (npm run ch5:chroma), see utils/create_knowledge_base.ts
const CHROMA = { host: 'localhost', port: 8005 }
let collection: Collection | undefined

/** Open the ChromaDB collection on first use (fails loudly if the knowledge base was not built). */
async function rulesCollection(): Promise<Collection> {
  collection ??= await new ChromaClient(CHROMA).getCollection({ name: 'dnd_basic_rules' })
  return collection
}

const queryDndRules = tool({
  name: 'query_dnd_rules',
  description: `Look up a D&D 5e rule in the Basic Rules knowledge base.

Use it for any question about game mechanics: ability checks, combat,
spellcasting, conditions, resting. Ask in plain English, as a player would.
The lookup is a semantic search over the D&D Basic Rules PDF: the three
passages closest to the question come back, each with its page number.

Example response:
    "[Page 74] When a hostile creature that you can see moves out of your reach, ...

    [Page 73] ..."

Notes:
    - Passages are about 1,000 characters long; the answer is usually in the first one.
    - Fails if the knowledge base has not been built yet (see utils/create_knowledge_base.ts).

Returns:
    The matching passages, each prefixed with its page reference, separated by blank lines.`,
  inputSchema: z.object({
    query: z
      .string()
      .describe('The rules question or topic, in plain English, e.g. "opportunity attack" or "what are the rules for dexterity checks".'),
  }),
  callback: async ({ query }) => {
    const results = await (await rulesCollection()).query({ queryTexts: [query], nResults: 3 })
    return results.documents[0]
      .map((doc, i) => `[Page ${results.metadatas[0][i]?.page}] ${doc}`)
      .join('\n\n')
  },
})

function createAgent(contextId: string): Agent {
  return new Agent({
    // TODO: Step 1 - Add the queryDndRules tool to the agent
    systemPrompt: `You are a D&D 5e rules expert. For each rules question, call query_dnd_rules once, then answer briefly with the page reference.`,
  })
}

// TODO: Step 2 - Create an A2AExpressServer with the createAgent factory (agentFactory) on port 8000
// TODO: Step 3 - Add the name "Rules Agent" to the server
// TODO: Step 4 - Add the description "D&D 5e rules lookup: fast, page-referenced answers from the Basic Rules knowledge base." to the server

// TODO: Step 5 - Start the A2A server
