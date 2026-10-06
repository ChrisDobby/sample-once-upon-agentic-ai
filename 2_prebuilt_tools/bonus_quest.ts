import { createInterface } from 'node:readline/promises'
import { Command, MemorySaver } from '@langchain/langgraph'
import { createAgent, type HITLRequest, type HITLResponse } from 'langchain'
import { model } from '../shared/model.ts'
import { runAndPrint } from '../shared/print.ts'
// TODO: Step 1 - Import createFilesystemMiddleware and LocalShellBackend from deepagents
// TODO: Step 2 - Import humanInTheLoopMiddleware from langchain

const arcaneScribe = createAgent({
  model,
  middleware: [
    // TODO: Step 1 - Add the file and shell tools: createFilesystemMiddleware with a LocalShellBackend rooted at process.cwd()
    // TODO: Step 2 - Ask for your approval before writing, editing or running anything: humanInTheLoopMiddleware
    //   with interruptOn { write_file: true, edit_file: true, execute: true }
  ],
  // Approvals pause the run; the checkpointer keeps it so it can resume after your answer.
  checkpointer: new MemorySaver(),
  systemPrompt: `You are Kiro the Grey Hat, a wizard who specializes in the ancient art of code magic.
    When asked to create spells (code), you inscribe them on parchment (files) in the directory ${process.cwd()}
    and then cast them to demonstrate their power.`,
})

const config = { configurable: { thread_id: 'bonus-quest' } }
const terminal = createInterface({ input: process.stdin, output: process.stdout })

let input: any = {
  messages: [{ role: 'user', content: 'Create a magical scroll that generates the first 10 numbers of the Fibonacci sequence and demonstrate its power!' }],
}
while (true) {
  const interrupts = await runAndPrint(arcaneScribe, input, config)
  const request = interrupts[0]?.value as HITLRequest | undefined
  if (!request) break
  // The run is paused on tool calls that need your approval: ask, then resume with your decisions.
  const decisions: HITLResponse['decisions'] = []
  for (const action of request.actionRequests) {
    const answer = await terminal.question(`Approve "${action.name}"?\n  Input: ${JSON.stringify(action.args)} (y/n): `)
    decisions.push(answer.trim().toLowerCase().startsWith('y') ? { type: 'approve' } : { type: 'reject', message: 'The user denied this action' })
  }
  input = new Command({ resume: { decisions } })
}
terminal.close()
