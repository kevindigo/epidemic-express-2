#!/usr/bin/env -S deno run --allow-net --allow-read --allow-run

/**
 * Development server for Epidemic Express PWA
 * Targets Deno 2.3.x
 */

import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { join, extname } from "https://deno.land/std@0.200.0/path/mod.ts";

const PORT = 8000;
const HOST = "localhost";

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".ts": "application/typescript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};

// Default to index.html for root path
const DEFAULT_FILE = "index.html";

async function serveFile(filePath: string): Promise<Response> {
  try {
    const file = await Deno.readFile(filePath);
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    
    return new Response(file, {
      headers: { "content-type": contentType },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  let pathname = url.pathname;

  // Handle root path
  if (pathname === "/") {
    pathname = `/${DEFAULT_FILE}`;
  }

  // Remove leading slash
  const filePath = pathname.slice(1) || DEFAULT_FILE;
  
  // Security: prevent directory traversal
  if (filePath.includes("..")) {
    return new Response("Invalid path", { status: 400 });
  }

  // Try to serve the file
  const fullPath = join(Deno.cwd(), filePath);
  
  // Check if file exists
  try {
    const stat = await Deno.stat(fullPath);
    if (stat.isFile) {
      return await serveFile(fullPath);
    }
  } catch {
    // File doesn't exist, try with .html extension
    if (!extname(filePath)) {
      const htmlPath = `${fullPath}.html`;
      try {
        const stat = await Deno.stat(htmlPath);
        if (stat.isFile) {
          return await serveFile(htmlPath);
        }
      } catch {
        // Continue to 404
      }
    }
  }

  return new Response("File not found", { status: 404 });
}

async function startServer(): Promise<void> {
  console.log(`🚀 Epidemic Express development server running on http://${HOST}:${PORT}`);
  console.log(`📁 Serving files from: ${Deno.cwd()}`);
  console.log(`⚡ Deno version: ${Deno.version.deno}`);
  console.log(`📱 PWA ready for testing`);
  console.log(`---`);
  
  await serve(handleRequest, { port: PORT, hostname: HOST });
}

// Start TypeScript compilation watcher in development mode
async function startTypeScriptWatcher(): Promise<void> {
  console.log(`🔍 Starting TypeScript watcher...`);
  
  const watcher = Deno.watchFs(["src"]);
  
  for await (const event of watcher) {
    if (event.kind === "modify" || event.kind === "create") {
      console.log(`📝 File changed: ${event.paths.join(", ")}`);
      
      // Rebuild TypeScript if source files change
      if (event.paths.some(path => path.endsWith(".ts"))) {
        console.log(`🔄 Rebuilding TypeScript...`);
        
        try {
          const buildProcess = new Deno.Command(Deno.execPath(), {
            args: ["task", "build"],
            stdout: "piped",
            stderr: "piped",
          });
          
          const { code, stderr } = await buildProcess.output();
          
          if (code === 0) {
            console.log(`✅ TypeScript build successful`);
          } else {
            const errorText = new TextDecoder().decode(stderr);
            console.error(`❌ TypeScript build failed:\n${errorText}`);
          }
        } catch (error) {
          console.error(`❌ Build process error:`, error);
        }
      }
    }
  }
}

// Main execution
if (import.meta.main) {
  // Start TypeScript watcher in background
  startTypeScriptWatcher().catch(console.error);
  
  // Start the HTTP server
  startServer().catch((error) => {
    console.error(`❌ Server error:`, error);
    Deno.exit(1);
  });
}