#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Cleanup script for Epidemic Express PWA
 * Targets Deno 2.3.x
 */

async function cleanDirectory(path: string): Promise<void> {
  try {
    await Deno.remove(path, { recursive: true });
    console.log(`🗑️  Removed: ${path}`);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log(`ℹ️  Not found: ${path}`);
    } else {
      throw error;
    }
  }
}

async function cleanBuildArtifacts(): Promise<void> {
  console.log(`🧹 Cleaning build artifacts...`);
  
  const pathsToClean = [
    "dist",
    "deno.lock",
    ".deno",
  ];
  
  for (const path of pathsToClean) {
    await cleanDirectory(path);
  }
  
  console.log(`✅ Build artifacts cleaned`);
}

async function cleanCache(): Promise<void> {
  console.log(`🧹 Cleaning Deno cache...`);
  
  try {
    const cacheProcess = new Deno.Command(Deno.execPath(), {
      args: ["cache", "--reload"],
      stdout: "piped",
      stderr: "piped",
    });
    
    const { code } = await cacheProcess.output();
    
    if (code === 0) {
      console.log(`✅ Deno cache cleaned`);
    } else {
      console.log(`⚠️  Deno cache cleanup had issues`);
    }
  } catch (error) {
    console.error(`❌ Cache cleanup failed:`, error);
  }
}

async function main(): Promise<void> {
  console.log(`🧹 Cleaning Epidemic Express project...`);
  console.log(`⚡ Deno version: ${Deno.version.deno}`);
  console.log(`---`);
  
  try {
    // Clean build artifacts
    await cleanBuildArtifacts();
    
    // Clean cache
    await cleanCache();
    
    console.log(`---`);
    console.log(`✅ Project cleaning completed!`);
    
  } catch (error) {
    console.error(`❌ Cleaning failed:`, error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}