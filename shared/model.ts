/**
 * The model every chapter runs on: Claude Sonnet 4.6 on Amazon Bedrock.
 * The region is pinned so the workshop behaves the same whatever your AWS config says.
 */
import { ChatBedrockConverse } from '@langchain/aws'

export const model = new ChatBedrockConverse({
  model: 'global.anthropic.claude-sonnet-4-6',
  region: 'us-west-2',
})
