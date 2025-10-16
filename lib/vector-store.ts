import { db } from "@/db/drizzle";
import { document } from "@/db/schema";
import { sql } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

export interface Document {
  id: string;
  filename: string;
  title: string;
  content: string;
  embedding?: number[];
  metadata?: {
    title?: string;
    lastModified?: Date;
    size?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  document: Document;
  score: number;
}

/**
 * Load all documents from the database
 */
export async function loadDocuments(): Promise<Document[]> {
  try {
    const docs = await db.select().from(document);
    return docs.map(doc => ({
      id: doc.id,
      filename: doc.filename,
      title: doc.title,
      content: doc.content,
      embedding: doc.embedding as number[] | undefined,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
}

/**
 * Add a document to the vector store
 */
export async function addDocument(
  id: string,
  filename: string,
  title: string,
  content: string
): Promise<void> {
  try {
    // Generate embedding for the document
    const embedding = await generateEmbedding(content);

    // Parse metadata if available
    const metadata = extractMetadata(content);

    await db.insert(document).values({
      id,
      filename,
      title,
      content,
      embedding,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    console.log(`Added document: ${title}`);
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
}

/**
 * Extract metadata from document content
 */
function extractMetadata(content: string): { title?: string; size?: number } | null {
  // Extract title from markdown (# heading)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : undefined;

  return {
    title,
    size: content.length,
  };
}

/**
 * Build vector store from files (for initial setup)
 */
export async function buildVectorStore(): Promise<Document[]> {
  // This would be called during setup to populate the database
  // For now, we'll rely on documents being added individually
  return await loadDocuments();
}

/**
 * Search documents using pgvector similarity search
 */
export async function searchDocuments(
  query: string,
  topK = 3
): Promise<SearchResult[]> {
  try {
    // For now, fall back to simple text search until pgvector is properly configured
    // TODO: Implement proper pgvector similarity search
    const results = await db
      .select()
      .from(document)
      .where(sql`${document.content} ILIKE ${`%${query}%`}`)
      .limit(topK);

    return results.map(result => ({
      document: {
        id: result.id,
        filename: result.filename,
        title: result.title,
        content: result.content,
        embedding: result.embedding as number[] | undefined,
        metadata: result.metadata ? JSON.parse(result.metadata) : undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      score: 0.8, // Placeholder score for text match
    }));
  } catch (error) {
    console.error('Error searching documents:', error);
    return [];
  }
}

/**
 * Get document by ID
 */
export async function getDocumentById(id: string): Promise<Document | null> {
  try {
    const docs = await db
      .select()
      .from(document)
      .where(sql`${document.id} = ${id}`);

    if (docs.length === 0) return null;

    const doc = docs[0];
    return {
      id: doc.id,
      filename: doc.filename,
      title: doc.title,
      content: doc.content,
      embedding: doc.embedding as number[] | undefined,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
}

/**
 * List all documents
 */
export async function listDocuments(): Promise<
  Array<{ id: string; title: string; filename: string }>
> {
  try {
    const docs = await db
      .select({
        id: document.id,
        title: document.title,
        filename: document.filename,
      })
      .from(document);

    return docs.map(doc => ({
      id: doc.id,
      title: doc.title,
      filename: doc.filename,
    }));
  } catch (error) {
    console.error('Error listing documents:', error);
    return [];
  }
}

/**
 * Delete document by ID
 */
export async function deleteDocument(id: string): Promise<void> {
  try {
    await db.delete(document).where(sql`${document.id} = ${id}`);
    console.log(`Deleted document: ${id}`);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}
