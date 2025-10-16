/**
 * Script to build the vector store from documents in /data directory
 * Run with: npx tsx scripts/build-vector-store.ts
 */

import { buildVectorStore } from '../lib/vector-store';

async function main() {
  console.log('🚀 Building vector store...\n');

  try {
    const documents = await buildVectorStore(); // force rebuild

    console.log('\n✅ Vector store built successfully!');
    console.log(`📚 Indexed ${documents.length} documents:\n`);

    for (const doc of documents) {
      console.log(`  - ${doc.metadata?.title || doc.filename}`);
      console.log(`    File: ${doc.filename}`);
      console.log(`    Size: ${doc.metadata?.size} bytes`);
      console.log(`    Embedding dimensions: ${doc.embedding?.length || 0}`);
      console.log('');
    }

    console.log('💾 Vector store saved to: data/.vector-store.json');
  } catch (error) {
    console.error('❌ Error building vector store:', error);
    process.exit(1);
  }
}

main();
