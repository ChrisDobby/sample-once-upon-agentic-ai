# ☁️ Chapter 8: The Flying Citadel - Deploy to Amazon Bedrock AgentCore

![Header Image](images/header_7.png)

# 🎯 Quest Objective

Your Game Master lives on your laptop, behind three terminals. In this chapter you move it to the cloud: you deploy the Chapter 7 Game Master to [Amazon Bedrock AgentCore Runtime](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agents-tools-runtime.html) with the [AgentCore CLI](https://github.com/aws/agentcore-cli), then play with it from the same web interface.

**What is AgentCore Runtime?** A serverless host for agents, whatever framework they use. You hand it a container; it runs one isolated **microVM per session**, scales from zero, signs every call with AWS credentials (IAM), and sends the logs to CloudWatch. Your agent only has to honour a small HTTP contract:

| Path | Method | What AgentCore expects |
|---|---|---|
| `/ping` | GET | `{"status": "Healthy"}` when the agent is ready |
| `/invocations` | POST | Takes a JSON payload, returns JSON (or a stream) |

The container listens on `0.0.0.0:8080` and runs on **arm64**. Every invocation carries a session id in the `X-Amzn-Bedrock-AgentCore-Runtime-Session-Id` header: calls with the same session id reach the same microVM. See the [HTTP protocol contract](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-http-protocol-contract.html).

**⚠️ This chapter creates AWS resources** (an AgentCore runtime, an ECR repository, a CodeBuild project, an IAM role, a CloudFormation stack) and is billed while you use it. The [final cleanup](cleanup.md) removes them. If you share an AWS account with other players, each of you deploys your own runtime, under your own name ([Part 2, Step 2](#step-2-name-your-project)).

## From Three Terminals to One Container

In Chapter 5 the Game Master reached the dice server on `127.0.0.1:8002` and Chroma on `localhost:8005`. A runtime in AWS can't reach your laptop, so the container brings both along:

```
┌──────────────────────── AgentCore Runtime microVM ────────────────────────┐
│                                                                           │
│  8_agentcore/start.sh                                                     │
│   ├─ chroma run (127.0.0.1:8005)  ◄── the knowledge base from Chapter 5   │
│   ├─ dice MCP server (:8002)      ◄── the server from Chapter 4           │
│   └─ Game Master (0.0.0.0:8080)   ◄── /ping and /invocations              │
│                                                                           │
└───────────────────────────────────▲───────────────────────────────────────┘
                                    │ InvokeAgentRuntime (signed with SigV4)
              agentcore invoke ─────┤
                                    │
  web interface ──► 8_agentcore/invoke_proxy.ts (127.0.0.1:8009)
```

The Game Master itself is the Chapter 7 one: same instructions, same tools and subagents, same `StoryOutput`. Only the way it is served changes, from three routes to the AgentCore contract.

Here is what the chapter's files do:

| File | Role | You change it? |
|---|---|---|
| [`8_agentcore/gamemaster_agentcore.ts`](../8_agentcore/gamemaster_agentcore.ts) | The Game Master behind `/ping` and `/invocations` | Steps 1 to 4 |
| [`8_agentcore/invoke_proxy.ts`](../8_agentcore/invoke_proxy.ts) | Serves the web interface's routes locally and forwards them to AgentCore | Step 5 |
| [`8_agentcore/start.sh`](../8_agentcore/start.sh) | Starts Chroma and the dice server, waits for them, then the Game Master | no |
| [`8_agentcore/Dockerfile`](../8_agentcore/Dockerfile) | Builds the image from the repository root | no |
| [`agentcore/agentcore.json`](../agentcore/agentcore.json) | The AgentCore CLI project: one runtime, `GameMaster`, built as a container | no |

## Part 1: Fit the Game Master to the AgentCore Contract

Open [`8_agentcore/gamemaster_agentcore.ts`](../8_agentcore/gamemaster_agentcore.ts). The top of the file is Chapter 7: the schema, the instructions, the MCP client and `createDeepAgent`. Below, `inquire`, `messages` and `findUser` are the bodies of the three Chapter 7 routes, `/inquire`, `/messages` and `/user/:userName`.

### Step 1: Answer the Health Check

```typescript
// TODO: Step 1 - Answer the health check: GET /ping returns { status: 'Healthy' }
```

AgentCore polls `/ping` to know whether the container is ready and still alive. Return `{ status: 'Healthy' }`. (An agent busy with background work can answer `HealthyBusy`, which keeps its session alive.)

### Step 2: One Session, One Thread

```typescript
// TODO: Step 2 - Use the AgentCore session id as the thread id: the X-Amzn-Bedrock-AgentCore-Runtime-Session-Id header
```

In Chapter 7 every request used the thread `dnd-campaign`. On AgentCore, each caller sends its own session id, so let it name the thread: read the header with `req.header(...)` into `sessionId`, falling back to a fixed name such as `'local-session'` when you run the file on your machine without the header. Two players with two session ids now get two campaigns, each in its own microVM.

### Step 3: Three Routes Become Actions

```typescript
// TODO: Step 3 - Dispatch on action: 'inquire' calls inquire(question, config), 'messages' calls messages(config),
//   'user' calls findUser(userName); anything else is a 400
```

AgentCore routes only `/invocations` to your agent, so the route moves into the payload: `{"action": "inquire", "question": "..."}`, `{"action": "messages"}` or `{"action": "user", "userName": "Arnaud"}`. Answer each with `res.json(...)`, and an unknown action with `res.status(400)`. The JSON is the same the Chapter 7 routes returned. The given line above the TODO also reads a `prompt` as the question: that is what `agentcore invoke "..."` sends, `{"prompt": "..."}`, with no action.

### Step 4: Listen on Every Interface

```typescript
// TODO: Step 4 - Listen on 0.0.0.0, not localhost: AgentCore reaches the container from outside
```

`app.listen(PORT, '0.0.0.0', ...)`. `PORT` is 8080, the port of the contract.

### Test It on Your Machine

The container's start script runs on your machine too. Stop any Chapter 5 or 7 service first (ports 8002 and 8005 must be free), then:

```bash
npm run ch8:local
```

It starts Chroma and the dice server, waits for both, then the Game Master:

```
D&D Game Master (AgentCore) listening on http://0.0.0.0:8080
```

In a second terminal, call it the way AgentCore will:

```bash
curl localhost:8080/ping
curl -X POST localhost:8080/invocations -H 'Content-Type: application/json' \
  -d '{"action": "inquire", "question": "What are the rules for an opportunity attack?"}'
```

The first answers `{"status":"Healthy"}`, the second returns a `StoryOutput` with a page reference from the Basic Rules. Stop it with Ctrl+C.

## Part 2: Deploy

### Step 1: Install the AgentCore CLI

```bash
npm install -g @aws/agentcore
agentcore --version
```

The CLI reads [`agentcore/agentcore.json`](../agentcore/agentcore.json), which this repository ships. Its one runtime:

```json
{
  "name": "GameMaster",
  "build": "Container",
  "entrypoint": "gamemaster_agentcore.ts",
  "codeLocation": "8_agentcore/",
  "buildContextPath": ".",
  "dockerfile": "8_agentcore/Dockerfile",
  "runtimeVersion": "NODE_22",
  "networkMode": "PUBLIC",
  "protocol": "HTTP"
}
```

`buildContextPath: "."` makes the repository root the image's build context, because the Game Master imports `shared/`, `4_mcp_integration/` and `5_subagents/`. The [`.dockerignore`](../.dockerignore) keeps only those folders, `8_agentcore/` and `package.json`. The CLI's TypeScript templates cover only Strands and the Vercel AI SDK, so this project was added as bring-your-own code (`agentcore add agent --type byo --language TypeScript --build Container`). The `agentcore/cdk/` folder is the CDK app the CLI generated: it turns `agentcore.json` into CloudFormation.

### Step 2: Name Your Project

Everything the deploy creates is named after the project in `agentcore.json`: the stack `AgentCore-<project>-default`, the runtime `<project>_GameMaster`, its image repository, build project and logs. The repository ships the project as `OnceUponAgenticAI`, so in an AWS account shared by several players, everyone would deploy over the same stack and the same runtime. Give yours a name of its own:

```bash
npm run ch8:name -- <your-name>
```

For example, `npm run ch8:name -- alice`:

```
Project OnceUponAlice: your stack will be AgentCore-OnceUponAlice-default, your runtime OnceUponAlice_GameMaster
```

[`8_agentcore/name_project.ts`](../8_agentcore/name_project.ts) (given code) writes the name into `agentcore/agentcore.json`. Use letters and digits, 15 at most, and a name no other player uses, even with different capitals: the image repository's name is lowercase. Alone in your account, you can skip this step.

### Step 3: Check the Knowledge Base

The image bakes in `5_subagents/utils/dnd_knowledge_base/`, the Chroma data you built in Chapter 5. The build stops with `Knowledge base missing` if it isn't there: rebuild it with [Chapter 5, Part 1](5_subagents.md) if you deleted it. The PDF itself stays out of the image.

### Step 4: Deploy

From the repository root, with AWS credentials for the account you want to deploy to:

```bash
AWS_REGION=us-west-2 agentcore deploy --yes
```

The deploy:

1. Writes `agentcore/aws-targets.json` from your credentials: your account and the region (gitignored, it holds your account ID).
2. Synthesizes your CloudFormation stack, `AgentCore-<project>-default`.
3. The first time in an account and region, **bootstraps the CDK** (`--yes` allows it): a stack named `CDKToolkit` with a bucket and roles that every CDK deployment in the account and region shares, yours and the other players'. In a shared account, the workshop organizer should bootstrap it once before the workshop (one `agentcore deploy`, or `npx cdk bootstrap aws://<account>/us-west-2`), so that players deploying at the same time don't all try to create it.
4. Uploads the build context to S3. **AWS CodeBuild builds the arm64 image**, so you don't need Docker on your machine, and pushes it to ECR.
5. Creates the IAM execution role (it may call Bedrock models and inference profiles, write logs and traces) and the AgentCore runtime.

The first deploy takes several minutes, mostly the image build. Then:

```bash
agentcore status
```

prints your runtime and its ARN, `arn:aws:bedrock-agentcore:us-west-2:<account>:runtime/<project>_GameMaster-<id>`. The CLI only works on the project in your `agentcore/` folder: `status`, `invoke`, `logs` and the cleanup never touch another player's runtime.

**Permissions:** deploying needs CloudFormation, IAM, S3, ECR, CodeBuild and AgentCore permissions in the account. See [AgentCore CLI permissions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-permissions.html#runtime-permissions-cli).

## Part 3: Play in the Cloud

### Step 1: Invoke from the Command Line

```bash
agentcore invoke "Create a character named Lyra, a female elf wizard."
```

The first call of a session starts a microVM: Chroma, the dice server and the Game Master boot, so it takes longer. To keep talking in the same campaign, pass the same session id each time (33 characters or more):

```bash
agentcore invoke --session-id dnd-campaign-0000000000000000000001 "Roll for initiative!"
```

Follow what the agent does in CloudWatch, the same tool calls your terminal showed in Chapter 7:

```bash
agentcore logs
```

### Step 2: The Web Interface, Through a Proxy

The web interface calls plain HTTP routes, and a browser can't sign requests to AgentCore with your AWS credentials. [`8_agentcore/invoke_proxy.ts`](../8_agentcore/invoke_proxy.ts) can: it serves the Chapter 7 routes on `http://127.0.0.1:8009` and turns each one into an `InvokeAgentRuntime` call.

```typescript
// TODO: Step 5 - Import BedrockAgentCoreClient and InvokeAgentRuntimeCommand from @aws-sdk/client-bedrock-agentcore
```
```typescript
// TODO: Step 5 - Send an InvokeAgentRuntimeCommand with agentRuntimeArn, runtimeSessionId,
//   payload: JSON.stringify(payload) and contentType: 'application/json'
```

Build the command, `await client.send(...)` it and name the result `response`: the line after the TODO reads its body. `runtimeSessionId` is one UUID per proxy run, so the whole game stays in one session. See [InvokeAgentRuntime](https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API_InvokeAgentRuntime.html).

The proxy uses the AWS SDK's AgentCore client, `@aws-sdk/client-bedrock-agentcore`, a dependency added for this chapter: run `npm install` once more if you installed before pulling it. Start the proxy with the ARN from `agentcore status`:

```bash
AGENT_RUNTIME_ARN=arn:aws:bedrock-agentcore:us-west-2:<account>:runtime/<id> npm run ch8:proxy
```

Then open the [web interface](https://aws-samples.github.io/sample-once-upon-agentic-ai/) as in [Chapter 6](6_ui_testing.md), with `http://127.0.0.1:8009` as the Server URL. Same game; the Game Master now runs in AWS.

## What Changed by Moving to the Cloud

- **A session is a microVM, and a microVM doesn't last.** It stops after 15 minutes without a call (8 hours at most), and its disk goes with it: the SQLite session in `.agent/`, and any character created during the session. A new session starts again from the image, with Arnaud only. Chapter 7's "the campaign survives a restart" no longer holds.
- **Making it last** means storing state outside the microVM: [AgentCore Memory](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory.html) for the conversation, a database such as DynamoDB for the characters. A good next quest.
- **Everything is signed.** Only callers with `bedrock-agentcore:InvokeAgentRuntime` on the runtime can play. The CLI can also put an OAuth (JWT) authorizer in front instead.
- **One image, three processes.** Simple, and it reuses Chapters 4 and 5 unchanged. In a production design the dice server would be its own runtime (AgentCore runtimes also speak MCP) or a Gateway target, and the rules would live in a managed knowledge base.

# 🎉 Quest Complete!

Congratulations! Your Game Master runs in the cloud, in a microVM per session, and your web interface plays with it through a signed proxy.

**What you've learned:**
- ✅ The AgentCore Runtime contract: `/ping`, `/invocations`, port 8080, arm64, a session id per caller
- ✅ Packaging an agent and its local services in one container
- ✅ Deploying with the AgentCore CLI (`agentcore deploy`, `status`, `invoke`, `logs`), one runtime per player
- ✅ Calling a runtime with `InvokeAgentRuntime`, and why a browser needs a proxy
- ✅ What a session-scoped microVM keeps, and what it forgets

**Next Adventure**: Head to the [final cleanup](cleanup.md) page: it removes the AWS resources this chapter created.

---

_"Even the mightiest citadel needs its foundations in the clouds."_ ☁️🏰
