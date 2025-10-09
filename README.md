# Epidemic Express - Modern PWA

A modern, client-side only Progressive Web App (PWA) implementation of the Epidemic Express dice game, built with Deno and TypeScript.

## Features

- 🎲 **Complete Game Logic**: All original game mechanics preserved
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔄 **PWA Capabilities**: Installable and works offline
- 🎨 **Modern UI**: Clean, intuitive interface
- ⚡ **Fast Performance**: Vanilla TypeScript, no frameworks
- 💾 **Local Storage**: Game state persists between sessions

## Game Overview

Epidemic Express is a cooperative dice game where you battle 5 deadly diseases while managing global panic levels. Each turn you:

1. **Get a random role** with special abilities
2. **Roll infection dice** to see which diseases spread
3. **Roll treatment dice** to cure diseases and reduce panic

**Win Condition**: Cure all 5 diseases
**Lose Condition**: Any disease or panic level reaches 6

## Development

### Prerequisites
- [Deno](https://deno.land/) 1.30.0 or later

### Setup
1. Clone this repository
2. Copy the original game images from the Epidemic Express directory to `assets/images/`
3. Run the development server:

```bash
denon task dev
```

Or manually:
```bash
deno run --allow-net --allow-read scripts/dev.ts
```

### Available Tasks

- `deno task dev` - Start development server
- `deno task build` - Build for production
- `deno task serve` - Serve built files
- `deno task typecheck` - Type check the code

### Building for Production

```bash
deno task build
```

This creates a `dist/` directory with all files ready for deployment to any static hosting service.

## Deployment

The built files in `dist/` can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static file host

## Technology Stack

- **Runtime**: Deno
- **Language**: TypeScript
- **Frontend**: Vanilla DOM APIs
- **Styling**: Plain CSS
- **PWA**: Service Worker + Web App Manifest
- **Build Tool**: ESBuild (proper TypeScript transpilation)

## Build Improvements

The build process has been updated to use ESBuild for proper TypeScript transpilation, fixing the loading page issue where the game would never start. ESBuild provides:

- **Proper TypeScript compilation** - Handles all TypeScript syntax correctly
- **Fast builds** - Much faster than the previous regex-based approach
- **Browser compatibility** - Targets modern browsers with ES2020
- **Source maps** - For easier debugging

### Available Build Commands

- `deno task build` - Full build with type checking and asset copying
- `deno task build-esbuild` - ESBuild only transpilation
- `deno task build-watch` - Development build with file watching
- `deno task build-production` - Production build with minification
- `deno task test-build` - Test the build process

## Project Structure

```
epidemic-express-pwa/
├── src/
│   ├── game/          # Core game logic
│   ├── ui/            # UI components
│   └── main.ts        # Application entry point
├── assets/images/     # Game assets
├── scripts/           # Build and dev scripts
├── styles.css         # All styling
├── index.html         # Main HTML file
├── manifest.json      # PWA manifest
└── service-worker.ts  # Service worker
```

## Game Rules

For detailed game rules, click the "Rules" button in the game interface or refer to the original `rules.html` file.

## License

This project is based on the original Epidemic Express game by Kevin B. Smith, Copyright 2010.