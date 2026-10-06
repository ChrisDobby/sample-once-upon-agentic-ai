/**
 * Converts LangChain messages to the { role, content: [blocks] } shape the Strands versions of
 * this workshop returned from /messages (the Amazon Bedrock Converse format), so the web
 * interface reads the same JSON. You do not need to change this file.
 */
import { AIMessage, HumanMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages'

type ContentBlock =
  | { text: string }
  | { toolUse: { toolUseId: string; name: string; input: unknown } }
  | { toolResult: { toolUseId: string; status: 'success' | 'error'; content: { text: string }[] } }

export function toMessageData(message: BaseMessage): { role: 'user' | 'assistant'; content: ContentBlock[] } {
  if (AIMessage.isInstance(message)) {
    const content: ContentBlock[] = message.text ? [{ text: message.text }] : []
    for (const call of message.tool_calls ?? []) {
      content.push({ toolUse: { toolUseId: call.id ?? '', name: call.name, input: call.args } })
    }
    return { role: 'assistant', content }
  }
  if (ToolMessage.isInstance(message)) {
    const status = message.status === 'error' ? 'error' : 'success'
    return {
      role: 'user',
      content: [{ toolResult: { toolUseId: message.tool_call_id, status, content: [{ text: message.text }] } }],
    }
  }
  return { role: HumanMessage.isInstance(message) ? 'user' : 'assistant', content: [{ text: message.text }] }
}

/** The messages of the latest turn: everything after the last message from the user. */
export function latestTurn(messages: BaseMessage[]): BaseMessage[] {
  const lastUser = messages.findLastIndex((m) => HumanMessage.isInstance(m))
  return messages.slice(lastUser + 1)
}
