#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Code formatting script for Epidemic Express PWA
 * Targets Deno 2.3.x
 */

async function runFormat(): Promise<void> {
  console.log(`🎨 Formatting code for Epidemic Express...`);
  console.log(`⚡ Deno version: ${Deno.version.deno}`);
  console.log(`---`);
  
  try {
    // Run Deno's built-in formatter
    const formatProcess = new Deno.Command(Deno.execPath(), {
      args: ["fmt"],
      stdout: "inherit",
      stderr: "inherit",
    });
    
    const { code } = await formatProcess.output();
    
    if (code === 0) {
      console.log(`---`);
      console.log(`✅ Code formatting completed!`);
    } else {
      console.log(`---`);
      console.log(`❌ Formatting failed with exit code: ${code}`);
      Deno.exit(code);
    }
    
  } catch (error) {
    console.error(`❌ Formatting execution failed:`, error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await runFormat();
}