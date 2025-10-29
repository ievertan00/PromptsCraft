# PromptsCraft - Proposed Architecture

## Overview
This document outlines the proposed architecture for refactoring the PromptsCraft project into a scalable, maintainable structure with clear client-server separation and layered architecture.

## New Top-Level Structure

```
PromptsCraft/
├── client/                    # Frontend React/Vite application
│   ├── package.json          # Client-specific dependencies
│   ├── tsconfig.client.json  # Client TypeScript configuration
│   ├── vite.config.ts        # Client Vite configuration
│   ├── src/
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── types.ts
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── icons/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ThemeSelector.tsx
│   │   │   └── ... (other components)
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx
│   │   ├── services/          # Centralized API services
│   │   │   ├── folderApi.ts
│   │   │   ├── promptApi.ts
│   │   │   └── aiApi.ts
│   │   └── features/          # Feature-domain structure
│   │       ├── prompts/
│   │       │   ├── PromptList.tsx
│   │       │   ├── PromptEditor.tsx
│   │       │   └── ... (prompt-related components)
│   │       └── folders/
│   │           ├── Sidebar.tsx
│   │           ├── FolderTree.tsx
│   │           └── ... (folder-related components)
│   ├── public/
│   │   └── index.html
│   └── ... (other client files)
├── server/                    # Backend Express application
│   ├── package.json          # Server-specific dependencies
│   ├── tsconfig.server.json  # Server TypeScript configuration
│   ├── src/                  # Server source code
│   │   ├── server.ts         # Main server entry point
│   │   ├── .env
│   │   ├── controllers/      # Controller layer
│   │   │   ├── folderController.ts
│   │   │   ├── promptController.ts
│   │   │   └── aiController.ts
│   │   ├── services/         # Business logic layer
│   │   │   ├── folderService.ts
│   │   │   ├── promptService.ts
│   │   │   └── aiService.ts
│   │   ├── repositories/     # Data access layer
│   │   │   ├── folderRepository.ts
│   │   │   ├── promptRepository.ts
│   │   │   └── baseRepository.ts
│   │   └── models/           # Data models
│   │       ├── Folder.ts
│   │       └── Prompt.ts
│   ├── prompts.db            # Database file
│   └── ... (other server files)
└── package.json              # Root package.json (or separate for monorepo)
```

## Implementation Plan

### 1. Client-Server Separation
- Move all frontend files to `client/` directory
- Move all backend files to `server/` directory
- Update import paths to reflect new structure

### 2. Layered Backend Architecture
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic implementation
- **Repositories**: Data access operations
- **Models**: Data structure definitions

### 3. Feature-Domain Frontend Structure
- Group components by feature (prompts, folders)
- Create self-contained feature modules
- Maintain clear separation of concerns

### 4. Centralized API Services
- Separate API calls by domain
- Create dedicated service files for each domain
- Maintain type safety and consistency

## Benefits
- Clear separation of concerns
- Improved maintainability and scalability
- Better code organization
- Easier testing and debugging
- Standard layered architecture pattern