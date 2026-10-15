# 🐉 Chapter 0: An Unexpected Adventure

![Header Image](images/header_0.jpeg)

# 🎯 Quest Objective

Prepare your development environment: install Node.js, clone the `langchain-port` branch of the workshop repository, install its dependencies and check that you can reach the model on Amazon Bedrock. Everything else in this workshop runs from there.

## What is LangChain.js?

[LangChain.js](https://docs.langchain.com/oss/javascript/langchain/overview) is an open-source TypeScript framework for building AI agents and multi-agent systems. Its `createAgent()` function gives you a tool-calling agent in a few lines; [Deep Agents](https://docs.langchain.com/oss/javascript/deepagents/overview), which you meet in Chapter 7, builds a more complete agent on top of it.

## Setting Up Your Sanctum (Installation)

### Step 1: Install Node.js

You need **Node.js 22 or newer**. Check your version:

```bash
node --version
```

If it is missing or older, install the current LTS release from [nodejs.org](https://nodejs.org/en/download).

### Step 2: Clone the repo

```bash
git clone -b langchain-port https://github.com/ChrisDobby/sample-once-upon-agentic-ai.git
cd sample-once-upon-agentic-ai
```

The `-b langchain-port` matters: it is the branch with the LangChain.js skeleton. The default branch, `main`, holds the original Python version.

### Step 3: Install the required enchantments

```bash
npm install
```

The workshop ships no lockfile, so `npm install` gets the latest compatible releases of LangChain.js and its friends. There is no build step: every file runs directly with [`tsx`](https://www.npmjs.com/package/tsx), through the `npm run` scripts in `package.json`. **Run every command in this workshop from the repository root.**

### Step 4: Check your AWS access

Every chapter runs on **Claude Sonnet 4.6 on Amazon Bedrock, in `us-west-2`**. The model and the region are set once, in [`shared/model.ts`](../shared/model.ts):

```typescript
export const model = new ChatBedrockConverse({
  model: 'global.anthropic.claude-sonnet-4-6',
  region: 'us-west-2',
})
```

You need AWS credentials that can call that model:

- Configure credentials the usual way: environment variables, `~/.aws/credentials`, or an SSO profile selected with `AWS_PROFILE`. See [configuration and credential files](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html).
- Make sure your account has access to Anthropic Claude Sonnet 4.6 in Amazon Bedrock. See [access Amazon Bedrock foundation models](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html).

The region is pinned in code, so whatever your AWS config says, the calls go to `us-west-2`.

### Step 5: Check the skeleton

```bash
npm run typecheck
```

This reports type errors: that is expected. Each error sits at an unfinished `// TODO`, and they go away as you complete the chapters.

# 🎉 Quest Complete!

Congratulations! You've set up your development environment for the LangChain.js workshop.

**What you've learned:**
- ✅ Installed Node.js 22 or newer
- ✅ Cloned the `langchain-port` branch and installed its dependencies
- ✅ Checked your AWS credentials and your access to the model

**Next Adventure**: Head to [Chapter 1](1_langchain_basics.md), where you'll create your first AI agent!

---

_"A solid foundation is the first step of any great journey."_ 🚀✨
