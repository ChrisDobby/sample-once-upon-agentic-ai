import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { Agent, tool } from '@strands-agents/sdk'
import { A2AExpressServer } from '@strands-agents/sdk/a2a/express'
import { z } from 'zod'

interface Stats {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

interface InventoryItem {
  item_name: string
  quantity: number
}

// Keys stay snake_case: they are the JSON the web interface and the Game Master read.
interface Character {
  character_id: string
  name: string
  character_class: string
  race: string
  gender: string
  level: number
  experience: number
  stats: Stats
  inventory: InventoryItem[]
  created_at: string
}

// characters.json keeps the TinyDB layout used by the Python version: {"_default": {"1": {...}, "2": {...}}}
const CHARACTERS_DB = new URL('./characters.json', import.meta.url)

function readCharacters(): Record<string, Character> {
  if (!existsSync(CHARACTERS_DB)) return {}
  return JSON.parse(readFileSync(CHARACTERS_DB, 'utf-8'))._default ?? {}
}

function insertCharacter(character: Character): void {
  const characters = readCharacters()
  const nextId = Math.max(0, ...Object.keys(characters).map(Number)) + 1
  characters[nextId] = character
  writeFileSync(CHARACTERS_DB, JSON.stringify({ _default: characters }, null, 4))
}

const findCharacterByName = tool({
  name: 'find_character_by_name',
  description: `Find a stored D&D character by its exact name.

Use it when a player refers to an existing character and you need its sheet:
class, race, level, ability scores, inventory. Names are matched exactly and
are case-sensitive; use list_all_characters if you are unsure of the spelling.

Example response:
    {"character_id": "6ca1…", "name": "Thorin", "character_class": "Fighter",
     "race": "Dwarf", "gender": "Male", "level": 1, "experience": 0,
     "stats": {"strength": 16, "dexterity": 12, …}, "inventory": […]}

Notes:
    - Fails with an error if no character with that name exists.

Returns:
    The stored character record (see the example above).`,
  inputSchema: z.object({
    name: z.string().describe('The character\'s name exactly as it was created, e.g. "Thorin".'),
  }),
  callback: ({ name }) => {
    console.log(`🔍 Searching for character with name: '${name}'`)
    const character = Object.values(readCharacters()).find((c) => c.name === name)

    if (!character) {
      // Strands turns the error into an error result the model can see
      throw new Error(`Character with name '${name}' not found`)
    }

    console.log(
      `✅ Found character: ${character.name} (ID: ${character.character_id}, ${character.character_class} ${character.race})`,
    )
    return { ...character }
  },
})

const listAllCharacters = tool({
  name: 'list_all_characters',
  description: `List every character stored in the database.

Use it to see which characters exist before creating or looking one up, or
when a player asks for the whole party.

Example response:
    [{"character_id": "6ca1…", "name": "Thorin", "character_class": "Fighter",
      "race": "Dwarf", "gender": "Male", "level": 1, "experience": 0,
      "stats": {"strength": 16, …}, "inventory": […]},
     …]

Notes:
    - Takes no parameters and returns every character in full; prefer
      find_character_by_name when you already know the name.
    - Returns an empty list if no character has been created yet.

Returns:
    A list of character records, same shape as find_character_by_name.`,
  callback: () => {
    console.log('📋 Listing all characters in database')
    const allChars = Object.values(readCharacters())

    if (allChars.length === 0) {
      console.log('📋 No characters found in database')
      return []
    }

    console.log(`✅ Found ${allChars.length} character(s) in database`)
    for (const char of allChars) {
      console.log(`  - ${char.name} (${char.character_class} ${char.race})`)
    }

    return allChars.map((c) => ({ ...c }))
  },
})

const createCharacter = tool({
  name: 'create_character',
  description: `Create a new D&D character and save it to the database.

Use it once per new character, after the ability scores have been decided
(roll them with the 4d6-drop-lowest method first). Every new character starts
at level 1 with 0 experience, a Starting Equipment Pack and 100 gold pieces.

Example response:
    {"character_id": "6ca1…", "name": "Thorin", "character_class": "Fighter",
     "race": "Dwarf", "gender": "Male", "level": 1, "experience": 0,
     "stats": {"strength": 16, "dexterity": 12, "constitution": 14,
               "intelligence": 10, "wisdom": 11, "charisma": 9},
     "inventory": [{"item_name": "Starting Equipment Pack", "quantity": 1},
                   {"item_name": "Gold Pieces", "quantity": 100}]}

Notes:
    - Names are not checked for uniqueness: creating "Thorin" twice stores two
      characters. Check with find_character_by_name if in doubt.
    - Any ability score missing from stats_dict defaults to 10.

Returns:
    The newly created character record, including its generated character_id.`,
  inputSchema: z.object({
    name: z.string().describe('The character\'s name, e.g. "Thorin".'),
    character_class: z.string().describe('A D&D class such as "Fighter", "Wizard" or "Rogue".'),
    race: z.string().describe('A D&D race such as "Dwarf", "Elf" or "Human".'),
    gender: z.string().describe('The character\'s gender, e.g. "Female"; pick one if the player did not say.'),
    stats_dict: z
      .record(z.string(), z.number().int())
      .describe(
        'Ability scores with the keys strength, dexterity, constitution, intelligence, wisdom and charisma, ' +
          'each an integer (typically 3 to 18), e.g. {"strength": 16, "dexterity": 12}.',
      ),
  }),
  callback: ({ name, character_class, race, gender, stats_dict }) => {
    const characterId = randomUUID()
    const character: Character = {
      character_id: characterId,
      name,
      character_class,
      race,
      gender,
      level: 1,
      experience: 0,
      stats: {
        strength: stats_dict.strength ?? 10,
        dexterity: stats_dict.dexterity ?? 10,
        constitution: stats_dict.constitution ?? 10,
        intelligence: stats_dict.intelligence ?? 10,
        wisdom: stats_dict.wisdom ?? 10,
        charisma: stats_dict.charisma ?? 10,
      },
      inventory: [
        { item_name: 'Starting Equipment Pack', quantity: 1 },
        { item_name: 'Gold Pieces', quantity: 100 },
      ],
      created_at: new Date().toISOString(),
    }
    insertCharacter(character)
    console.log(`✅ Created character ${name} (${character_class} ${race}) with id ${characterId}`)
    return { ...character }
  },
})

function createAgent(contextId: string): Agent {
  return new Agent({
    // TODO: Step 1 - Add the createCharacter, findCharacterByName and listAllCharacters tools to the agent
    systemPrompt: `You are a D&D character manager. Use your tools to create, find or list characters.
When creating a character, roll each ability score with 4d6 drop lowest. If details are missing (gender, some scores), choose or roll them yourself instead of asking back.
Confirm creations and summarize found characters briefly: class, race, key stats.`,
  })
}

// TODO: Step 2 - Create an A2AExpressServer with the createAgent factory (agentFactory) on port 8001
// TODO: Step 3 - Add the name "Character Agent" to the server
// TODO: Step 4 - Add the description "D&D character management: creates characters (ability scores rolled 4d6 drop lowest), stores them, finds and lists them." to the server

// TODO: Step 5 - Start the A2A server
