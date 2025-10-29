#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Post-build script to fix ESBuild output structure
 * Moves files from dist/src/ to dist/
 */

async function fixBuildStructure() {
  console.log('🔧 Fixing build structure...');
  
  const distPath = 'dist';
  const srcPath = `${distPath}/src`;
  
  try {
    // Check if src directory exists
    const srcStat = await Deno.stat(srcPath);
    if (!srcStat.isDirectory) {
      console.log('✅ No src directory found, structure is already correct');
      return;
    }
    
    // Move files from dist/src/ to dist/
    for await (const entry of Deno.readDir(srcPath)) {
      const srcFile = `${srcPath}/${entry.name}`;
      const destFile = `${distPath}/${entry.name}`;
      
      await Deno.rename(srcFile, destFile);
      console.log(`  📄 Moved: ${srcFile} → ${destFile}`);
    }
    
    // Remove empty src directory
    await Deno.remove(srcPath);
    console.log(`  🗑️  Removed: ${srcPath}`);
    
    console.log('✅ Build structure fixed!');
    
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log('✅ No src directory found, structure is already correct');
    } else {
      console.error('❌ Failed to fix build structure:', error);
      throw error;
    }
  }
}

if (import.meta.main) {
  await fixBuildStructure();
}