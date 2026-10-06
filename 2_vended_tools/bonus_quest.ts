import { Agent } from '@strands-agents/sdk'
// TODO: Step 1 - Import makeShell from @strands-agents/sdk/vended-tools/shell and fileEditor from @strands-agents/sdk/vended-tools/file-editor
// TODO: Step 2 - Import HumanInTheLoop from @strands-agents/sdk/vended-interventions/hitl

const arcaneScribe = new Agent({
  // TODO: Step 1 - Add a shell tool (makeShell()) and the fileEditor tool to your agent
  // TODO: Step 2 - Ask for your approval before each tool call with a HumanInTheLoop intervention in 'stdio' mode
  systemPrompt: `You are Kiro the Grey Hat, a wizard who specializes in the ancient art of code magic.
    When asked to create spells (code), you inscribe them on parchment (files) in the directory ${process.cwd()}
    and then cast them to demonstrate their power.`,
})

const response = await arcaneScribe.invoke(
  'Create a magical scroll that generates the first 10 numbers of the Fibonacci sequence and demonstrate its power!',
)
