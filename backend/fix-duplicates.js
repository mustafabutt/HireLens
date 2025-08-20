// Fix duplicate keys in cv.service.ts
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/cv/cv.service.ts');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the duplicate in the main catalog
  content = content.replace(
    "'web development': ['web development', 'web dev', 'web development']",
    "'web development': ['web development', 'web dev']"
  );
  
  // Fix the duplicate in getSkillVariants method
  content = content.replace(
    "'web development': ['web development', 'web dev', 'web development']",
    "'web development': ['web development', 'web dev']"
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed duplicate keys in cv.service.ts');
  
} catch (error) {
  console.error('❌ Error fixing duplicates:', error.message);
} 