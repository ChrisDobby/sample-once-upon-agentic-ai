/**
 * Build the Rules Agent knowledge base: a ChromaDB collection of D&D Basic Rules passages.
 *
 * Start the Chroma server first (it stores the data in utils/dnd_knowledge_base), from the repository root:
 *     npm run ch5:chroma
 * Then, with DnD_BasicRules_2018.pdf in this folder, run in another terminal:
 *     npm run ch5:kb
 */
import { existsSync, readFileSync } from 'node:fs'
import { ChromaClient } from 'chromadb'
import { extractText, getDocumentProxy } from 'unpdf'

const PDF_FILE = 'DnD_BasicRules_2018.pdf'
const CHROMA = { host: 'localhost', port: 8005 }
const COLLECTION = 'dnd_basic_rules'
// Printed at the top of almost every page; useless for search, so it is stripped.
const FOOTER =
  'D&D Basic Rules (Version 1.0). Not for resale. Permission granted to print and photocopy this document for personal use only.'
const CHUNK_SIZE = 1000 // characters per passage
const CHUNK_OVERLAP = 200 // characters shared by two consecutive passages, so a rule cut in two stays findable

interface Chunk {
  id: string
  text: string
  metadata: { page: number; source: string }
}

/** Read the PDF page by page and cut each page into overlapping passages. */
async function extractChunks(pdfPath: string): Promise<Chunk[]> {
  const pdf = await getDocumentProxy(new Uint8Array(readFileSync(pdfPath)))
  const { text: pages } = await extractText(pdf, { mergePages: false })
  const chunks: Chunk[] = []
  pages.forEach((pageText, index) => {
    const pageNumber = index + 1
    // normalise all whitespace to single spaces
    const text = pageText.replaceAll(FOOTER, ' ').split(/\s+/).filter(Boolean).join(' ')
    let start = 0
    while (start < text.length) {
      let end = Math.min(start + CHUNK_SIZE, text.length)
      if (end < text.length) {
        // cut on a space, not in the middle of a word
        const cut = text.lastIndexOf(' ', end - 1)
        if (cut >= start + CHUNK_SIZE / 2) end = cut
      }
      const passage = text.slice(start, end).trim()
      if (passage.length > 50) {
        chunks.push({
          id: `page_${pageNumber}_offset_${start}`,
          text: passage,
          metadata: { page: pageNumber, source: PDF_FILE },
        })
      }
      if (end === text.length) break
      start = end - CHUNK_OVERLAP
    }
  })
  return chunks
}

async function createKnowledgeBase(): Promise<void> {
  console.log('Extracting text from the PDF...')
  const chunks = await extractChunks(PDF_FILE)
  console.log(`${chunks.length} passages extracted`)

  const client = new ChromaClient(CHROMA)
  const existing = await client.listCollections()
  if (existing.some((c) => c.name === COLLECTION)) {
    console.log(`Collection '${COLLECTION}' already exists, rebuilding it`)
    await client.deleteCollection({ name: COLLECTION })
  }
  const collection = await client.createCollection({ name: COLLECTION })

  console.log('Embedding passages into ChromaDB (the embedding model is downloaded on first run)...')
  const batch = 100
  for (let i = 0; i < chunks.length; i += batch) {
    const part = chunks.slice(i, i + batch)
    await collection.add({
      ids: part.map((c) => c.id),
      documents: part.map((c) => c.text),
      metadatas: part.map((c) => c.metadata),
    })
    console.log(`  ${Math.min(i + batch, chunks.length)}/${chunks.length}`)
  }

  console.log(`Knowledge base created (${await collection.count()} passages in '${COLLECTION}')`)
}

if (!existsSync(PDF_FILE)) {
  console.error(`'${PDF_FILE}' not found. Download it next to this script first (see the workshop instructions).`)
  process.exit(1)
}
await createKnowledgeBase()
console.log('Knowledge base creation complete!')
