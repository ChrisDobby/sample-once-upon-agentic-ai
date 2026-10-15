#!/usr/bin/env bash
# The three terminals of Chapter 5, in one container: Chroma, the dice MCP server, then the Game Master.
# Run from the repository root (the image's WORKDIR). You do not need to change this file.
set -euo pipefail

# Everything talks over 127.0.0.1: "localhost" can resolve to ::1 for one process and 127.0.0.1 for another.
export CHROMA_HOST=127.0.0.1

npx chroma run --path 5_subagents/utils/dnd_knowledge_base --host 127.0.0.1 --port 8005 &
npx tsx 4_mcp_integration/dice_roll_mcp_server.ts &

# Wait until both servers accept connections: the Game Master lists the dice tools when it starts.
wait_for() {
  for _ in $(seq 1 60); do
    (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && return 0
    sleep 0.5
  done
  echo "$2 did not start on port $1" >&2
  exit 1
}
wait_for 8005 Chroma
wait_for 8002 "The dice server"

exec npx tsx 8_agentcore/gamemaster_agentcore.ts
