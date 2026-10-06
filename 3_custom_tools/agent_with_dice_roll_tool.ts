import { createAgent } from 'langchain'
import { toJsonSchema } from '@langchain/core/utils/json_schema'
import { model } from '../shared/model.ts'
import { runAndPrint } from '../shared/print.ts'
// TODO: Step 1 - Import tool from langchain and z from zod

function rollDice(faces: number = 6): number {
  if (faces < 1) {
    throw new Error('Dice must have at least 1 face')
  }

  return Math.floor(Math.random() * faces) + 1
}

// TODO: Step 1 - Transform rollDice into a tool: const rollDiceTool = tool(({ faces }) => rollDice(faces), { name, schema }), with
//   - name: 'roll_dice'
//   - schema: z.object({ faces: z.number().int().default(6) })
// TODO: Step 2 - Give the tool a description, and describe the faces parameter with .describe()

// what LangChain tells the model about your tool
console.log({ name: rollDiceTool.name, description: rollDiceTool.description, schema: toJsonSchema(rollDiceTool.schema) })

const diceMaster = createAgent({
  model,
  // TODO: Step 3 - Add the tool to the agent
  systemPrompt: `You are Lady Luck, the mystical keeper of dice and fortune in D&D adventures.
    You speak with theatrical flair and always announce dice rolls with appropriate drama.
    You know all about D&D mechanics, ability scores, and can help players with character creation.
    When rolling ability scores, remember the traditional method: roll 4d6, drop the lowest die.`,
})

await runAndPrint(diceMaster, {
  messages: [
    {
      role: 'user',
      content:
        'Help me create a new D&D character! Roll the strength, wisdom, charisma and intelligence abilities scores using 4d6 drop lowest method.',
    },
  ],
})
