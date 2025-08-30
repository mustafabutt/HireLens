// Fix skill catalog by adding case variations
// Run this with: node fix-skill-catalog.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/cv/cv.service.ts');

try {
  console.log('🔧 Fixing skill catalog with case variations...\n');
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix React skill variants
  console.log('📝 Adding case variations for React...');
  content = content.replace(
    "react: ['react', 'reactjs', 'react.js', 'react native'],",
    "react: ['react', 'reactjs', 'react.js', 'react native', 'React', 'ReactJS', 'React.js', 'React Native'],"
  );
  
  // Fix Angular skill variants
  console.log('📝 Adding case variations for Angular...');
  content = content.replace(
    "angular: ['angular', 'angularjs', 'angular.js'],",
    "angular: ['angular', 'angularjs', 'angular.js', 'Angular', 'AngularJS', 'Angular.js'],"
  );
  
  // Fix Vue skill variants
  console.log('📝 Adding case variations for Vue...');
  content = content.replace(
    "vue: ['vue', 'vue.js', 'vuejs'],",
    "vue: ['vue', 'vue.js', 'vuejs', 'Vue', 'Vue.js', 'VueJS'],"
  );
  
  // Fix Node.js skill variants
  console.log('📝 Adding case variations for Node.js...');
  content = content.replace(
    "'node.js': ['node.js', 'nodejs', 'node js', 'node'],",
    "'node.js': ['node.js', 'nodejs', 'node js', 'node', 'Node.js', 'NodeJS', 'Node JS', 'Node'],"
  );
  
  // Fix JavaScript skill variants
  console.log('📝 Adding case variations for JavaScript...');
  content = content.replace(
    "javascript: ['javascript', 'js', 'ecmascript'],",
    "javascript: ['javascript', 'js', 'ecmascript', 'JavaScript', 'JS', 'ECMAScript'],"
  );
  
  // Fix TypeScript skill variants
  console.log('📝 Adding case variations for TypeScript...');
  content = content.replace(
    "typescript: ['typescript', 'ts'],",
    "typescript: ['typescript', 'ts', 'TypeScript', 'TS'],"
  );
  
  // Fix Python skill variants
  console.log('📝 Adding case variations for Python...');
  content = content.replace(
    "python: ['python', 'py'],",
    "python: ['python', 'py', 'Python', 'PY'],"
  );
  
  // Fix Java skill variants
  console.log('📝 Adding case variations for Java...');
  content = content.replace(
    "java: ['java', 'j2ee', 'j2se'],",
    "java: ['java', 'j2ee', 'j2se', 'Java', 'J2EE', 'J2SE'],"
  );
  
  // Fix C# skill variants
  console.log('📝 Adding case variations for C#...');
  content = content.replace(
    "'c#': ['c#', 'csharp', 'dotnet', '.net'],",
    "'c#': ['c#', 'csharp', 'dotnet', '.net', 'C#', 'CSharp', 'DotNet', '.NET'],"
  );
  
  // Fix C++ skill variants
  console.log('📝 Adding case variations for C++...');
  content = content.replace(
    "'c++': ['c++', 'cpp', 'c plus plus'],",
    "'c++': ['c++', 'cpp', 'c plus plus', 'C++', 'CPP', 'C Plus Plus'],"
  );
  
  // Fix HTML skill variants
  console.log('📝 Adding case variations for HTML...');
  content = content.replace(
    "html: ['html', 'html5', 'hypertext markup language'],",
    "html: ['html', 'html5', 'hypertext markup language', 'HTML', 'HTML5', 'HyperText Markup Language'],"
  );
  
  // Fix CSS skill variants
  console.log('📝 Adding case variations for CSS...');
  content = content.replace(
    "css: ['css', 'css3', 'cascading style sheets'],",
    "css: ['css', 'css3', 'cascading style sheets', 'CSS', 'CSS3', 'Cascading Style Sheets'],"
  );
  
  // Fix Express skill variants
  console.log('📝 Adding case variations for Express...');
  content = content.replace(
    "express: ['express', 'express.js', 'expressjs'],",
    "express: ['express', 'express.js', 'expressjs', 'Express', 'Express.js', 'ExpressJS'],"
  );
  
  // Fix Next.js skill variants
  console.log('📝 Adding case variations for Next.js...');
  content = content.replace(
    "next: ['next.js', 'nextjs'],",
    "next: ['next.js', 'nextjs', 'Next.js', 'NextJS', 'Next'],"
  );
  
  // Fix Nuxt.js skill variants
  console.log('📝 Adding case variations for Nuxt.js...');
  content = content.replace(
    "nuxt: ['nuxt.js', 'nuxtjs'],",
    "nuxt: ['nuxt.js', 'nuxtjs', 'Nuxt.js', 'NuxtJS', 'Nuxt'],"
  );
  
  // Fix Svelte skill variants
  console.log('📝 Adding case variations for Svelte...');
  content = content.replace(
    "svelte: ['svelte'],",
    "svelte: ['svelte', 'Svelte'],"
  );
  
  // Fix Fastify skill variants
  console.log('📝 Adding case variations for Fastify...');
  content = content.replace(
    "fastify: ['fastify'],",
    "fastify: ['fastify', 'Fastify'],"
  );
  
  // Fix Koa skill variants
  console.log('📝 Adding case variations for Koa...');
  content = content.replace(
    "koa: ['koa'],",
    "koa: ['koa', 'Koa'],"
  );
  
  // Fix Hapi skill variants
  console.log('📝 Adding case variations for Hapi...');
  content = content.replace(
    "hapi: ['hapi'],",
    "hapi: ['hapi', 'Hapi'],"
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('\n✅ Successfully updated skill catalog with case variations!');
  console.log('\n💡 Now you need to:');
  console.log('   1. Restart your backend server');
  console.log('   2. Test the search again');
  console.log('   3. Run: node debug-react-search.js to verify the fix');
  
} catch (error) {
  console.error('❌ Error fixing skill catalog:', error.message);
} 