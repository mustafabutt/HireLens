// Re-index existing CVs with new metadata structure
// Run this with: node reindex-cvs.js

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function reindexCvs() {
  console.log('🔄 Re-indexing existing CVs with new metadata structure...\n');
  
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
    
    // Get index stats to see how many vectors we have
    const stats = await index.describeIndexStats();
    console.log(`Found ${stats.totalRecordCount || 0} total records`);
    
    if (!stats.totalRecordCount || stats.totalRecordCount === 0) {
      console.log('❌ No vectors found in index');
      return;
    }
    
    // Query to get all vectors (we'll use a dummy vector to get all results)
    const dummyVector = new Array(3072).fill(0.1); // 3072 dimensions for text-embedding-3-large
    
    const response = await index.query({
      vector: dummyVector,
      topK: Math.min(stats.totalRecordCount, 100), // Get up to 100 results
      includeMetadata: true,
    });
    
    console.log(`\n📝 Processing ${response.matches.length} CVs...`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const match of response.matches) {
      try {
        const metadata = match.metadata;
        const id = match.id;
        
        console.log(`\n🔄 Processing CV: ${metadata.filename || id}`);
        
        // Check if this CV already has the new metadata structure
        if (metadata.skillsNormalized && metadata.locationNormalized) {
          console.log('  ✅ Already has new metadata structure, skipping...');
          continue;
        }
        
        // Extract skills from existing metadata or fullText
        let skills = metadata.skills || [];
        if (!Array.isArray(skills)) {
          skills = [];
        }
        
        // Normalize skills
        const skillsNormalized = skills.map(skill => {
          // Simple normalization - you can enhance this
          return skill.toLowerCase().trim();
        });
        
        // Normalize location
        let locationNormalized = null;
        if (metadata.location) {
          locationNormalized = metadata.location.toLowerCase().trim();
        }
        
        // Update the vector with new metadata
        const updateData = {
          id: id,
          setMetadata: {
            skillsNormalized: skillsNormalized.length > 0 ? skillsNormalized : undefined,
            locationNormalized: locationNormalized,
            // Keep existing metadata
            filename: metadata.filename,
            fullText: metadata.fullText,
            uploadDate: metadata.uploadDate,
            fileSize: metadata.fileSize,
            storedFilePath: metadata.storedFilePath,
            storedFilename: metadata.storedFilename,
            cvId: metadata.cvId,
            fullName: metadata.fullName,
            email: metadata.email,
            phone: metadata.phone,
            skills: metadata.skills,
            yearsExperience: metadata.yearsExperience,
            education: metadata.education,
            location: metadata.location,
          }
        };
        
        // Remove undefined values
        Object.keys(updateData.setMetadata).forEach(key => {
          if (updateData.setMetadata[key] === undefined) {
            delete updateData.setMetadata[key];
          }
        });
        
        await index.update(updateData);
        console.log(`  ✅ Updated CV ${id} with new metadata`);
        updatedCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`  ❌ Error updating CV ${match.id}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Re-indexing completed!`);
    console.log(`✅ Successfully updated: ${updatedCount} CVs`);
    console.log(`❌ Errors: ${errorCount} CVs`);
    console.log(`\n💡 Now try searching again - skills and education should be properly indexed!`);
    
  } catch (error) {
    console.log('❌ Re-indexing failed:');
    console.log('Error:', error.message);
  }
}

reindexCvs(); 