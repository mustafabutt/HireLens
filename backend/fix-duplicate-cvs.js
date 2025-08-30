// Fix duplicate CVs in Pinecone index
// This script identifies CVs with similar content and removes duplicates
// Run this with: node fix-duplicate-cvs.js

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function fixDuplicateCvs() {
  console.log('🔍 Fixing duplicate CVs in Pinecone index...\n');
  
  // Check environment variables
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
    console.log('❌ Missing required environment variables. Please check your .env file.');
    return;
  }
  
  try {
    console.log('🔌 Initializing Pinecone client...');
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
    
    console.log('📋 Fetching all vectors from index...');
    
    // Get index stats
    const stats = await index.describeIndexStats();
    console.log(`Found ${stats.totalRecordCount || 0} total records`);
    
    if (!stats.totalRecordCount || stats.totalRecordCount === 0) {
      console.log('❌ No vectors found in index');
      return;
    }
    
    // Get all vectors (we'll use a dummy vector to get all results)
    const dummyVector = new Array(3072).fill(0.1); // 3072 dimensions for text-embedding-3-small
    
    const response = await index.query({
      vector: dummyVector,
      topK: Math.min(stats.totalRecordCount, 1000), // Get up to 1000 results
      includeMetadata: true,
    });
    
    console.log(`\n📝 Processing ${response.matches.length} CVs for duplicates...`);
    
    // Group CVs by content similarity
    const cvGroups = new Map();
    const processedIds = new Set();
    
    for (const match of response.matches) {
      if (processedIds.has(match.id)) continue;
      
      const metadata = match.metadata;
      const fullText = metadata.fullText || '';
      const filename = metadata.filename || 'unknown';
      
      // Create a content hash based on filename and first 100 characters of text
      const contentHash = `${filename.toLowerCase()}_${fullText.substring(0, 100).toLowerCase()}`;
      
      if (!cvGroups.has(contentHash)) {
        cvGroups.set(contentHash, []);
      }
      cvGroups.get(contentHash).push({
        id: match.id,
        score: match.score,
        metadata,
        fullText,
        filename
      });
      
      processedIds.add(match.id);
    }
    
    console.log(`\n🔍 Found ${cvGroups.size} unique content groups`);
    
    let duplicateGroups = 0;
    let totalDuplicates = 0;
    let removedCount = 0;
    
    // Process each group
    for (const [contentHash, cvs] of cvGroups) {
      if (cvs.length > 1) {
        duplicateGroups++;
        totalDuplicates += cvs.length - 1;
        
        console.log(`\n📁 Duplicate group "${contentHash}":`);
        console.log(`   Found ${cvs.length} CVs with similar content`);
        
        // Sort by score (keep the one with highest score) and upload date
        cvs.sort((a, b) => {
          // First sort by score (descending)
          if (b.score !== a.score) {
            return (b.score || 0) - (a.score || 0);
          }
          // Then by upload date (keep the newest)
          const dateA = new Date(a.metadata.uploadDate || 0);
          const dateB = new Date(b.metadata.uploadDate || 0);
          return dateB - dateA;
        });
        
        // Keep the first one (highest score/newest), remove the rest
        const keepCv = cvs[0];
        const removeCvs = cvs.slice(1);
        
        console.log(`   ✅ Keeping: ${keepCv.filename} (ID: ${keepCv.id}, Score: ${keepCv.score})`);
        
        for (const removeCv of removeCvs) {
          console.log(`   ❌ Removing: ${removeCv.filename} (ID: ${removeCv.id}, Score: ${removeCv.score})`);
          
          try {
            // Delete the duplicate vector
            await index.deleteOne(removeCv.id);
            removedCount++;
            console.log(`      ✅ Successfully removed duplicate CV ${removeCv.id}`);
          } catch (error) {
            console.log(`      ❌ Failed to remove duplicate CV ${removeCv.id}: ${error.message}`);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    console.log(`\n🎉 Duplicate cleanup completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Total CVs processed: ${response.matches.length}`);
    console.log(`   • Duplicate groups found: ${duplicateGroups}`);
    console.log(`   • Total duplicates removed: ${removedCount}`);
    console.log(`   • Remaining unique CVs: ${response.matches.length - removedCount}`);
    
    if (duplicateGroups > 0) {
      console.log(`\n💡 Duplicates were found and removed. Your search results should now be clean!`);
    } else {
      console.log(`\n✅ No duplicates found. Your index is already clean!`);
    }
    
  } catch (error) {
    console.log('❌ Fixing duplicates failed:');
    console.log('Error:', error.message);
  }
}

// Also provide a function to just analyze without removing
async function analyzeDuplicates() {
  console.log('🔍 Analyzing duplicates in Pinecone index (read-only)...\n');
  
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
    console.log('❌ Missing required environment variables. Please check your .env file.');
    return;
  }
  
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
    const stats = await index.describeIndexStats();
    
    if (!stats.totalRecordCount || stats.totalRecordCount === 0) {
      console.log('❌ No vectors found in index');
      return;
    }
    
    const dummyVector = new Array(3072).fill(0.1);
    const response = await index.query({
      vector: dummyVector,
      topK: Math.min(stats.totalRecordCount, 1000),
      includeMetadata: true,
    });
    
    const cvGroups = new Map();
    const processedIds = new Set();
    
    for (const match of response.matches) {
      if (processedIds.has(match.id)) continue;
      
      const metadata = match.metadata;
      const fullText = metadata.fullText || '';
      const filename = metadata.filename || 'unknown';
      
      const contentHash = `${filename.toLowerCase()}_${fullText.substring(0, 100).toLowerCase()}`;
      
      if (!cvGroups.has(contentHash)) {
        cvGroups.set(contentHash, []);
      }
      cvGroups.get(contentHash).push({
        id: match.id,
        score: match.score,
        metadata,
        filename
      });
      
      processedIds.add(match.id);
    }
    
    let duplicateGroups = 0;
    let totalDuplicates = 0;
    
    for (const [contentHash, cvs] of cvGroups) {
      if (cvs.length > 1) {
        duplicateGroups++;
        totalDuplicates += cvs.length - 1;
        
        console.log(`\n📁 Duplicate group "${contentHash}":`);
        console.log(`   Found ${cvs.length} CVs with similar content`);
        
        cvs.forEach((cv, index) => {
          console.log(`   ${index + 1}. ${cv.filename} (ID: ${cv.id}, Score: ${cv.score})`);
        });
      }
    }
    
    console.log(`\n📊 Analysis Summary:`);
    console.log(`   • Total CVs: ${response.matches.length}`);
    console.log(`   • Duplicate groups: ${duplicateGroups}`);
    console.log(`   • Total duplicates: ${totalDuplicates}`);
    
    if (duplicateGroups > 0) {
      console.log(`\n💡 Run 'node fix-duplicate-cvs.js' to remove these duplicates.`);
    }
    
  } catch (error) {
    console.log('❌ Analysis failed:', error.message);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--analyze') || args.includes('-a')) {
  analyzeDuplicates();
} else {
  fixDuplicateCvs();
} 