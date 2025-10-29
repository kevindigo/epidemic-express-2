#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-net --allow-import

/**
 * Build script for Epidemic Express PWA
 * Uses ESBuild for proper TypeScript compilation
 */

import { join, dirname } from "https://deno.land/std@0.200.0/path/mod.ts";

// Configuration
const BUILD_DIR = "dist";

async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(dirname(dest));
  await Deno.copyFile(src, dest);
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  await ensureDir(dest);
  
  for await (const entry of Deno.readDir(src)) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    
    if (entry.isDirectory) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function copyStaticAssets(): Promise<void> {
  console.log(`📁 Copying static assets...`);
  
  const assetsToCopy = [
    { src: "index.html", dest: "dist/index.html" },
    { src: "404.html", dest: "dist/404.html" },
    { src: "styles.css", dest: "dist/styles.css" },
    { src: "manifest.json", dest: "dist/manifest.json" },
    { src: "assets", dest: "dist/assets" },
  ];
  
  for (const asset of assetsToCopy) {
    try {
      const stat = await Deno.stat(asset.src);
      
      if (stat.isDirectory) {
        await copyDirectory(asset.src, asset.dest);
        console.log(`  📂 ${asset.src} → ${asset.dest}`);
      } else {
        await copyFile(asset.src, asset.dest);
        console.log(`  📄 ${asset.src} → ${asset.dest}`);
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.warn(`  ⚠️  ${asset.src} not found, skipping`);
      } else {
        throw error;
      }
    }
  }
  
  console.log(`✅ Static assets copied`);
}

function copyUIDirectory(): void {
  console.log(`📁 Copying UI directory structure...`);
  
  try {
    // Note: With bundling enabled, we don't need to copy individual UI files
    // as they will be bundled into the main.js file
    console.log(`  📂 UI files will be bundled into main.js`);
    
    console.log(`✅ UI directory structure handled`);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.warn(`  ⚠️  UI directory not found, skipping`);
    } else {
      throw error;
    }
  }
}

async function updateHTMLForProduction(): Promise<void> {
  console.log(`🔧 Updating HTML for production...`);
  
  const htmlPath = "dist/index.html";
  let content = await Deno.readTextFile(htmlPath);
  
  // Update script to use the bundled main.js (not src/main.js)
  content = content.replace(
    '<script type="module" src="./src/main.js"></script>',
    '<script type="module" src="./main.js"></script>'
  );
  
  await Deno.writeTextFile(htmlPath, content);
  console.log(`✅ HTML updated for production`);
}

async function runTypeCheck(): Promise<void> {
  console.log(`🔍 Running TypeScript type checking...`);
  
  const checkProcess = new Deno.Command(Deno.execPath(), {
    args: ["check", "src/"],
    stdout: "piped",
    stderr: "piped",
  });
  
  const { code, stderr } = await checkProcess.output();
  
  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`TypeScript type checking failed:\n${errorText}`);
  }
  
  console.log(`✅ TypeScript type checking passed`);
}

async function generateBuildInfo(): Promise<void> {
  console.log(`📝 Generating build information...`);
  
  const buildInfo = {
    timestamp: new Date().toISOString(),
    denoVersion: Deno.version.deno,
    buildType: "production",
    version: "1.0.0",
    buildTool: "esbuild",
  };
  
  const buildInfoPath = join(BUILD_DIR, "build-info.json");
  await Deno.writeTextFile(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  console.log(`✅ Build information generated`);
}

async function cleanBuildDirectory(): Promise<void> {
  console.log(`🧹 Cleaning build directory...`);
  
  try {
    await Deno.remove(BUILD_DIR, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  
  await ensureDir(BUILD_DIR);
  console.log(`✅ Build directory cleaned`);
}

async function runESBuild(): Promise<void> {
  console.log(`🔨 Running ESBuild TypeScript transpilation...`);
  
  // Import and run the ESBuild configuration
  const { build } = await import("../esbuild.config.js");
  await build();
}

async function main(): Promise<void> {
  console.log(`🏗️  Building Epidemic Express PWA...`);
  console.log(`⚡ Deno version: ${Deno.version.deno}`);
  console.log(`🔧 Using ESBuild for TypeScript transpilation`);
  console.log(`---`);
  
  try {
    // Clean and prepare build directory
    await cleanBuildDirectory();
    
    // Run type checking
    await runTypeCheck();
    
    // Transpile TypeScript files using ESBuild
    await runESBuild();
    
    // Copy static assets
    await copyStaticAssets();
    
    // Copy UI directory structure
    await copyUIDirectory();
    
    // Update HTML for production
    await updateHTMLForProduction();
    
    // Generate build info
    await generateBuildInfo();
    
    console.log(`---`);
    console.log(`✅ Build completed successfully!`);
    console.log(`📁 Output directory: ${BUILD_DIR}`);
    console.log(`🚀 To serve the built app: deno task serve`);
    
  } catch (error) {
    console.error(`❌ Build failed:`, error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}