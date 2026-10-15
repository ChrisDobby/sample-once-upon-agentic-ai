# 🔨 Chapter 3: Creating Custom Tools

![Header Image](images/header_3.png)

# 🎯 Quest Objective

Learn how to **create custom tools** by building a **Dice Rolling Tool**, an essential capability for any D&D Game Master.

![Chapter 3 architecture](../images/chapter3.png)

Open and modify [`3_custom_tools/agent_with_dice_roll_tool.ts`](../3_custom_tools/agent_with_dice_roll_tool.ts) to create an agent capable of rolling dice using a custom tool.

## How Custom Tools Work

In LangChain.js, a custom tool is a function wrapped by `tool()`, together with what the model needs to know about it:

- **`name`**: what the model calls the tool by
- **`description`**: tells the agent what the tool does and when to use it
- **`schema`**: a [zod](https://zod.dev/) schema of the tool's arguments; `.describe()` on a field documents that argument

The model never reads your function's code. It only receives the name, the description and the JSON schema built from the zod schema. See [tools](https://docs.langchain.com/oss/javascript/langchain/tools) in the documentation.

## Step 1: Turn Your Function into a Tool

The file already contains a plain TypeScript function, `rollDice`, that rolls a die with a given number of faces. Your goal is to turn that function into a tool your agent can call.

```typescript
// TODO: Step 1 - Import tool from langchain and z from zod
```
```typescript
// TODO: Step 1 - Transform rollDice into a tool: const rollDiceTool = tool(({ faces }) => rollDice(faces), { name, schema }), with
//   - name: 'roll_dice'
//   - schema: z.object({ faces: z.number().int().default(6) })
```

`tool()` takes two arguments: the function to run, which receives the arguments the model chose as one object, and the tool's definition. Give it only the `name` and the `schema` for now: the description comes in Step 2.

## Step 2: Write a Clear Description

Before writing a description, look at what the model will be told about your tool: right after the tool, the script prints its name, its description and the JSON schema of its arguments. That is the exact specification LangChain sends to the model. Run the script (Step 1 must be done):

```bash
npm run ch3
```

You should see:

```
{
  name: 'roll_dice',
  description: 'roll_dice tool',   // only the tool name
  schema: {
    '$schema': 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: { faces: [Object] },
    required: [ 'faces' ],
    additionalProperties: false
  }
}
```

(The agent then runs too, without a tool yet; stop it with Ctrl+C if you like.)

Look at `description`: without one, LangChain makes it up from the name, `roll_dice tool`. Node folds the nested `faces` entry into `[Object]`; unfolded, it is `{"default":6,"type":"integer",...}`, with no description at all. That is all the model would ever know about your tool.

```typescript
// TODO: Step 2 - Give the tool a description, and describe the faces parameter with .describe()
```

Now add a `description` to the tool's definition: say what the tool does and what it returns. Then chain `.describe('...')` onto the `faces` field of the schema to say what the argument means.

**Tips:** LLMs are good at writing tool descriptions. Give them the function and an example of best practices, and let them write one for you. For a fuller example, look at `ROLL_DICE_DESCRIPTION` in Chapter 4's server.

Run the script again and compare the printed specification:

```
{
  name: 'roll_dice',
  description: 'Roll one die with a given number of faces and return the result.',   // the description you added
  ...
}
```

The `faces` entry of the schema now carries your `.describe()` text as its `description`.

Would it work without a description? Here, yes: with a name as explicit as `roll_dice` and a single argument called `faces`, the model manages either way. With a vaguer name or several arguments it would have nothing else to go on, so make descriptions a habit.

## Step 3: Add the Tool to Your Agent

```typescript
// TODO: Step 3 - Add the tool to the agent
```

Pass your tool to the agent in its `tools` list, as in Chapter 2.

**Why this matters:**
- The agent can only use tools that are explicitly provided in `tools: [...]`
- Without this step, your tool cannot be discovered by the agent
- The agent automatically learns how to use every tool it is given

## Step 4: Testing Your Tool

Once the TODOs are completed, run your script:

```bash
npm run ch3
```

The system prompt in the file turns the agent into Lady Luck, keeper of dice and fortune, who helps players create D&D characters. The script asks her to roll four ability scores (strength, wisdom, charisma and intelligence) for a new character with the 4d6-drop-lowest method: for each ability, roll four six-sided dice and keep the three highest. That is always **16 rolls** (4 abilities × 4 dice), and every single one must go through your tool. Each one appears in the terminal:

```
🔧 Tool: roll_dice {"faces":6}
✓ roll_dice: 4
```

Watch the agent in action:
1. **Analyze** the character creation request
2. **Plan** the necessary rolls (4 abilities × 4d6 each), often several calls at once
3. **Execute** the dice rolls using your custom tool
4. **Calculate** the final scores (keep the best 3 dice)
5. **Return** the results

# 🎉 Quest Complete!

Congratulations! You've created your own custom tool, and your agent can now use a capability you built specifically for it.

**What you've learned:**
- ✅ How to turn a function into a tool with `tool()` and a zod schema
- ✅ How to write the description that guides the agent's use of the tool
- ✅ How to add your custom tool to an agent

**Next Adventure**: Head to [Chapter 4](4_mcp_integration.md), where you'll learn about the Model Context Protocol (MCP) to connect your agents to external services!

---

_"A well-built tool is worth its weight in functionality!"_ 🔨✨
