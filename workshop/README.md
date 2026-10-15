# Once Upon Agentic AI: A Developer's Epic Journey into LangChain.js

![Header Image](images/header.jpeg)

_"Roll for Initiative... in TypeScript!"_

Welcome, brave adventurer, to the LangChain.js edition of the quest! These pages are the instructions of the [Once Upon Agentic AI](https://catalog.us-east-1.prod.workshops.aws/workshops/e1493217-4bc7-42f4-87d9-e231acd743bc/en-US) workshop, rewritten for the `langchain-port` branch of this repository. The story, the prompts and the JSON your Game Master returns are the same; the code is TypeScript on [LangChain.js](https://docs.langchain.com/oss/javascript/langchain/overview) and [Deep Agents](https://docs.langchain.com/oss/javascript/deepagents/overview) instead of Python on Strands. Chapter after chapter, you'll learn to create, equip, and command digital companions that can think, act, and collaborate like a legendary adventuring party.

## 🌐 The Complete Adventure Map

Your journey through the realms of AI agents is a progressive quest. **Each chapter builds upon the previous one**: complete them in order.

### 🐉 [Chapter 0: An Unexpected Adventure](0_pre_requisites.md)
**Install Node.js, clone the `langchain-port` branch, run `npm install`, check your AWS credentials**

### 🧙‍♂️ [Chapter 1: The Art of Agent Summoning](1_langchain_basics.md)
**Create and call your first agent**
- Build an agent with `createAgent({ model, systemPrompt })` and invoke it with `{ messages: [...] }`
- Pass a `ConsoleCallbackHandler` to watch every step between your code and the model

### ⚔️ [Chapter 2: The Adventurer's Arsenal](2_prebuilt_tools.md)
**Give your agent a ready-made tool**
- Add the `http_request` tool and let the agent query the D&D 5e API
- See the agent decide on its own when a tool is needed
- Bonus: Deep Agents' file and shell tools, each call gated by `humanInTheLoopMiddleware`

### 🔨 [Chapter 3: The Art of Magical Forging](3_custom_tools.md)
**Write your own tool**
- Turn a TypeScript function into a tool with `tool()` and a zod schema
- Write the description the model reads to know when and how to call it
- Watch the agent plan sixteen rolls for a 4d6-drop-lowest character

### 🌐 [Chapter 4: Planar Portals - MCP Integration](4_mcp_integration.md)
**Serve a tool over MCP and consume it**
- Expose the same `roll_dice` with the MCP TypeScript SDK's `McpServer` over streamable HTTP
- Connect an agent to it with `MultiServerMCPClient`

### 🏰 [Chapter 5: The Grand Alliance - Subagents](5_subagents.md)
**Make agents work together**
- Give the Rules Agent a ChromaDB knowledge base built from the D&D Basic Rules
- Turn the Rules Agent and the Character Agent into tools of a Game Master
- Combine them with the MCP dice server, remember the conversation with a checkpointer
- Return typed JSON with `responseFormat`

### 🎲 [Chapter 6: Web Interface Testing](6_ui_testing.md)
**Play with your Game Master in the browser**
- Connect the web UI to your Game Master on `http://127.0.0.1:8009`
- Follow each tool call in the terminal

### 🛡️ [Chapter 7: The Enchanted Armour - Deep Agents](7_deep_agents.md)
**Rebuild the Game Master with `createDeepAgent()`**
- Assemble it from `systemPrompt`, `tools`, `subagents`, `checkpointer` and `responseFormat`
- Resume a campaign across restarts with a session saved in SQLite
- Know when to pick Deep Agents and when to stay on `createAgent`

### 🧹 [Final Cleanup](cleanup.md)
**Stop your services and delete the generated files**

## 🎒 Preparing for Your Quest

Everything you need to install (Node.js, the repository, its dependencies) and the AWS access you need are covered in [Chapter 0](0_pre_requisites.md). Bring basic TypeScript or JavaScript knowledge, a terminal, and a sense of adventure! 🎲

## 🎯 How to Embark on Your Quest

### The Sacred Order of Learning

**⚠️ IMPORTANT**: Complete the chapters in order! Each builds upon the previous one's knowledge and skills.

1. **[Start with Chapter 0](0_pre_requisites.md)**: set up your environment
2. **Progress through each chapter**: don't skip ahead, each chapter introduces essential concepts
3. **Complete all TODOs**: each chapter has guided exercises, marked `// TODO` in the code
4. **Test your creations**: run your agents with `npm run ...` and see them come to life
5. **Experiment and explore**: try variations and push the boundaries

### Workshop Structure

Each chapter follows the same pattern:

- **📜 Chapter page**: instructions and background lore (these pages)
- **🎯 TODO exercises**: `// TODO: Step N` comments in the chapter's files; each one names the API to use
- **🧪 Testing instructions**: the `npm run` script that runs the chapter, and what you should see
- **🏆 Solution reference**: the `solution-langchain` branch has the answer written below each TODO

`npm run typecheck` type-checks every file. On the skeleton it reports an error at each unfinished TODO; those errors go away as you complete the steps.

### Getting Help

- **📚 LangChain.js documentation**: [docs.langchain.com](https://docs.langchain.com/oss/javascript/langchain/overview)
- **🔍 Solution branch**: `git diff origin/solution-langchain -- <file>` compares your version of a file with the answer
- **🎲 Experiment freely**: the best way to learn is by trying things!

## 🧙‍♂️ What is LangChain.js?

[LangChain.js](https://docs.langchain.com/oss/javascript/langchain/overview) is an open-source TypeScript framework for building agents and LLM applications. Its agents run on [LangGraph](https://docs.langchain.com/oss/javascript/langgraph/persistence), which handles state, persistence and pauses for human approval. Like a well-equipped adventuring party, it provides:

- **🎭 Agent creation**: `createAgent()` builds a tool-calling agent from a model, tools and a system prompt
- **⚔️ Tools**: `tool()` turns any function into a tool; middleware adds ready-made ones
- **🔄 Model flexibility**: one interface over many providers (different schools of magic); this workshop uses Amazon Bedrock
- **🌐 External connections**: MCP servers through `@langchain/mcp-adapters`
- **🏰 Multi-agent systems**: agents that call other agents as tools
- **🛡️ Deep Agents**: a pre-assembled agent with planning, files and subagents, built on the same pieces

### The Sacred Terminology

- **🤖 Agent**: a digital companion that can reason, decide, and use tools
- **🔧 Tool**: a function the agent can call, with a name, a description and a schema
- **📋 System prompt**: the character sheet defining your agent's personality and behavior
- **🧠 Model**: the source of intelligence; here Claude Sonnet 4.6 on Amazon Bedrock
- **🧩 Middleware**: code that hooks into the agent loop, to add tools or to pause before a tool call
- **🌐 MCP**: Model Context Protocol, for connecting agents to tools served by other processes
- **🏰 Subagent**: an agent another agent calls as a tool
- **💾 Checkpointer**: where LangGraph saves the conversation, so it continues across requests and restarts

## 🎓 Learning Objectives

By completing this workshop, you'll master:

- ✅ **Agent fundamentals**: create, configure and run agents with `createAgent`
- ✅ **Tool mastery**: use a ready-made tool and write your own with `tool()`
- ✅ **Safety**: gate tool calls behind your approval with `humanInTheLoopMiddleware`
- ✅ **External integration**: serve and consume tools over MCP
- ✅ **Multi-agent systems**: build a Game Master that delegates to specialized subagents
- ✅ **Deep Agents**: rebuild the same system with `createDeepAgent` and a persistent session

## 🚀 Ready to Begin?

Your adventure awaits! Start with [Chapter 0: An Unexpected Adventure](0_pre_requisites.md).

---

## 📚 Additional Resources

- **[LangChain.js documentation](https://docs.langchain.com/oss/javascript/langchain/overview)**: agents, tools, middleware, structured output
- **[Deep Agents documentation](https://docs.langchain.com/oss/javascript/deepagents/overview)**: the pre-assembled agent of Chapter 7
- **[Model Context Protocol](https://modelcontextprotocol.io/)** and its **[TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)**
- **[The original Strands workshop](https://catalog.us-east-1.prod.workshops.aws/workshops/e1493217-4bc7-42f4-87d9-e231acd743bc/en-US)**: the Python version these pages are adapted from
