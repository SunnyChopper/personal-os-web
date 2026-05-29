# Product Requirements Document: Markdown Viewer for Personal OS

**Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Ready for Implementation

---

## 1. Context & Vision

### Problem Statement

Users need a dedicated, standalone Markdown file storage and browser within Personal OS that allows them to create, organize, view, edit, and search markdown documents independently from the Knowledge Vault system, while maintaining seamless integration with Personal OS navigation patterns.

### Solution Summary

A full-featured Markdown viewer with hierarchical file navigation, inline editing, file management (create/upload/edit), and multi-modal search (traditional + embeddings). The viewer provides a native file browser experience with tree-based organization, tag/category views, and URL-based deep linking for quick access to specific files.

### Analogy

It's like a **VS Code file explorer + markdown preview** embedded directly in Personal OS—users can browse their markdown library like a code editor, but with the polish and integration of a productivity app.

---

## 2. Product Requirements (The "What")

### User Persona

**Primary User:** Power users of Personal OS who need to:

- Store and organize technical documentation, notes, and markdown files
- Quickly reference files via URL bookmarks
- Edit markdown files inline with live preview
- Search across file content using both text and semantic search

### The Core Loop

1. **Browse**: User opens Markdown Viewer → sees file tree in sidebar → clicks file → content renders in main pane
2. **Navigate**: User can switch files via sidebar click, URL navigation, or Command Palette (Cmd+K)
3. **Edit**: User clicks "Edit" button → markdown editor appears → makes changes → saves → preview updates
4. **Create**: User clicks "New File" → modal prompts for name/path → creates file → opens in editor
5. **Upload**: User drags/drops or selects files → files uploaded → appear in file tree
6. **Search**: User types in search bar or uses Cmd+K → results show matching files → click to open

### Key Features (MoSCoW)

#### Must Have (MVP)

- ✅ **Hierarchical File Tree**: Folder/file structure with expand/collapse
- ✅ **Markdown Rendering**: High-fidelity GFM rendering with code blocks, tables, math
- ✅ **File Selection**: Click file → renders in main pane, URL updates to `/markdown-viewer/:filePath`
- ✅ **Empty State**: "Select a file" prompt when no file active
- ✅ **File Metadata**: Display file size, last modified date in sidebar
- ✅ **Create New File**: Modal/form to create new `.md` file with path
- ✅ **Upload Files**: Drag-and-drop or file picker to upload markdown files
- ✅ **Edit Mode**: Toggle between view/edit modes with save functionality
- ✅ **Auto-save**: Debounced cloud autosave in Edit mode (1.5 s idle, 30 s safety net); manual Save remains as fallback
- ✅ **Search**: Text search across file names and content
- ✅ **Responsive Layout**: Sidebar hidden on mobile (< 768px), becomes bottom sheet/drawer

#### Should Have (V1)

- ✅ **Tag/Category View**: Alternative view mode organized by tags/categories
- ✅ **Command Palette Integration**: Cmd+K search includes markdown files
- ✅ **Code Block Enhancements**: Copy button, line numbers, language badge
- ✅ **Folder Operations**: Create folders, move files between folders
- ✅ **File Operations**: Rename, delete files
- ✅ **Embedding Search**: Semantic search using embeddings (backend integration)
- ✅ **Recent Files**: Quick access to recently viewed files
- ✅ **Breadcrumb Navigation**: Show current file path in header

#### Won't Have (V1 Exclusions)

- ❌ Export/Print functionality
- ❌ File versioning/history
- ❌ Collaborative editing
- ❌ Real-time sync / collaborative editing (cloud **autosave** in Edit mode is in scope — see Auto-save below)
- ❌ Image upload/embedding in markdown
- ❌ Markdown linting/validation

---

## 3. Technical Architecture (The "How")

### Tech Stack

**Frontend:**

- **React + TypeScript**: Component framework
- **React Router**: URL-based routing with path params
- **Tailwind CSS**: Styling (dark mode support)
- **react-markdown + remark-gfm**: Markdown rendering (extend existing `MarkdownRenderer`)
- **Prism.js**: Syntax highlighting (already integrated)
- **KaTeX**: Math rendering (already integrated)

**State Management:**

- **React Query**: File list fetching, caching, mutations
- **URL Params**: Active file state (`/markdown-viewer/:filePath`)
- **React Context**: Optional for shared file tree state if needed

**Backend Integration:**

- **REST API**: File CRUD operations (contract defined below)
- **Search API**: Text search + embedding search endpoints

### Data Model

```typescript
// File metadata structure
interface MarkdownFile {
  id: string;
  path: string; // e.g., "docs/guides/getting-started.md"
  name: string; // e.g., "getting-started.md"
  content: string; // Markdown content
  size: number; // bytes
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  tags?: string[];
  category?: string;
  folderPath?: string; // e.g., "docs/guides"
}

// Folder structure
interface FileTreeNode {
  type: 'file' | 'folder';
  name: string;
  path: string;
  children?: FileTreeNode[]; // For folders
  metadata?: MarkdownFile; // For files
}
```

### API Contract

#### Base URL

All endpoints prefixed with `/api/markdown-files`

#### Endpoints

**GET `/api/markdown-files`**

- List all files with metadata
- Query params: `?folder=path/to/folder` (optional)
- Response: `{ files: MarkdownFile[] }`

**GET `/api/markdown-files/tree`**

- Get hierarchical file tree structure
- Response: `{ tree: FileTreeNode[] }`

**GET `/api/markdown-files/:filePath`**

- Get single file content
- `filePath` is URL-encoded path (e.g., `docs%2Fguides%2Fgetting-started.md`)
- Response: `{ file: MarkdownFile }`

**POST `/api/markdown-files`**

- Create new file
- Body: `{ path: string, content?: string }`
- Response: `{ file: MarkdownFile }`

**PUT `/api/markdown-files/:filePath`**

- Update file content
- Body: `{ content: string }`
- Response: `{ file: MarkdownFile }`

**DELETE `/api/markdown-files/:filePath`**

- Delete file
- Response: `{ success: boolean }`

**POST `/api/markdown-files/upload`**

- Upload file(s)
- Content-Type: `multipart/form-data`
- Body: `files: File[]`
- Response: `{ files: MarkdownFile[] }`

**GET `/api/markdown-files/search?q=query&type=text|embedding`**

- Search files
- Query params: `q` (search term), `type` (text or embedding)
- Response: `{ results: { file: MarkdownFile, matchScore?: number }[] }`

**GET `/api/markdown-files/tags`**

- Get all tags
- Response: `{ tags: string[] }`

**GET `/api/markdown-files/categories`**

- Get all categories
- Response: `{ categories: string[] }`

### Component Architecture

```
src/
├── pages/
│   └── admin/
│       └── MarkdownViewerPage.tsx          # Main page component
├── components/
│   ├── organisms/
│   │   ├── MarkdownFileTree.tsx            # Sidebar file tree
│   │   ├── MarkdownViewer.tsx              # Main viewer/editor container
│   │   └── MarkdownFileSearch.tsx          # Search component
│   ├── molecules/
│   │   ├── MarkdownFileItem.tsx            # File item in tree
│   │   ├── MarkdownFolderItem.tsx          # Folder item in tree
│   │   ├── MarkdownEditor.tsx              # Extended editor (reuse existing)
│   │   ├── MarkdownViewerContent.tsx       # Extended renderer (reuse existing)
│   │   ├── FileUploadZone.tsx               # Drag-and-drop upload
│   │   └── CreateFileModal.tsx             # New file creation modal
│   └── atoms/
│       └── CodeBlockToolbar.tsx             # Copy/line numbers for code blocks
├── services/
│   └── markdown-files.service.ts            # API client for file operations
└── hooks/
    ├── useMarkdownFiles.ts                  # React Query hook for file list
    ├── useMarkdownFile.ts                   # React Query hook for single file
    └── useFileTree.ts                       # Hook for tree structure manipulation
```

### State Management Flow

1. **URL → Active File**
   - Route: `/admin/markdown-viewer/:filePath?`
   - `useParams()` extracts `filePath`
   - `useMarkdownFile(filePath)` fetches file content
   - Sidebar highlights active file

2. **Click File → URL Update**
   - User clicks file in tree
   - `navigate(`/admin/markdown-viewer/${encodeURIComponent(file.path)}`)`
   - URL updates, component re-renders with new file

3. **Command Palette Integration**
   - Extend `CommandPalette.tsx` to include markdown files
   - Search files by name/path
   - On selection, navigate to file URL

4. **Edit Mode State**
   - Local state: `const [isEditing, setIsEditing] = useState(false)`
   - Toggle button switches between `MarkdownViewerContent` and `MarkdownEditor`
   - Save button triggers `useMutation` to update file

### Responsive Design

**Desktop (≥ 768px):**

- Sidebar: Fixed left, resizable (similar to `AdminLayout` pattern)
- Main pane: Remaining width, scrollable
- Layout: `flex-row`

**Mobile (< 768px):**

- Sidebar: Hidden by default, bottom sheet/drawer on toggle
- Main pane: Full width
- Toggle button: Floating action button or header button
- Drawer: Slides up from bottom, overlay backdrop

### File Tree Virtualization

Since file count is "unknown/unlimited", implement virtualization:

- Use `react-window` or `@tanstack/react-virtual` for file list
- Only render visible items in tree
- Lazy load folder contents on expand

### Search Implementation

**Text Search:**

- Debounced input (300ms)
- Query backend `/api/markdown-files/search?q=query&type=text`
- Display results in dropdown or dedicated results view

**Embedding Search:**

- Same endpoint with `type=embedding`
- Backend handles vector similarity
- Results sorted by `matchScore`

**Command Palette Integration:**

- Extend `CommandPalette` component
- Add markdown file results to command list
- Filter by file name/path matching query

### Code Block Enhancements

Extend `MarkdownRenderer` component:

```typescript
// Add to code block component
<pre className="relative group">
  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
    <button onClick={handleCopy}>Copy</button>
    <span className="language-badge">{language}</span>
  </div>
  {showLineNumbers && <LineNumbers />}
  <code>{children}</code>
</pre>
```

### File Upload Flow

1. **Drag-and-Drop Zone**
   - Component: `FileUploadZone` (molecule)
   - Accepts: `.md`, `.markdown` files
   - Visual feedback on drag-over
   - Multiple file support

2. **Upload Process**
   - `FormData` with files
   - POST to `/api/markdown-files/upload`
   - On success: refresh file tree, show toast notification
   - Handle errors: display error message

### Edit Mode Flow

1. **Toggle Edit**
   - Button in header: "Edit" / "View"
   - State: `isEditing`
   - Switch component: `MarkdownEditor` vs `MarkdownViewerContent`

2. **Save**
   - Debounced auto-save (optional) OR manual save button
   - PUT to `/api/markdown-files/:filePath`
   - Optimistic update with React Query
   - Show save indicator (saving/saved/error)

3. **Cancel**
   - Discard changes, revert to last saved content
   - Exit edit mode

---

## 4. Implementation Phases

### Phase 1: Core Viewer (MVP)

1. Create `MarkdownViewerPage` route and component
2. Implement `MarkdownFileTree` sidebar with file list
3. Integrate extended `MarkdownRenderer` for viewing
4. URL-based file selection (`/markdown-viewer/:filePath`)
5. Empty state when no file selected
6. Basic file metadata display

### Phase 2: File Operations

1. Create file modal and API integration
2. File upload (drag-and-drop + file picker)
3. Edit mode toggle with `MarkdownEditor`
4. Save functionality
5. Delete file (with confirmation)

### Phase 3: Enhanced Navigation

1. Command Palette integration
2. Search bar in sidebar
3. Recent files quick access
4. Breadcrumb navigation

### Phase 4: Advanced Features

1. Tag/category view mode
2. Folder operations (create, move)
3. Code block enhancements (copy, line numbers)
4. Embedding search integration

---

## 5. Success Metrics

- ✅ User can browse files in hierarchical tree
- ✅ User can view markdown with full GFM support
- ✅ User can create, upload, edit, and save files
- ✅ User can navigate via URL, click, or Command Palette
- ✅ Layout adapts responsively (mobile drawer, desktop sidebar)
- ✅ Search returns relevant results (text + embeddings)
- ✅ Code blocks have copy button and line numbers

---

## 6. Open Questions / Decisions Needed

1. **Auto-save vs Manual Save**: Should edits auto-save on blur, or require explicit save button?
2. **File Naming**: Should file names be editable inline in tree, or via modal?
3. **Folder Creation**: Should folders be created via modal, or inline in tree?
4. **Search UI**: Dropdown in sidebar, or dedicated search results page?
5. **Embedding Search**: Real-time as user types, or separate "Semantic Search" button?

---

## 7. Dependencies

### New Packages (if needed)

- `react-window` or `@tanstack/react-virtual` (for file tree virtualization)
- `react-dropzone` (optional, for enhanced drag-and-drop)

### Existing Packages (reuse)

- `react-markdown` (already installed)
- `remark-gfm` (already installed)
- `prismjs` (already installed)
- `katex` (already installed)

---

## 8. Routes

Add to `src/routes.ts`:

```typescript
markdownViewer: `${ADMIN_BASE}/markdown-viewer` as const,
markdownViewerFile: `${ADMIN_BASE}/markdown-viewer/:filePath` as const,
```

Route definition in `src/App.tsx`:

```typescript
<Route path={ROUTES.admin.markdownViewer} element={<MarkdownViewerPage />} />
<Route path={ROUTES.admin.markdownViewerFile} element={<MarkdownViewerPage />} />
```

---

## 9. Design Tokens

Follow existing Personal OS design system:

- **Sidebar width**: 256px default (resizable, min 200px, max 480px)
- **Colors**: Use existing accent colors, gray scale
- **Typography**: Serif for headings (matches `MarkdownRenderer`), sans-serif for UI
- **Spacing**: 8px grid system
- **Border radius**: `rounded-lg` (8px) for cards, `rounded` (4px) for inputs

---

## 10. Accessibility

- **Keyboard Navigation**: Tab through file tree, Enter to select file
- **ARIA Labels**: All interactive elements labeled
- **Focus Management**: Focus moves to main pane when file selected
- **Screen Reader**: Announce file selection, edit mode changes
- **Color Contrast**: All text meets WCAG AA standards

---

**End of PRD**
