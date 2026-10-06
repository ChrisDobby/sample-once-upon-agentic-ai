# Once Upon Agentic AI: A Developer's Epic Journey into LangChain.js

![Header Image](images/home.png)

_"Roll for Initiative... in TypeScript!"_

A hands-on workshop that teaches [LangChain.js](https://www.npmjs.com/package/langchain) by building a Dungeons & Dragons Game Master: one agent first, then tools, an MCP server, subagents, a web interface, and finally the same system rebuilt with [Deep Agents](https://www.npmjs.com/package/deepagents).

**The instructions live in the AWS workshop: [Once Upon Agentic AI](https://catalog.us-east-1.prod.workshops.aws/workshops/e1493217-4bc7-42f4-87d9-e231acd743bc/en-US/0-pre-requisites).** That workshop is written for the Strands Agents SDK in Python; this repository is a LangChain.js port of its code. The chapters, prompts and JSON responses are the same, but the APIs are LangChain's (`createAgent`, `tool()`, `MultiServerMCPClient`, `createDeepAgent`, …). Chapter 5 uses in-process subagents instead of A2A, and several steps differ from the workshop text: see [Differences from the Strands workshop](#differences-from-the-strands-workshop). Each step's `// TODO` comment names the API to use.

## Quick Start

```bash
git clone https://github.com/aws-samples/sample-once-upon-agentic-ai.git
cd sample-once-upon-agentic-ai
npm install
```

You need Node.js 22 or newer. The files run directly with [`tsx`](https://tsx.is/), with no build step. `npm run typecheck` type-checks them; on `main` it reports an error at each unfinished TODO, and those errors go away as you complete the steps.

Every chapter runs on Claude Sonnet 4.6 on Amazon Bedrock, in `us-west-2`: see [`shared/model.ts`](shared/model.ts). You need AWS credentials with access to that model, see [Chapter 0](https://catalog.us-east-1.prod.workshops.aws/workshops/e1493217-4bc7-42f4-87d9-e231acd743bc/en-US/0-pre-requisites).

## The Adventure Map

| Chapter | Folder | What you build | Run it |
|---|---|---|---|
| 0. An Unexpected Adventure | [instructions](https://catalog.us-east-1.prod.workshops.aws/workshops/e1493217-4bc7-42f4-87d9-e231acd743bc/en-US/0-pre-requisites) | Set up Node.js and this repository | |
| 1. The Art of Agent Summoning | [`1_langchain_basics/`](1_langchain_basics/) | Your first agent with `createAgent`, a system prompt, a console tracer | `npm run ch1` |
| 2. The Adventurer's Arsenal - Prebuilt Tools | [`2_prebuilt_tools/`](2_prebuilt_tools/) | A ready-made `http_request` tool on the D&D 5e API; bonus: Deep Agents' file and shell tools gated by `humanInTheLoopMiddleware` | `npm run ch2`, `npm run ch2:bonus` |
| 3. The Art of Magical Forging | [`3_custom_tools/`](3_custom_tools/) | Your own `tool()`: the dice roller | `npm run ch3` |
| 4. Planar Portals - MCP | [`4_mcp_integration/`](4_mcp_integration/) | The same dice roller served over MCP, and an agent that consumes it with `MultiServerMCPClient` | `npm run ch4:server`, then `npm run ch4:client` |
| 5. The Grand Alliance - Subagents | [`5_subagents/`](5_subagents/) | A Rules Agent and a Character Agent as subagents of a Game Master with memory and structured output | see [Chapter 5](#chapter-5-services) |
| 6. Web Interface Testing | [web UI](https://aws-samples.github.io/sample-once-upon-agentic-ai/) | Play with your Game Master through the browser | |
| 7. The Enchanted Armour - Deep Agents | [`7_deep_agents/`](7_deep_agents/) | The Game Master API rebuilt with `createDeepAgent()` and a session saved on disk | `npm run ch7` |
| Final cleanup | [instructions](https://catalog.us-east-1.prod.workshops.aws/workshops/e1493217-4bc7-42f4-87d9-e231acd743bc/en-US/cleanup) | Stop your services and delete the generated files (`5_subagents/utils/dnd_knowledge_base/`, `.agent/`) | |

Complete the chapters in order: each one reuses what the previous one built.

LangChain agents print nothing on their own. The chapters use [`shared/print.ts`](shared/print.ts), given code, to show each tool call, tool result and answer as the agent works.

### Chapter 5 services

Chapter 5 runs three services side by side, each in its own terminal, from the repository root:

| Terminal | Command | Port |
|---|---|---|
| 1 | `npm run ch4:server` (the dice MCP server from chapter 4) | 8002 |
| 2 | `npm run ch5:chroma` (the Chroma server holding the rules knowledge base) | 8005 |
| 3 | `npm run ch5:gamemaster` (or `npm run ch7` for chapter 7) | 8009 |

The Rules Agent and the Character Agent are not services: they run inside the Game Master, which calls each one as a tool.

Before the first run, build the knowledge base: put `DnD_BasicRules_2018.pdf` in `5_subagents/utils/`, start the Chroma server, then run `npm run ch5:kb`. The JavaScript Chroma client talks to a server rather than embedding the database, which is why Chroma is a separate service. The `chroma` command comes with the `chromadb` npm package, so no Python is needed. The embedding model is downloaded on first use.

## Differences from the Strands workshop

| Chapter | In the LangChain.js port |
|---|---|
| All | Agents come from `createAgent({ model, tools, systemPrompt })` and are invoked with `{ messages: [...] }`. The model is explicit, from `shared/model.ts`. |
| 1 | Debug logging is a `ConsoleCallbackHandler` passed in the invoke options' `callbacks`. It logs every chain, model and tool step. |
| 2 | LangChain.js has no prebuilt HTTP tool, so [`shared/http_request.ts`](shared/http_request.ts) provides one. In the bonus, the file and shell tools come from Deep Agents' `createFilesystemMiddleware` with a `LocalShellBackend`, and approvals from `humanInTheLoopMiddleware`. Approval pauses the run: the given loop asks you in the terminal and resumes it, which is why the agent needs a checkpointer. |
| 3 | A tool is `tool(fn, { name, description, schema })` with a zod schema; parameter descriptions come from `.describe()`. |
| 4 | The server is unchanged from the Strands TypeScript port. The client is `MultiServerMCPClient`; `prefixToolNameWithServerName: false` keeps the tool's name `roll_dice` instead of `dice_roll_dice`. |
| 5 | A2A is replaced by subagents: the Rules and Character agents are `createAgent` instances with a `name` and a `description`, and the Game Master calls each through a tool built by `subagentTool()`. Ports 8000 and 8001 are gone. Structured output is `responseFormat`. The schema has a title (`.meta({ title: 'StoryOutput' })`), because LangChain otherwise renames the output tool on every request and the model can call a stale name. Conversation memory needs a checkpointer and a thread id. |
| 7 | `createDeepAgent()` replaces `createHarness()`. Its built-in todo and file tools cannot be removed, so there is no "disable the built-in tools" step; files live in the agent's state, not on disk. The subagents are the Chapter 5 agents, called through the Deep Agents `task` tool. The `dnd-campaign` session is a thread id in a SQLite checkpointer at `.agent/sessions.sqlite`. Chapter 7 runs on Sonnet 4.6 like the other chapters, not Opus 5. |

## Branches

- `main`: the skeleton you clone, with `// TODO` markers to fill in.
- `solution-langchain`: the same files with the answers written below each TODO. Use it if you get stuck.

## Dependencies

The workshop ships no lockfile (`package-lock.json` is gitignored), so `npm install` installs the latest compatible releases. The floors in `package.json` are the releases this port was written against: `langchain` 1.5, `@langchain/langgraph` 1.4, `@langchain/mcp-adapters` 2.0 and `deepagents` 1.14. The chapter 4 MCP server stays on `@modelcontextprotocol/sdk` `^1`; the LangChain MCP client uses the separate v2 client packages and talks to it without trouble. Chapter 7's SQLite checkpointer depends on `better-sqlite3`, a native module that installs from prebuilt binaries on common platforms. If a chapter breaks against a newer release, please open an issue.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

_"The best way to predict the future is to build the agents that will create it."_ - Modern Developer Wisdom

_Happy coding, Agent Master! 🐉⚔️🧙‍♂️_
