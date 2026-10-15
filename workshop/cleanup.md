# 🧹 Final Cleanup

![Header Image](images/header_8.png)

# 🎯 Quest Objective

Leave no trace behind: remove the AWS resources of Chapter 8, stop the local services and tidy up the files the workshop generated.

Chapters 1 to 7 create no AWS resource: they run on your machine and only call an Amazon Bedrock model, which is billed per call and costs nothing once you stop. Chapter 8 deploys to your account: start there if you did it. This page is the last stop: whatever chapters you completed, everything to stop or delete is listed here.

## Amazon Bedrock AgentCore (Chapter 8)

Stop the proxy (`npm run ch8:proxy`) with Ctrl+C. Then, from the repository root, remove the runtime from the project and deploy the removal:

```bash
agentcore remove all
AWS_REGION=us-west-2 agentcore deploy --yes
```

`remove all` empties `agentcore/agentcore.json`; the deploy that follows deletes what the stack created: the AgentCore runtime, its IAM role, the ECR repository with the image and the CodeBuild project. Check with `agentcore status`, then put the project file back so the repository is as you cloned it:

```bash
git restore agentcore/agentcore.json
```

Two things are left on purpose:

1. **Three CloudWatch log groups**: the runtime's `/aws/bedrock-agentcore/runtimes/OnceUponAgenticAI_GameMaster-<id>-DEFAULT`, the image build's `/aws/codebuild/AgentCore-OnceUponAgenticAI-default-container-builder`, and the build trigger's `/aws/lambda/AgentCore-OnceUponAgentic-...`. Delete them in the CloudWatch console if you don't want to keep the logs.
2. **The `CDKToolkit` stack**, created by the first deploy's CDK bootstrap, with its staging bucket `cdk-hnb659fds-assets-<account>-<region>` (it keeps the build contexts you uploaded) and its ECR repository. Other CDK deployments in the same account and region share it: delete it in the CloudFormation console only if nothing else uses it, after emptying the bucket.

## Amazon Bedrock

The workshop calls Amazon Bedrock models, so there is nothing to delete on the Bedrock side. Keep in mind:

1. **Model usage**: charges are based on usage (input and output tokens). Nothing accrues once you stop calling the model.
2. **Model access**: the access you enabled stays active but costs nothing unless used.

## Local services

Stop every server still running, with Ctrl+C in its terminal: the dice MCP server (`ch4:server`), the Chroma server (`ch5:chroma`), the Game Master (`ch5:gamemaster`, `ch7` or `ch8:local`), and the proxy (`ch8:proxy`).

## Local files

Everything below was generated during the workshop. Run these from the repository root:

- `5_subagents/utils/DnD_BasicRules_2018.pdf` (the PDF you downloaded) and `5_subagents/utils/dnd_knowledge_base/` (the Chroma data). Both are gitignored, delete them freely.
- `.agent/`: the Chapter 7 session database. Gitignored, delete it freely.
- The scroll Kiro wrote in the Chapter 2 bonus quest, such as `fibonacci.py`, at the repository root.
- `5_subagents/agents/character_agent/characters.json`: the characters you created. **This file is tracked in git** (it ships with Arnaud), so restore it rather than deleting it:
  ```bash
  git restore 5_subagents/agents/character_agent/characters.json
  ```
- `agentcore/aws-targets.json`, `agentcore/.cli/`, `agentcore/cdk/node_modules/`, `agentcore/cdk/dist/` and `agentcore/cdk/cdk.out/`, written by the AgentCore CLI (gitignored).
- `node_modules/` and `package-lock.json` (gitignored), if you no longer need the dependencies.

`git status` shows anything else you created or changed along the way.

# 🎉 Quest Complete!

Congratulations, brave adventurer! You've journeyed through the entire LangChain.js workshop, from creating your first agent to orchestrating a complete multi-agent system with a web interface.

**What you've learned:**
- ✅ Creating AI agents with `createAgent` and equipping them with prebuilt and custom tools
- ✅ Gating risky tool calls behind human approval
- ✅ Connecting agents to tools served over MCP
- ✅ Orchestrating specialized subagents, with memory and structured output
- ✅ Testing your complete system through a web interface
- ✅ Rebuilding the same Game Master with Deep Agents
- ✅ Deploying it to Amazon Bedrock AgentCore Runtime

**Now Go Build Your Legend**: You've mastered the fundamentals. Go create something extraordinary of your own!

---

_"The apprentice has become the builder. Now go forth and create wonders!"_ 🗡️✨
