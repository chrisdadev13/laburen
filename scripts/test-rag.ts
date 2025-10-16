/**
 * Test script to demonstrate RAG system functionality
 * Run with: npx tsx scripts/test-rag.ts
 */

import { searchDocuments, getDocumentById, listDocuments } from '../lib/vector-store';

async function main() {
  console.log('🧪 Testing RAG System\n');
  console.log('='.repeat(60));

  // Test 1: List all documents
  console.log('\n📚 Test 1: List All Documents');
  console.log('-'.repeat(60));
  const docs = await listDocuments();
  docs.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.title}`);
    console.log(`   File: ${doc.filename}`);
  });

  // Test 2: Semantic search
  console.log('\n\n🔍 Test 2: Semantic Search');
  console.log('-'.repeat(60));
  
  const queries = [
    'What are the pricing plans?',
    'What is the return policy?',
    'How do I authenticate with the API?',
  ];

  for (const query of queries) {
    console.log(`\nQuery: "${query}"`);
    const results = await searchDocuments(query, 2);
    
    results.forEach((result, i) => {
      console.log(`\n  ${i + 1}. ${result.document.metadata?.title} (Score: ${result.score.toFixed(3)})`);
      console.log(`     File: ${result.document.filename}`);
      console.log(`     Preview: ${result.document.content.substring(0, 100)}...`);
    });
  }

  // Test 3: Get specific document
  console.log('\n\n📄 Test 3: Get Specific Document');
  console.log('-'.repeat(60));
  const doc = await getDocumentById('product-guide.md');
  if (doc) {
    console.log(`Title: ${doc.metadata?.title}`);
    console.log(`File: ${doc.filename}`);
    console.log(`Size: ${doc.metadata?.size} bytes`);
    console.log(`Content preview:\n${doc.content.substring(0, 200)}...`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed successfully!\n');
}

main().catch(console.error);
