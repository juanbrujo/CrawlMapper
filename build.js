#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const consoleLogRegex = /console\.log\([^)]*\);?\s*/g;
const singleLineCommentRegex = /\/\/.*$/gm;
const multiLineCommentRegex = /\/\*[\s\S]*?\*\//g;

function processJavaScriptCode(code) {
  // Remove single-line comments first
  code = code.replace(singleLineCommentRegex, '');

  // Remove multi-line comments
  code = code.replace(multiLineCommentRegex, '');

  // Remove console.log statements but keep console.error
  code = code.replace(consoleLogRegex, '');

  // Clean up extra blank lines but preserve formatting
  code = code.replace(/\n\s*\n\s*\n/g, '\n\n');

  return code.trim();
}

function findJsFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', 'dist', 'build', '.git', '.husky'].includes(file)) {
        findJsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
      // Skip build scripts and config files
      if (!['build.js', 'vite.config.js', 'eslint.config.js'].includes(file)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

function buildProject() {
  console.log('🚀 Starting build process...');

  const jsFiles = findJsFiles('.');

  for (const file of jsFiles) {
    console.log(`Processing: ${file}`);

    try {
      let code = readFileSync(file, 'utf8');

      // Process the code to remove console.log and comments
      const originalSize = code.length;
      code = processJavaScriptCode(code);
      const newSize = code.length;

      if (newSize < originalSize) {
        // Write the processed code back
        writeFileSync(file, code);
        console.log(
          `✅ Processed: ${file} (${originalSize} → ${newSize} bytes)`
        );
      } else {
        console.log(`⏭️  Skipped: ${file} (no changes needed)`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log('🎉 Build complete!');
}

buildProject();
