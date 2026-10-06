import { createAgent } from 'langchain'
import { model } from '../shared/model.ts'
// TODO: Step 1 - Import ConsoleCallbackHandler from @langchain/core/tracers/console to see what your agent is thinking

// TODO: Step 2 - Create the agent with createAgent, the shared model and the following system prompt: "You are a game master for a Dungeon & Dragon game"

// TODO: Step 3 - Invoke your agent with a basic query such as "Hi, I am an adventurer ready for adventure!",
//   passing callbacks: [new ConsoleCallbackHandler()] in the options to log every step, then print the last message's text
