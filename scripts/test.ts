#!/usr/bin/env -S deno run --allow-read --allow-run

/**
 * Test runner for Epidemic Express PWA
 * Targets Deno 2.3.x
 */

async function runTests(): Promise<void> {
  console.log(`🧪 Running tests for Epidemic Express...`);
  console.log(`⚡ Deno version: ${Deno.version.deno}`);
  console.log(`---`);
  
  try {
    // Run Deno's built-in test runner
    const testProcess = new Deno.Command(Deno.execPath(), {
      args: ["test", "--allow-none", "--no-check"],
      stdout: "inherit",
      stderr: "inherit",
    });
    
    const { code } = await testProcess.output();
    
    if (code === 0) {
      console.log(`---`);
      console.log(`✅ All tests passed!`);
    } else {
      console.log(`---`);
      console.log(`❌ Tests failed with exit code: ${code}`);
      Deno.exit(code);
    }
    
  } catch (error) {
    console.error(`❌ Test execution failed:`, error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await runTests();
}