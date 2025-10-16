# Knowledge Base Directory

This directory contains the documents that will be indexed and searchable by the RAG system.

## Supported File Types
- Markdown files (`.md`)
- Text files (`.txt`)

## How to Add Documents

1. Create a new `.md` or `.txt` file in this directory
2. Add your content (markdown formatting supported)
3. The vector store will automatically rebuild on the next query

### Example Document Structure

```markdown
# Document Title

## Section 1
Content here...

## Section 2
More content...
```

## Manual Vector Store Rebuild

If you want to manually rebuild the vector store after adding documents:

```bash
npm run build-vectors
```

This will:
- Scan all documents in this directory
- Generate embeddings for each document
- Save the vector store to `.vector-store.json`

## Current Documents

- **product-guide.md** - Product information and pricing
- **company-policies.md** - Company policies and SLA
- **technical-documentation.md** - API reference and integration guide

## Tips

1. **Use descriptive titles**: Start each document with a `# Title`
2. **Organize with sections**: Use `##` for sections
3. **Keep documents focused**: One topic per document works best
4. **Use clear language**: Write as if explaining to a customer
5. **Update regularly**: Keep information current

## Hidden Files

- `.vector-store.json` - Auto-generated, contains document embeddings (do not edit)
- `.gitignore` - Excludes vector store from git (optional)

## Search Quality

The semantic search works best when:
- Documents are well-structured
- Content is clear and descriptive
- Topics are distinct between documents
- Key terms are used naturally

## Example Queries

Users can ask questions like:
- "What are your pricing plans?"
- "What's your return policy?"
- "How do I use the API?"
- "Show me the technical documentation"
