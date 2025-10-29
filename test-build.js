// Simple test build to verify ESBuild configuration
import * as esbuild from 'https://deno.land/x/esbuild@v0.19.11/mod.js';

async function testBuild() {
  console.log('🧪 Testing ESBuild configuration...');
  
  try {
    // Clean first
    try {
      await Deno.remove('test-dist', { recursive: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
    
    const result = await esbuild.build({
      entryPoints: ['src/main.ts'],
      bundle: true,
      outdir: 'test-dist',
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      sourcemap: false,
      minify: false,
      loader: {
        '.ts': 'ts',
      },
      // Try without plugins first
      // plugins: [...denoPlugins()],
      outbase: '.',
      entryNames: '[name]',
    });
    
    console.log('✅ Test build completed!');
    
    // Check what was created
    const files = [];
    for await (const entry of Deno.readDir('test-dist')) {
      files.push(entry.name);
    }
    console.log('📁 Files in test-dist:', files);
    
  } catch (error) {
    console.error('❌ Test build failed:', error);
  } finally {
    esbuild.stop();
  }
}

if (import.meta.main) {
  await testBuild();
}