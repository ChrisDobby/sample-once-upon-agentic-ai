# The Game Master image for AgentCore Runtime. The build context is the repository root (see agentcore/agentcore.json).
# You do not need to change this file.
# Debian 13 (trixie): the Chroma server's Linux arm64 build needs glibc 2.39 or later, more than node:22-slim has.
FROM public.ecr.aws/docker/library/node:22-trixie-slim

WORKDIR /app

# Dev dependencies included: the chapters run TypeScript directly with tsx.
# npm installs the Linux arm64 builds of the native modules (Chroma, SQLite, ONNX Runtime) here, inside the image.
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY shared/ shared/
COPY 4_mcp_integration/ 4_mcp_integration/
COPY 5_subagents/ 5_subagents/
COPY 8_agentcore/ 8_agentcore/

# The Rules Agent needs the knowledge base you built in Chapter 5.
RUN test -f 5_subagents/utils/dnd_knowledge_base/chroma.sqlite3 \
    || (echo "Knowledge base missing: build it first (Chapter 5, npm run ch5:kb)" && exit 1)

# Runs as an unprivileged user that owns what the Game Master writes: characters.json, .agent/, the Chroma data,
# and the embedding model cache, downloaded now so the first rules question doesn't wait for it.
RUN mkdir .agent && chown -R node:node /app
USER node
RUN npx tsx 8_agentcore/warm_embeddings.ts

# AgentCore Runtime HTTP contract: POST /invocations and GET /ping on port 8080
EXPOSE 8080

CMD ["bash", "8_agentcore/start.sh"]
