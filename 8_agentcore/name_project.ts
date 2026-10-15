/**
 * Gives your AgentCore project a name of its own, so several players can deploy to the same AWS account.
 * The project name prefixes everything the deploy creates: the stack AgentCore-<project>-default, the
 * runtime <project>_GameMaster, its role, image repository and logs. You do not need to change this file.
 *
 *     npm run ch8:name -- <your-name>
 */
import { readFileSync, writeFileSync } from 'node:fs'

const PREFIX = 'OnceUpon'
const CONFIG = new URL('../agentcore/agentcore.json', import.meta.url)

// The CLI allows project names of up to 23 letters and digits, starting with a letter.
const player = (process.argv[2] ?? '').replace(/[^A-Za-z0-9]/g, '')
if (!player || player.length > 23 - PREFIX.length) {
  console.error(`Usage: npm run ch8:name -- <your-name> (letters and digits, at most ${23 - PREFIX.length})`)
  process.exit(1)
}
const project = PREFIX + player[0].toUpperCase() + player.slice(1)

const config = JSON.parse(readFileSync(CONFIG, 'utf-8'))
config.name = project
config.tags['agentcore:project-name'] = project
writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n')

console.log(`Project ${project}: your stack will be AgentCore-${project}-default, your runtime ${project}_GameMaster`)
