#!/usr/bin/env -S deno run --allow-read --allow-run

/**
 * Linting script for Epidemic Express PWA
 * Targets Deno 2.3.x
 */

async function runLint(): Promise<void> {
  console.log(`🔍 Running linting for Epidemic Express...`);
  console.log(`⚡ Deno version: ${Deno.version.deno}`);
  console.log(`---`);
  
  try {
    // Run Deno's built-in linter
    const lintProcess = new Deno.Command(Deno.execPath(), {
      args: ["lint"],
      stdout: "inherit",
      stderr: "inherit",
    });
    
    const { code } = await lintProcess.output();
    
    if (code === 0) {
      console.log(`---`);
      console.log(`✅ Linting passed!`);
    } else {
      console.log(`---`);
      console.log(`❌ Linting failed with exit code: ${code}`);
      Deno.exit(code);
    }
    
  } catch (error) {
    console.error(`❌ Linting execution failed:`, error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await runLint();
}