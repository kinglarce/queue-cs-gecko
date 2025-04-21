/**
 * Script to find and list JavaScript files that should be converted to TypeScript
 * This helps in standardizing the codebase by identifying .js files that need to be converted to .tsx/.ts
 */
const fs = require('fs');
const path = require('path');

// Configuration
const srcDir = path.join(__dirname, 'src');
const excludeDirs = ['node_modules', 'build', 'dist', 'coverage'];

// Results
const jsFiles = [];
const alreadyTsFiles = [];

// Function to recursively scan directories for .js files
function scanDirectory(dir) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      // Skip excluded directories
      if (excludeDirs.includes(item)) continue;
      
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        // Check file extension
        const ext = path.extname(item).toLowerCase();
        const baseName = path.basename(item, ext);
        const relativePath = path.relative(srcDir, fullPath);
        
        if (ext === '.js' || ext === '.jsx') {
          // Check if TypeScript version already exists
          const tsxPath = path.join(dir, `${baseName}.tsx`);
          const tsPath = path.join(dir, `${baseName}.ts`);
          
          const hasTsxVersion = fs.existsSync(tsxPath);
          const hasTsVersion = fs.existsSync(tsPath);
          
          if (!hasTsxVersion && !hasTsVersion) {
            jsFiles.push({
              path: relativePath,
              fullPath,
              baseName,
              recommendedExt: item.includes('jsx') || item.includes('Component') || item.includes('Page') ? '.tsx' : '.ts'
            });
          }
        } else if (ext === '.ts' || ext === '.tsx') {
          alreadyTsFiles.push(relativePath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
}

// Execute the scan
console.log(`Scanning ${srcDir} for JavaScript files...`);
scanDirectory(srcDir);

// Print results
console.log('\n===== JavaScript Files to Convert =====');
if (jsFiles.length === 0) {
  console.log('No JavaScript files found that need to be converted.');
} else {
  console.log(`Found ${jsFiles.length} JavaScript files to convert to TypeScript:`);
  
  for (const file of jsFiles) {
    console.log(`- ${file.path} => ${path.basename(file.path, path.extname(file.path))}${file.recommendedExt}`);
  }
  
  // Generate suggested commands
  console.log('\n===== Suggested Conversion Commands =====');
  for (const file of jsFiles) {
    const newPath = path.join(
      path.dirname(file.fullPath),
      `${path.basename(file.fullPath, path.extname(file.fullPath))}${file.recommendedExt}`
    );
    console.log(`cp "${file.fullPath}" "${newPath}" && code "${newPath}"`);
  }
}

console.log('\n===== Already TypeScript Files =====');
console.log(`Found ${alreadyTsFiles.length} TypeScript files.`);

// Save results to a file
const output = {
  jsFiles,
  alreadyTsFiles,
  totalJs: jsFiles.length,
  totalTs: alreadyTsFiles.length,
  scanDate: new Date().toISOString()
};

fs.writeFileSync(
  path.join(__dirname, 'typescript-conversion-report.json'),
  JSON.stringify(output, null, 2)
);

console.log('\nReport saved to typescript-conversion-report.json');
console.log('\nTo convert all files at once, consider running a command like:');
console.log('for file in $(find src -name "*.js"); do cp "$file" "${file%.js}.tsx"; done');
console.log('for file in $(find src -name "*.jsx"); do cp "$file" "${file%.jsx}.tsx"; done'); 