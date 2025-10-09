#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-run

/**
 * Test script to verify the build works correctly
 */

import { build } from './esbuild.config.js';

async function testBuild() {
  console.log('🧪 Testing ESBuild configuration...');
  
  try {
    // Run the build
    await build();
    
    // Check if the main output files exist
    const requiredFiles = [
      'dist/main.js',
      'dist/service-worker.js'
    ];
    
    for (const file of requiredFiles) {
      try {
        const stat = await Deno.stat(file);
        if (stat.isFile) {
          console.log(`✅ ${file} exists`);
          
          // Check if it's valid JavaScript
          const content = await Deno.readTextFile(file);
          if (content.includes('SyntaxError') || content.includes('ReferenceError')) {
            console.error(`❌ ${file} contains syntax errors`);
            return false;
          }
          
          // Check for common transpilation issues
          if (content.includes('.ts') && !content.includes('//')) {
            console.warn(`⚠️  ${file} may contain unresolved .ts imports`);
          }
          
          // Check if GameBoard and GameEngine classes are bundled
          if (file === 'dist/main.js') {
            if (!content.includes('class GameBoard') && !content.includes('class GameEngine')) {
              console.warn(`⚠️  ${file} may not contain bundled GameBoard and GameEngine classes`);
            }
          }
          
        }
      } catch (error) {
        console.error(`❌ ${file} does not exist:`, error.message);
        return false;
      }
    }
    
    console.log('✅ All build files created successfully!');
    console.log('✅ No obvious syntax errors detected');
    console.log('🚀 Build test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Build test failed:', error);
    return false;
  }
}

if (import.meta.main) {
  const success = await testBuild();
  Deno.exit(success ? 0 : 1);
}