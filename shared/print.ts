/**
 * Runs an agent and prints what it does as it goes: every tool call, every tool result and the
 * final answer. LangChain agents print nothing on their own, so the chapters use this helper to
 * watch the agent work. You do not need to change this file.
 */
import { AIMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages'
import type { Interrupt } from '@langchain/langgraph'

const MAX_RESULT = 300 // characters of each tool result shown in the terminal

/** Prints the messages a step of the agent produced. */
export function printMessages(messages: BaseMessage[]): void {
  for (const message of messages) {
    if (AIMessage.isInstance(message)) {
      if (message.text) console.log(`\n${message.text}`)
      for (const call of message.tool_calls ?? []) {
        console.log(`\n🔧 Tool: ${call.name} ${JSON.stringify(call.args)}`)
      }
    } else if (ToolMessage.isInstance(message)) {
      const result = message.text
      const shown = result.length > MAX_RESULT ? `${result.slice(0, MAX_RESULT)}…` : result
      console.log(`${message.status === 'error' ? '✗' : '✓'} ${message.name}: ${shown}`)
    }
  }
}

interface StreamableAgent {
  stream(input: any, options?: any): Promise<AsyncIterable<any>>
}

/**
 * Streams one run of the agent, printing each step. Returns the interrupts the run stopped on
 * (an empty list when it finished), such as the approval requests of humanInTheLoopMiddleware.
 */
export async function runAndPrint(agent: StreamableAgent, input: any, config: Record<string, unknown> = {}): Promise<Interrupt[]> {
  const interrupts: Interrupt[] = []
  const stream = await agent.stream(input, { ...config, streamMode: 'updates' })
  for await (const update of stream) {
    for (const [node, step] of Object.entries<any>(update)) {
      if (node === '__interrupt__') interrupts.push(...step)
      else if (step && Array.isArray(step.messages)) printMessages(step.messages)
    }
  }
  console.log()
  return interrupts
}
