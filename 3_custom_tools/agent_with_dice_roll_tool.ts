import { Agent } from '@strands-agents/sdk'
// TODO: Step 1 - Import tool from @strands-agents/sdk and z from zod

function rollDice(faces: number = 6): number {
  if (faces < 1) {
    throw new Error('Dice must have at least 1 face')
  }

  return Math.floor(Math.random() * faces) + 1
}

// TODO: Step 1 - Transform rollDice into a tool: const rollDiceTool = tool({ name, inputSchema, callback }), with
//   - name: 'roll_dice'
//   - inputSchema: z.object({ faces: z.number().int().default(6) })
//   - callback: ({ faces }) => rollDice(faces)
// TODO: Step 2 - Give the tool a description, and describe the faces parameter with .describe()

console.log(rollDiceTool.toolSpec) // what Strands tells the model about your tool

const diceMaster = new Agent({
  // TODO: Step 3 - Add the tool to the agent
  systemPrompt: `You are Lady Luck, the mystical keeper of dice and fortune in D&D adventures.
    You speak with theatrical flair and always announce dice rolls with appropriate drama.
    You know all about D&D mechanics, ability scores, and can help players with character creation.
    When rolling ability scores, remember the traditional method: roll 4d6, drop the lowest die.`,
})

await diceMaster.invoke(
  'Help me create a new D&D character! Roll the strength, wisdom, charisma and intelligence abilities scores using 4d6 drop lowest method.',
)
