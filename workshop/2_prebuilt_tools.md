# ⚔️ Chapter 2: Prebuilt Tools - The Adventurer's Arsenal

![Header Image](images/header_2.png)

# 🎯 Quest Objective

Tools are the primary mechanism for extending agent capabilities, enabling them to perform actions beyond text generation. Tools allow agents to interact with external systems, access data, and manipulate their environment. In this chapter you give your agent its first **prebuilt tool**, `http_request`, so your Game Master can look up spells and monsters on a real D&D API.

![Chapter 2 architecture](../images/chapter2.png)

Open and modify [`2_prebuilt_tools/agent_with_prebuilt_tools.ts`](../2_prebuilt_tools/agent_with_prebuilt_tools.ts).

## Your Arsenal: Prebuilt Tools

LangChain.js doesn't ship tools inside the agent package itself. Ready-made tools come from integration packages and from **middleware**: code that plugs into the agent loop and can add tools to it. You'll meet both kinds in this chapter:

- **`http_request`** (main quest): calls external APIs (GET, POST, ...). LangChain.js has no prebuilt HTTP tool, so the workshop provides one in [`shared/http_request.ts`](../shared/http_request.ts). Read it: it is an ordinary `tool()`, the same kind you will write yourself in Chapter 3.
- **File and shell tools** (bonus quest): `ls`, `read_file`, `write_file`, `edit_file`, `delete`, `glob`, `grep` and `execute`, added by the `deepagents` package's `createFilesystemMiddleware`.

See [tools](https://docs.langchain.com/oss/javascript/langchain/tools) and [prebuilt middleware](https://docs.langchain.com/oss/javascript/langchain/middleware/built-in) in the documentation.

## Step 1: Equip Your Agent with `http_request`

```typescript
// TODO: Step 1 - Import httpRequest from ../shared/http_request.ts
```
```typescript
// TODO: Step 1 - Add the httpRequest tool to your agent
```

Import `httpRequest`, then put it in the agent's `tools` list. The system prompt already tells your Game Master where to find spells and monsters: the free [D&D 5e API](https://www.dnd5eapi.co/). The tool takes a `method`, a `url`, and optional `headers` and `body`, and returns the status code and the response body.

## Step 2: Test Your Quest

Once you've completed both TODOs, run your script:

```bash
npm run ch2
```

The script runs the agent through `runAndPrint`, from [`shared/print.ts`](../shared/print.ts), which prints each tool call (`🔧 Tool: ...`), each tool result (`✓ ...`) and the answer as the agent works. Your agent will:

1. Receive the question "What does the Fireball spell do, and how much damage does it deal?"
2. Decide that it needs the `http_request` tool:
   ```
   🔧 Tool: http_request {"method":"GET","url":"https://www.dnd5eapi.co/api/2014/spells/fireball"}
   ✓ http_request: {"status":200,"body":"{\"index\":\"fireball\",...
   ```
3. Answer from the data it received (8d6 fire damage, half on a successful save!)

This demonstrates that your agent can autonomously select and use tools to answer questions.

# 🌟 Bonus Quest: The Multi-Tool Challenge (optional)

Ready to go deeper? Open [`2_prebuilt_tools/bonus_quest.ts`](../2_prebuilt_tools/bonus_quest.ts). Kiro the Grey Hat, a wizard of code magic, will write a Fibonacci script to a file and run it: file and shell tools, plus one safeguard. Each step below has two TODOs in the code: the import at the top of the file, and its use in the agent's `middleware` list.

**⚠️ Windows users:** the `execute` tool runs commands through your system shell, which is `cmd.exe` on native Windows, and the agent tends to write Unix commands. The bonus quest works best on macOS, Linux or **WSL (Windows Subsystem for Linux)**.

## Step 1: Equip the Tools

```typescript
// TODO: Step 1 - Import createFilesystemMiddleware and LocalShellBackend from deepagents
```
```typescript
// TODO: Step 1 - Add the file and shell tools: createFilesystemMiddleware with a LocalShellBackend rooted at process.cwd()
```

`createFilesystemMiddleware` adds the file tools to the agent. Where those files live is up to its **backend**. A `LocalShellBackend` reads and writes your real disk, under the `rootDir` you give it, and it can run commands, so it adds the `execute` tool as well. Pass `{ backend: new LocalShellBackend({ rootDir: process.cwd() }) }`. See [backends](https://docs.langchain.com/oss/javascript/deepagents/backends) in the Deep Agents documentation.

## Step 2: Add the Safeguard

```typescript
// TODO: Step 2 - Import humanInTheLoopMiddleware from langchain
```
```typescript
// TODO: Step 2 - Ask for your approval before each tool call: humanInTheLoopMiddleware with interruptOn set to true
//   for every tool the middleware adds: ls, read_file, write_file, edit_file, delete, glob, grep and execute
```

Writing files and running commands change your system. LangChain lets you gate tool calls behind your approval with `humanInTheLoopMiddleware`: its `interruptOn` option maps each tool name to `true` (ask first) or `false` (let it through). A tool missing from the map runs without asking, which is why you list all eight. See [human-in-the-loop](https://docs.langchain.com/oss/javascript/langchain/human-in-the-loop).

When the agent wants to call a gated tool, the run **pauses**: it stops and returns an interrupt with the pending tool calls. The loop at the bottom of the file (given code) asks you about each one in the terminal, then resumes the run with your decisions:

```
Approve "write_file"?
  Input: {"file_path":"/.../fibonacci_scroll.py","content":"..."} (y/n):
```

Type `y` and press Enter to allow the tool to execute, or `n` to refuse. To resume, the run must have been saved somewhere: that is the `checkpointer: new MemorySaver()` already in the agent. Without Step 2, the agent writes files and runs commands **without asking you anything**: try it once with Step 2 left out to see the difference.

## Step 3: Cast the Spell

```bash
npm run ch2:bonus
```

Approve each call as it comes:

1. `Approve "write_file"?`: Kiro writes the scroll (for example `fibonacci_scroll.py` or `.js`) at the **repository root**, the `process.cwd()` of `npm run`. Type `y`.
2. `Approve "execute"?`: Kiro casts the scroll, for example `python3 fibonacci_scroll.py` or `node fibonacci_scroll.js`. Type `y` for each call. Kiro may also look around first with `ls` or `read_file`: each of those asks too.
3. Kiro reports the first ten Fibonacci numbers.

Try `n` on one of the calls to see how the agent reacts to a refusal: it receives "The user denied this action" as the tool's result and has to make do.

## Tool Consent & Safety

**Approval prompts**: the tools run with the permissions of your Node.js process, and a `LocalShellBackend` has no sandbox. With `humanInTheLoopMiddleware`, nothing that alters your system happens without your explicit approval.

**Letting some tools through**: set a tool to `false` in `interruptOn` (or leave it out) to let it run freely while the others still ask, for example the read-only `ls`, `read_file`, `glob` and `grep`. Instead of `true` you can also pass `{ allowedDecisions: ['approve', 'reject'] }` to choose which answers a reviewer may give; the middleware also supports `edit`, to change a call's arguments before it runs.

# 🎉 Quest Complete!

Congratulations! You've equipped your agent with the `http_request` tool, and it can now decide on its own when to use it.

**What you've learned:**
- ✅ How to add a ready-made tool to your agent
- ✅ How an agent autonomously decides when to use a tool
- ✅ Tool consent and safety (covered with the bonus quest's `humanInTheLoopMiddleware`)

**Next Adventure**: Journey to [Chapter 3](3_custom_tools.md), where you'll create custom tools for your specific use cases!

---

_"The right tool at the right moment makes all the difference."_ 🛠️✨
