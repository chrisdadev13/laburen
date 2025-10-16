import { tool } from 'ai';
import { z } from 'zod';
import { searchDocuments, getDocumentById, listDocuments } from './vector-store';

/**
 * Tool for searching documents using semantic similarity
 */
export const searchDocsTool = tool({
  description:
    'Search through the knowledge base documents using semantic search. Use this when the user asks questions about products, policies, technical documentation, or any information that might be in the company knowledge base. Returns the most relevant documents with their content.',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'The search query - can be a question or keywords to search for in the knowledge base'
      ),
    topK: z
      .number()
      .int()
      .positive()
      .max(5)
      .optional()
      .default(3)
      .describe('Number of most relevant documents to return (max 5, default 3)'),
  }),
  execute: async ({ query, topK = 3 }) => {
    try {
      const results = await searchDocuments(query, topK);

      if (results.length === 0) {
        return {
          success: true,
          message: 'No relevant documents found in the knowledge base.',
          results: [],
        };
      }

      return {
        success: true,
        message: `Found ${results.length} relevant document(s).`,
        results: results.map((result) => ({
          filename: result.document.filename,
          title: result.document.metadata?.title || result.document.filename,
          relevanceScore: result.score.toFixed(3),
          content: result.document.content,
          preview: result.document.content.substring(0, 300) + '...',
        })),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to search documents',
      };
    }
  },
});

/**
 * Tool for retrieving a specific document by its ID/filename
 */
export const getDocContentTool = tool({
  description:
    'Retrieve the full content of a specific document from the knowledge base by its filename or ID. Use this when you need to read the complete content of a document that was found in a search.',
  inputSchema: z.object({
    fileId: z
      .string()
      .describe(
        'The filename or ID of the document to retrieve (e.g., "product-guide.md")'
      ),
  }),
  execute: async ({ fileId }) => {
    try {
      const document = await getDocumentById(fileId);

      if (!document) {
        return {
          success: false,
          error: `Document with ID "${fileId}" not found.`,
        };
      }

      return {
        success: true,
        message: `Retrieved document: ${document.metadata?.title || document.filename}`,
        document: {
          id: document.id,
          filename: document.filename,
          title: document.metadata?.title,
          content: document.content,
          lastModified: document.metadata?.lastModified,
          size: document.metadata?.size,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve document',
      };
    }
  },
});

/**
 * Tool for listing all available documents in the knowledge base
 */
export const listDocsTool = tool({
  description:
    'List all available documents in the knowledge base. Use this when the user wants to know what documentation is available or browse the knowledge base.',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const documents = await listDocuments();

      if (documents.length === 0) {
        return {
          success: true,
          message: 'No documents found in the knowledge base.',
          documents: [],
        };
      }

      return {
        success: true,
        message: `Found ${documents.length} document(s) in the knowledge base.`,
        documents: documents.map((doc) => ({
          id: doc.id,
          title: doc.title,
          filename: doc.filename,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to list documents',
      };
    }
  },
});
