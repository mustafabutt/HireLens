# Fix Duplicate CV Search Results

## Problem Description

After migrating from local file storage to Supabase storage, your CV search is returning duplicate results. This typically happens when:

1. **CVs were indexed multiple times** during the migration process
2. **Different IDs were generated** for the same CV content
3. **Metadata inconsistencies** between old and new entries

## Root Cause

The issue occurs because:
- During migration, the same CV might have been processed multiple times
- Each processing generates a new UUID, creating multiple entries in Pinecone
- The search service's deduplication only checks for duplicate IDs, not duplicate content

## Solution Steps

### Step 1: Analyze the Problem

First, let's see how many duplicates you have:

```bash
cd backend
node fix-duplicate-cvs.js --analyze
```

This will show you:
- Total CVs in your index
- How many duplicate groups exist
- Which CVs are duplicated

### Step 2: Fix the Duplicates

Run the fix script to remove duplicates:

```bash
cd backend
node fix-duplicate-cvs.js
```

This script will:
- Identify CVs with similar content
- Keep the one with the highest similarity score
- Remove all duplicates
- Preserve the best version of each CV

### Step 3: Test the Fix

Verify that duplicates are gone:

```bash
cd backend
node test-search.js
```

This will test various search queries and confirm no duplicates are returned.

### Step 4: Reindex if Needed

If you still have issues, reindex your CVs:

```bash
cd backend
node reindex-cvs.js
```

## How the Fix Works

### 1. Content-Based Deduplication

The fix script groups CVs by:
- **Filename** (exact match)
- **Content hash** (first 100 characters of text)

This catches duplicates even if they have different IDs.

### 2. Smart Selection

When duplicates are found, the script keeps the CV with:
- **Highest similarity score** (best quality)
- **Newest upload date** (most recent)

### 3. Enhanced Search Deduplication

The search service now checks for:
- Duplicate IDs
- Duplicate content hashes

This prevents duplicates from appearing in search results.

## Prevention

To avoid future duplicates:

1. **Check before indexing**: Verify if a CV already exists before processing
2. **Use consistent file naming**: Ensure unique filenames for different CVs
3. **Monitor uploads**: Log all CV processing to track potential duplicates

## Files Modified

- `backend/fix-duplicate-cvs.js` - New script to fix duplicates
- `backend/test-search.js` - New script to test search functionality
- `backend/src/cv/cv.service.ts` - Enhanced deduplication logic

## Troubleshooting

### If the fix script fails:

1. Check your environment variables:
   ```bash
   PINECONE_API_KEY=your_key
   PINECONE_INDEX_NAME=your_index
   ```

2. Verify Pinecone connection:
   ```bash
   node debug-pinecone.js
   ```

3. Check for rate limiting:
   - The script includes delays between operations
   - If you hit limits, increase the delay in the script

### If duplicates persist:

1. Run the analysis again:
   ```bash
   node fix-duplicate-cvs.js --analyze
   ```

2. Check if new duplicates were created during the fix process

3. Consider clearing the entire index and reindexing from scratch

## Expected Results

After running the fix:

- ✅ No duplicate CVs in search results
- ✅ Clean, unique search results
- ✅ Improved search performance
- ✅ Consistent CV metadata

## Next Steps

1. **Run the fix script** to remove duplicates
2. **Test your search** to confirm the fix worked
3. **Monitor uploads** to prevent future duplicates
4. **Consider implementing** a pre-upload duplicate check

## Support

If you encounter issues:

1. Check the console output for error messages
2. Verify your Pinecone configuration
3. Ensure your environment variables are set correctly
4. Check the Pinecone console for index status

---

**Note**: Always backup your data before running cleanup scripts. While this script is designed to be safe, it's good practice to have a backup of your Pinecone index. 