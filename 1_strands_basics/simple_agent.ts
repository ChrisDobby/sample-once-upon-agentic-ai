import { Agent } from '@strands-agents/sdk'
import { configureLogging } from '@strands-agents/sdk'

// TODO: Step 1 - Add debug logging to see what your agent is thinking (configureLogging from @strands-agents/sdk)
configureLogging(console)

// TODO: Step 2 - Create the agent with the following system prompt: "You are a game master for a Dungeon & Dragon game"
const agent = new Agent({ systemPrompt: 'You are a game master for a Dungeon & Dragon game' })

// TODO: Step 3 - Invoke your agent with a basic query such as "Hi, I am an adventurer ready for adventure!"
await agent.invoke('Hi, I am an adventurer ready for adventure!')
