#!/usr/bin/env -S deno run --allow-net --allow-read

/**
 * Production server for Epidemic Express PWA
 * Targets Deno 2.3.x
 */

import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { join, extname } from "https://deno.land/std@0.200.0/path/mod.ts";

const PORT = 3000;
const HOST = "0.0.0.0"; // Listen on all interfaces for production
const BUILD_DIR = "dist";

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
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
      headers: { 
        "content-type": contentType,
        "cache-control": "public, max-age=3600" // Cache for 1 hour in production
      },
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

  // Try to serve the file from build directory
  const fullPath = join(Deno.cwd(), BUILD_DIR, filePath);
  
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

  // Fall back to index.html for SPA routing
  const indexPath = join(Deno.cwd(), BUILD_DIR, DEFAULT_FILE);
  try {
    const stat = await Deno.stat(indexPath);
    if (stat.isFile) {
      return await serveFile(indexPath);
    }
  } catch {
    // Index.html not found
  }

  return new Response("File not found", { status: 404 });
}

async function startServer(): Promise<void> {
  console.log(`🚀 Epidemic Express production server running on http://${HOST}:${PORT}`);
  console.log(`📁 Serving files from: ${join(Deno.cwd(), BUILD_DIR)}`);
  console.log(`⚡ Deno version: ${Deno.version.deno}`);
  console.log(`📱 PWA ready for production use`);
  console.log(`🔒 Cache headers enabled for better performance`);
  console.log(`---`);
  
  await serve(handleRequest, { port: PORT, hostname: HOST });
}

// Main execution
if (import.meta.main) {
  // Check if build directory exists
  try {
    await Deno.stat(BUILD_DIR);
  } catch {
    console.error(`❌ Build directory '${BUILD_DIR}' not found. Run 'deno task build' first.`);
    Deno.exit(1);
  }
  
  // Start the HTTP server
  startServer().catch((error) => {
    console.error(`❌ Server error:`, error);
    Deno.exit(1);
  });
}