# Once Upon Agentic AI: A Developer's Epic Journey into the Strands SDK

![Header Image](images/home.png)

_"Roll for Initiative... in TypeScript!"_

A hands-on workshop that teaches the [Strands Agents TypeScript SDK](https://strandsagents.com/) by building a Dungeons & Dragons Game Master: one agent first, then tools, an MCP server, remote agents over A2A, a web interface, and finally the same system rebuilt with Strands harness.

**The instructions live in the AWS workshop: [Once Upon Agentic AI](https://catalog.us-east-1.prod.workshops.aws/workshops/e1493217-4bc7-42f4-87d9-e231acd743bc/en-US/0-pre-requisites).** The workshop is written for the Python SDK; this repository is a TypeScript port of its code. The chapters, ports, prompts and JSON responses are the same. The identifiers follow the TypeScript SDK (`systemPrompt`, `tool({ inputSchema })`, `McpClient`, `A2AExpressServer`, `createHarness`, …), and a few steps differ from the workshop text: see [Differences from the Python workshop](#differences-from-the-python-workshop). Each step's `// TODO` comment names the TypeScript API to use.

## Quick Start

```bash
git clone https://github.com/aws-samples/sample-once-upon-agentic-ai.git
cd sample-once-upon-agentic-ai
npm install
```

You need Node.js 22 or newer. The files run directly with [`tsx`](https://tsx.is/), with no build step. `npm run typecheck` type-checks them; on `main` it reports an error at each unfinished TODO, and those errors go away as you complete the steps.

The agents run on Amazon Bedrock by default (Claude Sonnet 4.6; chapter 7 uses Claude Opus 5). You need AWS credentials with access to those models, see [Chapter 0](https://catalog.us-east-1.prod.workshops.aws/workshops/e1493217-4bc7-42f4-87d9-e231acd743bc/en-US/0-pre-requisites).

## The Adventure Map

| Chapter | Folder | What you build | Run it |
|---|---|---|---|
| 0. An Unexpected Adventure | [instructions](https://catalog.us-east-1.prod.workshops.aws/workshops/e1493217-4bc7-42f4-87d9-e231acd743bc/en-US/0-pre-requisites) | Set up Node.js and this repository | |
| 1. The Art of Agent Summoning | [`1_strands_basics/`](1_strands_basics/) | Your first agent, a system prompt, debug logs | `npm run ch1` |
| 2. The Adventurer's Arsenal - Vended Tools | [`2_vended_tools/`](2_vended_tools/) | Tools that ship with the SDK (vended tools): `httpRequest` on the D&D 5e API; bonus: `makeShell()` + `fileEditor` gated by `HumanInTheLoop` | `npm run ch2`, `npm run ch2:bonus` |
| 3. The Art of Magical Forging | [`3_custom_tools/`](3_custom_tools/) | Your own `tool()`: the dice roller | `npm run ch3` |
| 4. Planar Portals - MCP | [`4_mcp_integration/`](4_mcp_integration/) | The same dice roller served over MCP, and an agent that consumes it | `npm run ch4:server`, then `npm run ch4:client` |
| 5. The Grand Alliance - A2A | [`5_a2a_integration/`](5_a2a_integration/) | Rules Agent + Character Agent over A2A, a Game Master orchestrator with structured output | see [Chapter 5](#chapter-5-services) |
| 6. Web Interface Testing | [web UI](https://aws-samples.github.io/sample-once-upon-agentic-ai/) | Play with your Game Master through the browser | |
| 7. The Enchanted Armour - Strands harness | [`7_strands_harness/`](7_strands_harness/) | The Game Master API rebuilt with `createHarness()` | `npm run ch7` |
| Final cleanup | [instructions](https://catalog.us-east-1.prod.workshops.aws/workshops/e1493217-4bc7-42f4-87d9-e231acd743bc/en-US/cleanup) | Stop your services and delete the generated files | |

Complete the chapters in order: each one reuses what the previous one built.

### Chapter 5 services

Chapter 5 runs several services side by side, each in its own terminal, from the repository root:

| Terminal | Command | Port |
|---|---|---|
| 1 | `npm run ch4:server` (the dice MCP server from chapter 4) | 8002 |
| 2 | `npm run ch5:chroma` (the Chroma server holding the rules knowledge base) | 8005 |
| 3 | `npm run ch5:rules` | 8000 |
| 4 | `npm run ch5:character` | 8001 |
| 5 | `npm run ch5:gamemaster` (or `npm run ch7` for chapter 7) | 8009 |

Before the first run, build the knowledge base: put `DnD_BasicRules_2018.pdf` in `5_a2a_integration/utils/`, start the Chroma server, then run `npm run ch5:kb`. The Python version embedded ChromaDB in the process. The JavaScript Chroma client talks to a server instead, which is why it is a separate service. The `chroma` command comes with the `chromadb` npm package, so no Python is needed. The embedding model is downloaded on first use.

The Python SDK's `make_a2a_client` vended tool has no TypeScript counterpart yet. [`5_a2a_integration/utils/a2a_client.ts`](5_a2a_integration/utils/a2a_client.ts) provides the same `a2a_client` tool (discover the allowed agents, send them a message), built on the SDK's `A2AAgent`. Chapters 5 and 7 import it as given code.

## Differences from the Python workshop

| Chapter | In the TypeScript port |
|---|---|
| 1 | Step 1 is `configureLogging(console)`. The TypeScript SDK logs much less at debug level than the Python one, so expect few extra lines. To watch each model call, add a hook such as `agent.addHook(AfterModelCallEvent, ...)`. |
| 2 | `httpRequest` replaces `http_request`. In the bonus, the shell tool comes from `makeShell()`, and `HumanInTheLoop` goes in `interventions`, not in hooks. |
| 3 | A tool is a `tool({ name, description, inputSchema, callback })` call with a zod schema, not a decorated function with a docstring. The parameter descriptions come from `.describe()`. |
| 4 | The server is an `McpServer` from `@modelcontextprotocol/sdk`. The port belongs to the HTTP listener, not the server constructor, and Step 3 creates the streamable HTTP transport. On the client side, `new McpClient({ url })` builds the transport, so there is no `streamablehttp_client` to import. |
| 5 | The Rules and Character agents' name and description go on the `A2AExpressServer`, not on the `Agent`, so Steps 2 to 4 are in a different order. The `a2a_client` tool comes from `utils/a2a_client.ts`. The knowledge base needs a Chroma server (see [Chapter 5 services](#chapter-5-services)). The Python `NewlineAfterTurn` hook is gone, because the TypeScript printer already ends every answer with a newline. |
| 7 | `createHarness()` is async (`await createHarness({...})`), and its options are camelCase: `mcpServers`, `builtinTools`, `structuredOutputSchema`. |

## Branches

- `main`: the skeleton you clone, with `// TODO` markers to fill in.
- `solution-typescript`: the same files with the answers written below each TODO. Use it if you get stuck.

## Dependencies

The workshop ships no lockfile (`package-lock.json` is gitignored), so `npm install` installs the latest compatible releases. The floors in `package.json` are the releases this port was written against: `@strands-agents/sdk` 1.19 and `@strands-agents/harness` 0.1. `@modelcontextprotocol/sdk` stays on `^1`, the range the Strands SDK supports. If a chapter breaks against a newer release, please open an issue.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

_"The best way to predict the future is to build the agents that will create it."_ - Modern Developer Wisdom

_Happy coding, Agent Master! 🐉⚔️🧙‍♂️_
