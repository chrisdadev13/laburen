#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { addDocument } from '../lib/vector-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * Extract title from markdown content (first # heading)
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Untitled';
}

/**
 * Migrate documents from data directory to database
 */
async function migrateDocuments() {
  try {
    console.log('🚀 Starting document migration...');

    const files = await fs.readdir(DATA_DIR);
    const documents: Array<{ id: string; filename: string; title: string; content: string }> = [];

    for (const file of files) {
      // Skip hidden files and the vector store file
      if (file.startsWith('.') || file === '.vector-store.json') continue;

      const filePath = path.join(DATA_DIR, file);

      try {
        const stats = await fs.stat(filePath);

        // Only process markdown files
        if (stats.isFile() && file.endsWith('.md')) {
          const content = await fs.readFile(filePath, 'utf-8');
          const title = extractTitle(content);

          documents.push({
            id: file,
            filename: file,
            title,
            content,
          });

          console.log(`📄 Found document: ${title} (${file})`);
        }
      } catch (error) {
        console.error(`❌ Error reading file ${file}:`, error);
      }
    }

    console.log(`\n📊 Found ${documents.length} documents to migrate`);

    if (documents.length === 0) {
      console.log('❌ No documents found to migrate');
      return;
    }

    // Migrate each document
    let successCount = 0;
    let errorCount = 0;

    for (const doc of documents) {
      try {
        console.log(`\n🔄 Migrating: ${doc.title}`);

        await addDocument(
          doc.id,
          doc.filename,
          doc.title,
          doc.content
        );

        successCount++;
        console.log(`✅ Successfully migrated: ${doc.title}`);

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to migrate ${doc.title}:`, error);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total: ${documents.length}`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDocuments()
    .then(() => {
      console.log('✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateDocuments };
