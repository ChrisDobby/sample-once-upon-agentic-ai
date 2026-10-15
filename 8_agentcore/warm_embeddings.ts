/**
 * Downloads Chroma's default embedding model (all-MiniLM-L6-v2) while the image is built,
 * so the container doesn't fetch it on the first rules question. You do not need to change this file.
 */
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed'

await new DefaultEmbeddingFunction().generate(['warm up'])
console.log('Embedding model cached')
