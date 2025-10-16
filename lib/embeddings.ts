// Production-ready embeddings using AI SDK
// Uses external embedding service instead of local models

import { embed } from 'ai';

/**
 * Generate embeddings using AI SDK's embedding service
 * This uses the configured AI provider (e.g., OpenAI, Anthropic, etc.)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use AI SDK's embed function with the configured provider
    const { embedding } = await embed({
      model: process.env.AI_EMBEDDING_MODEL || 'text-embedding-ada-002', // Default to OpenAI's model
      value: text,
    });

    return embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);

    // Fallback to simple hash-based embedding if AI service fails
    console.warn('Falling back to simple embedding generation');

    // Create a deterministic embedding based on text content
    const fallbackEmbedding = new Array(1536).fill(0); // OpenAI ada-002 dimensions

    for (let i = 0; i < fallbackEmbedding.length; i++) {
      const charIndex = i % text.length;
      const char = text.charCodeAt(charIndex);
      const positionFactor = (i * 0.618033988749) % 1; // Golden ratio

      fallbackEmbedding[i] = (Math.sin(char * positionFactor * 0.1) * 0.5 + 0.5) * 2 - 1;
    }

    // Normalize the embedding vector
    const magnitude = Math.sqrt(fallbackEmbedding.reduce((sum, val) => sum + val * val, 0));
    return fallbackEmbedding.map(val => val / magnitude);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
