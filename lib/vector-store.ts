import fs from 'fs/promises';
import path from 'path';
import { generateEmbedding, cosineSimilarity } from './embeddings';

export interface Document {
  id: string;
  filename: string;
  content: string;
  embedding?: number[];
  metadata?: {
    title?: string;
    lastModified?: Date;
    size?: number;
  };
}

export interface SearchResult {
  document: Document;
  score: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const VECTOR_STORE_PATH = path.join(process.cwd(), 'data', '.vector-store.json');

/**
 * Load all documents from the data directory
 */
export async function loadDocuments(): Promise<Document[]> {
  try {
    const files = await fs.readdir(DATA_DIR);
    const documents: Document[] = [];

    for (const file of files) {
      // Skip hidden files and the vector store file
      if (file.startsWith('.')) continue;

      const filePath = path.join(DATA_DIR, file);
      const stats = await fs.stat(filePath);

      // Only process text/markdown files
      if (stats.isFile() && (file.endsWith('.md') || file.endsWith('.txt'))) {
        const content = await fs.readFile(filePath, 'utf-8');
        const title = extractTitle(content);

        documents.push({
          id: file,
          filename: file,
          content,
          metadata: {
            title,
            lastModified: stats.mtime,
            size: stats.size,
          },
        });
      }
    }

    return documents;
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
}

/**
 * Extract title from markdown content (first # heading)
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Untitled';
}

/**
 * Build or load the vector store
 */
export async function buildVectorStore(force = false): Promise<Document[]> {
  // Check if vector store exists and is not forced to rebuild
  if (!force) {
    try {
      const storeData = await fs.readFile(VECTOR_STORE_PATH, 'utf-8');
      const documents = JSON.parse(storeData) as Document[];
      console.log(`Loaded ${documents.length} documents from vector store`);
      return documents;
    } catch {
      // Vector store doesn't exist, build it
      console.log('Vector store not found, building...');
    }
  }

  // Load documents and generate embeddings
  const documents = await loadDocuments();
  console.log(`Generating embeddings for ${documents.length} documents...`);

  for (const doc of documents) {
    // Generate embedding for the document content
    doc.embedding = await generateEmbedding(doc.content);
  }

  // Save vector store
  await fs.writeFile(VECTOR_STORE_PATH, JSON.stringify(documents, null, 2));
  console.log('Vector store built and saved');

  return documents;
}

/**
 * Search documents by semantic similarity
 */
export async function searchDocuments(
  query: string,
  topK = 3
): Promise<SearchResult[]> {
  // Load vector store
  const documents = await buildVectorStore();

  if (documents.length === 0) {
    return [];
  }

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Calculate similarities
  const results: SearchResult[] = documents
    .map((doc) => ({
      document: doc,
      score: doc.embedding
        ? cosineSimilarity(queryEmbedding, doc.embedding)
        : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return results;
}

/**
 * Get document by ID (filename)
 */
export async function getDocumentById(id: string): Promise<Document | null> {
  const documents = await buildVectorStore();
  return documents.find((doc) => doc.id === id) || null;
}

/**
 * Get all document IDs and titles
 */
export async function listDocuments(): Promise<
  Array<{ id: string; title: string; filename: string }>
> {
  const documents = await buildVectorStore();
  return documents.map((doc) => ({
    id: doc.id,
    title: doc.metadata?.title || doc.filename,
    filename: doc.filename,
  }));
}
