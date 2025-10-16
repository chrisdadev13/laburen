# Example: How to Add Custom Documentation

This is an example document showing you how to add your own content to the knowledge base.

## Step 1: Create Your Document

Create a new markdown file in the `/data` directory with a descriptive name:
- `product-features.md`
- `troubleshooting-guide.md`
- `api-changelog.md`
- etc.

## Step 2: Structure Your Content

Use clear headings and sections:

```markdown
# Main Title

## Section 1
Your content here...

## Section 2
More content...

### Subsection
Detailed information...
```

## Step 3: Write Clear Content

- Use simple, clear language
- Include relevant keywords naturally
- Organize information logically
- Add examples where helpful

## Step 4: Rebuild Vector Store

After adding your document:
```bash
npm run build-vectors
```

Or just start using the chat - it will rebuild automatically!

## Tips for Better Search Results

1. **Use descriptive titles** - Helps the AI understand document topics
2. **Include FAQs** - Common questions improve search accuracy
3. **Add context** - Explain acronyms and technical terms
4. **Update regularly** - Keep information current
5. **Test queries** - Try searching for your content

## Example Content Types

### Product Information
- Features and benefits
- Pricing and plans
- Comparisons
- Use cases

### Technical Documentation
- API references
- Integration guides
- Code examples
- Configuration options

### Support Content
- FAQs
- Troubleshooting steps
- Known issues
- Contact information

### Company Information
- Policies
- Terms of service
- Privacy policy
- About us

## What Makes Good Documentation?

✅ **Clear and concise**
✅ **Well-organized**
✅ **Searchable keywords**
✅ **Practical examples**
✅ **Up-to-date information**

❌ Avoid jargon without explanation
❌ Don't bury important info
❌ Keep paragraphs focused

## Testing Your Documentation

After adding a document, test it:
1. Ask questions in the chat
2. See if the AI finds your document
3. Check if the answers are accurate
4. Refine your content if needed

## Need Help?

See `/data/README.md` for more information about the knowledge base directory.
