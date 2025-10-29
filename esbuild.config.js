import * as esbuild from 'https://deno.land/x/esbuild@v0.19.11/mod.js';
import { denoPlugins } from 'https://deno.land/x/esbuild_deno_loader@0.8.2/mod.ts';

/**
 * ESBuild configuration for Epidemic Express PWA
 * Properly transpiles TypeScript to JavaScript for browser compatibility
 */

// Build function
export async function build() {
  console.log('🏗️  Building Epidemic Express with ESBuild...');
  
  try {
    const result = await esbuild.build({
      entryPoints: [
        'src/main.ts',
        'service-worker.ts'
      ],
      bundle: true, // Bundle all dependencies into single files
      outdir: 'dist',
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      sourcemap: true,
      minify: false, // Keep readable for debugging
      
      // TypeScript configuration
      loader: {
        '.ts': 'ts',
        '.js': 'js',
      },
      
      // Plugins for Deno compatibility
      plugins: [...denoPlugins()],
      
      // Explicitly avoid preserving directory structure
      outbase: '.',
      entryNames: '[name]',
    });
    
    console.log('✅ Build completed successfully!');
    return result;
  } catch (error) {
    console.error('❌ Build failed:', error);
    throw error;
  } finally {
    // Always stop the ESBuild service to prevent hanging
    // ESBuild starts a service that needs to be explicitly stopped
    // when used as a module to allow the process to exit properly
    esbuild.stop();
  }
}

// Development build with watch mode
export async function watch() {
  console.log('👀 Starting development build with watch mode...');
  
  const ctx = await esbuild.context({
    entryPoints: [
      'src/main.ts',
      'service-worker.ts'
    ],
    bundle: true,
    outdir: 'dist',
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    sourcemap: 'inline',
    minify: false,
    loader: {
      '.ts': 'ts',
      '.js': 'js',
    },
    plugins: [...denoPlugins()],
    outbase: '.',
    entryNames: '[name]',
  });
  
  await ctx.watch();
  console.log('Watching for changes...');
  
  // Note: watch mode intentionally doesn't stop the service
  // as it needs to keep running to watch for changes
  return ctx;
}

// Production build
export async function buildProduction() {
  console.log('🚀 Building for production...');
  
  try {
    const result = await esbuild.build({
      entryPoints: [
        'src/main.ts',
        'service-worker.ts'
      ],
      bundle: true,
      outdir: 'dist',
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      sourcemap: false,
      minify: true,
      loader: {
        '.ts': 'ts',
        '.js': 'js',
      },
      plugins: [...denoPlugins()],
      outbase: '.',
      entryNames: '[name]',
    });
    
    console.log('✅ Production build completed!');
    return result;
  } finally {
    // Always stop the ESBuild service to prevent hanging
    esbuild.stop();
  }
}

// Clean build
export async function clean() {
  try {
    await Deno.remove('dist', { recursive: true });
    console.log('🧹 Cleaned dist directory');
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

// If this script is run directly
if (import.meta.main) {
  const command = Deno.args[0];
  
  switch (command) {
    case 'build':
      await build();
      break;
    case 'watch':
      await watch();
      break;
    case 'production':
      await buildProduction();
      break;
    case 'clean':
      await clean();
      break;
    default:
      console.log('Available commands:');
      console.log('  deno run -A esbuild.config.js build     - Build once');
      console.log('  deno run -A esbuild.config.js watch     - Build and watch');
      console.log('  deno run -A esbuild.config.js production - Production build');
      console.log('  deno run -A esbuild.config.js clean     - Clean dist');
      break;
  }
  
  esbuild.stop();
}