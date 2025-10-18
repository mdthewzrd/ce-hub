# Traderra Journaling System - Architecture Diagrams

## 1. System Architecture Layers

```
┌───────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                         │
│   (Browser - Chrome, Firefox, Safari, Edge)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER (Next.js)                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Pages                                                   │  │
│  │ - /journal (Classic mode)                             │  │
│  │ - /journal-enhanced (Enhanced mode)                   │  │
│  │ - /journal-enhanced-v2 (Latest)                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Components                                              │  │
│  │ - JournalLayout (Main orchestrator)                   │  │
│  │ - FolderTree (Navigation)                             │  │
│  │ - JournalEntryCard (Display)                          │  │
│  │ - NewEntryModal (Creation)                            │  │
│  │ - RichTextEditor (Content)                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ State Management                                        │  │
│  │ - useFolders (React Hook)                             │  │
│  │ - React Query (Caching)                               │  │
│  │ - Toast Notifications                                 │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                        HTTP/REST API
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER (FastAPI)                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ API Routes (/api/folders)                              │  │
│  │ - Folder CRUD (8 endpoints)                            │  │
│  │ - Content CRUD (9 endpoints)                           │  │
│  │ - Bulk Operations                                      │  │
│  │ - Statistics & Filtering                               │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Business Logic                                          │  │
│  │ - Validation (Pydantic)                                │  │
│  │ - Access Control                                       │  │
│  │ - Error Handling                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Data Access (asyncpg)                                  │  │
│  │ - Connection pooling                                   │  │
│  │ - Query execution                                      │  │
│  │ - Transaction management                               │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER (PostgreSQL)                  │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ folders table    │  │ content_items    │                  │
│  │ - id (UUID)      │  │ - id (UUID)      │                  │
│  │ - parent_id      │  │ - folder_id      │                  │
│  │ - name           │  │ - type           │                  │
│  │ - icon           │  │ - title          │                  │
│  │ - color          │  │ - content (JSONB)│                  │
│  │ - position       │  │ - metadata       │                  │
│  │ - user_id        │  │ - tags (array)   │                  │
│  │ - timestamps     │  │ - user_id        │                  │
│  └──────────────────┘  │ - timestamps     │                  │
│                        └──────────────────┘                   │
│  ┌────────────────────────────────────────┐                  │
│  │ Views & Indexes                        │                  │
│  │ - folder_tree_view (recursive)         │                  │
│  │ - content_with_folder_view             │                  │
│  │ - 8 strategic indexes                  │                  │
│  │ - Triggers for updated_at              │                  │
│  └────────────────────────────────────────┘                  │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Component Architecture

```
JournalPage (/journal/page.tsx)
│
├── Mode Toggle (Classic/Enhanced)
│
├── JournalLayout (Main Container)
│   │
│   ├── Sidebar Component
│   │   ├── FolderTree
│   │   │   ├── Folder Node (recursive)
│   │   │   ├── Icons (Lucide React)
│   │   │   ├── Color Coding
│   │   │   └── Content Count Display
│   │   │
│   │   ├── New Folder Button
│   │   ├── Collapse/Expand Toggle
│   │   └── Settings Icon
│   │
│   └── MainContent Component
│       │
│       ├── Header
│       │   ├── Breadcrumb / Folder Title
│       │   ├── View Mode Toggle (Grid/List)
│       │   ├── Filter Button
│       │   ├── New Entry Button
│       │   └── More Options Menu
│       │
│       ├── JournalFilters (Conditional)
│       │   ├── Search Input
│       │   ├── Category Filter (Win/Loss)
│       │   ├── Emotion Filter
│       │   ├── Symbol Filter
│       │   └── Rating Filter
│       │
│       └── Content Area
│           ├── JournalStats (Grid)
│           │   ├── 7d Stats Card
│           │   ├── 30d Stats Card
│           │   ├── 90d Stats Card
│           │   ├── 7d P&L Card
│           │   ├── 30d P&L Card
│           │   ├── 90d Win Rate Card
│           │   └── Avg R-Ratio Card
│           │
│           └── JournalEntryList
│               └── JournalEntryCard (repeating)
│                   ├── Title & Stars
│                   ├── Date & Strategy
│                   ├── P&L & Side Badge
│                   ├── Tags
│                   ├── Trade Details Grid
│                   ├── Content Preview
│                   ├── Read More/Less Button
│                   └── Edit/Delete Buttons

NewEntryModal (Portal)
│
├── Template Selection (7 templates)
│   ├── Trading Analysis
│   ├── Quick Trade Log
│   ├── Weekly Review
│   ├── Strategy Analysis
│   ├── Market Research
│   ├── Risk Management
│   └── Freeform Document
│
└── Entry Editor
    ├── Title Input
    ├── Template-specific Fields
    ├── RichTextEditor
    │   ├── Toolbar
    │   │   ├── H1, H2, H3 Buttons
    │   │   ├── Bold, Italic Buttons
    │   │   ├── Bullet List, Ordered List
    │   │   └── Divider
    │   └── Editor Content Area
    ├── Tags Input
    ├── Rating Select
    ├── Emotion Select
    ├── Category Select (Win/Loss)
    └── Save/Cancel Buttons
```

---

## 3. Database Schema Relationship

```
┌─────────────────────────────────────┐
│          folders                    │
├─────────────────────────────────────┤
│ id (UUID) PRIMARY KEY               │
│ name VARCHAR(255)                   │
│ parent_id UUID → folders.id (self)  │
│ user_id VARCHAR(255)                │
│ icon VARCHAR(50)                    │
│ color VARCHAR(7)                    │
│ position INTEGER                    │
│ created_at TIMESTAMP                │
│ updated_at TIMESTAMP                │
│                                     │
│ Indexes:                            │
│ - idx_folders_parent_id             │
│ - idx_folders_user_id               │
│ - idx_folders_position              │
│                                     │
│ Triggers:                           │
│ - update_folders_updated_at         │
└────────────┬────────────────────────┘
             │
             │ parent_id (self-referential)
             │ Hierarchical structure
             │
             ↓
         ┌───────────────────────────────────────────┐
         │ folder_tree_view (Recursive CTE)          │
         ├───────────────────────────────────────────┤
         │ Flattened tree with:                      │
         │ - id, name, parent_id                     │
         │ - depth level                             │
         │ - sort_path for ordering                  │
         │ - full_path for breadcrumbs               │
         │ - content_count from JOIN                 │
         └───────────────────────────────────────────┘

┌─────────────────────────────────────┐
│       content_items                 │
├─────────────────────────────────────┤
│ id (UUID) PRIMARY KEY               │
│ folder_id UUID → folders.id         │
│ type VARCHAR(50)                    │
│   (trade_entry, document,           │
│    note, strategy, research, review)│
│ title VARCHAR(255)                  │
│ content JSONB                       │
│ metadata JSONB                      │
│ tags TEXT[] (array)                 │
│ user_id VARCHAR(255)                │
│ created_at TIMESTAMP                │
│ updated_at TIMESTAMP                │
│                                     │
│ Indexes:                            │
│ - idx_content_items_folder_id       │
│ - idx_content_items_type            │
│ - idx_content_items_user_id         │
│ - idx_content_items_tags (GIN)      │
│ - idx_content_items_metadata (GIN)  │
│ - idx_content_items_created_at      │
│                                     │
│ Triggers:                           │
│ - update_content_items_updated_at   │
└────────────┬────────────────────────┘
             │
             ↓
    ┌──────────────────────────────────────┐
    │ content_with_folder_view             │
    ├──────────────────────────────────────┤
    │ Content items with folder info:      │
    │ - All content_items fields           │
    │ - folder_name                        │
    │ - folder_icon                        │
    │ - folder_color                       │
    └──────────────────────────────────────┘
```

---

## 4. API Request/Response Flow

```
Frontend (React Component)
    │
    ├─ User creates entry
    │
    ├─ NewEntryModal.handleSubmit()
    │
    └─ folderApi.createContentItem()
         │
         ├─ POST /api/folders/content
         │     │
         │     ├─ JSON payload:
         │     │   {
         │     │     folder_id: UUID,
         │     │     type: "trade_entry",
         │     │     title: "...",
         │     │     content: {...},
         │     │     metadata: {...},
         │     │     tags: [...],
         │     │     user_id: "..."
         │     │   }
         │     │
         │     └─ Backend Receives
         │          │
         │          ├─ Pydantic Validation
         │          │   ├─ ContentItemCreate model
         │          │   └─ Type checking & constraints
         │          │
         │          ├─ Business Logic
         │          │   ├─ Folder exists check
         │          │   └─ User access check
         │          │
         │          ├─ Database Insert
         │          │   │
         │          │   └─ INSERT INTO content_items (...)
         │          │       VALUES (...)
         │          │       RETURNING *
         │          │
         │          └─ Response: 201 Created
         │              {
         │                id: UUID,
         │                folder_id: UUID,
         │                type: "trade_entry",
         │                title: "...",
         │                created_at: ISO,
         │                ...
         │              }
         │
         └─ Frontend Updates
             │
             ├─ useFolders Hook
             │   └─ React Query Cache
             │       └─ Optimistic Update
             │
             ├─ UI Re-render
             │
             └─ Success Toast
                 "Entry created successfully!"
```

---

## 5. Folder Hierarchy Navigation Flow

```
User Clicks Folder in FolderTree
        │
        ├─ FolderTree.onFolderSelect(folderId)
        │
        ├─ JournalLayout.handleFolderSelect()
        │
        ├─ setInternalSelectedFolderId(folderId)
        │
        ├─ MainContent Updated with:
        │   └─ selectedFolder (FolderNode)
        │       ├─ Breadcrumb: folder name & icon
        │       ├─ Content count display
        │       └─ Filter entries by folderId
        │
        └─ Content Area Updates
            │
            ├─ useFolders Hook
            │   └─ Filters content_items by folder_id
            │
            ├─ JournalEntryCard List
            │   └─ Displays only entries in folder
            │
            └─ New Entry automatically:
                └─ Pre-fills folder_id = selectedFolderId
```

---

## 6. State Management Flow (React Query)

```
Query Cache
    │
    ├─ folderTree
    │   ├─ Query Key: ["folderTree", userId]
    │   ├─ Stale Time: 5 minutes
    │   ├─ Cache Time: 30 minutes
    │   └─ Data: FolderWithChildren[]
    │
    ├─ contentItems
    │   ├─ Query Key: ["contentItems", userId, filters]
    │   ├─ Stale Time: 5 minutes
    │   ├─ Paginated: 50 items/page
    │   └─ Data: ContentItem[]
    │
    └─ folderStats
        ├─ Query Key: ["folderStats", folderId]
        ├─ Stale Time: 10 minutes
        └─ Data: Statistics

Mutations
    │
    ├─ createFolder
    │   ├─ POST /api/folders
    │   └─ Invalidates: folderTree
    │
    ├─ createContentItem
    │   ├─ POST /api/folders/content
    │   └─ Invalidates: contentItems, folderStats
    │
    ├─ updateContentItem
    │   ├─ PUT /api/folders/content/{id}
    │   └─ Invalidates: contentItems, folderStats
    │
    └─ moveContentItem
        ├─ POST /api/folders/content/{id}/move
        └─ Invalidates: contentItems, folderStats (both source & dest)

Optimistic Updates
    │
    ├─ Update UI immediately
    ├─ Show loading state
    ├─ On error: rollback to previous state
    └─ Show error toast if needed
```

---

## 7. Data Structures

### FolderNode (Frontend)
```typescript
interface FolderNode {
  id: string
  name: string
  parentId?: string
  icon: string                    // Lucide icon name
  color: string                   // Hex color (#FFD700)
  position: number
  contentCount: number
  children?: FolderNode[]         // Recursive
}
```

### JournalEntry (Frontend)
```typescript
interface JournalEntry {
  id: string
  date: string
  title: string
  strategy: string
  side: 'Long' | 'Short'
  setup: string
  bias: 'Long' | 'Short' | 'Neutral'
  pnl: number
  rating: number                  // 1-5
  tags: string[]
  content: string                 // HTML
  emotion: 'confident' | 'excited' | 'frustrated' | 'neutral'
  category: 'win' | 'loss'
  createdAt: string
  template?: string
}
```

### ContentItem (Backend)
```python
class ContentItem(ContentItemBase):
    id: UUID
    folder_id: Optional[UUID]
    type: ContentType                   # Enum
    title: str
    content: Optional[Dict[str, Any]]  # JSONB
    metadata: Dict[str, Any]
    tags: List[str]
    user_id: str
    created_at: datetime
    updated_at: datetime
```

---

## 8. Performance Characteristics

```
Operation              Complexity    Index Used
─────────────────────────────────────────────────
Get folder tree        O(1)          folder_tree_view (CTE)
List folders           O(n)          idx_folders_user_id
List content items     O(log n)      idx_content_items_user_id
Filter by folder       O(log n)      idx_content_items_folder_id
Search by tags         O(log n)      idx_content_items_tags (GIN)
Get folder stats       O(n)          idx_content_items_folder_id
Move folder            O(1)          parent_id (direct update)
Move content           O(1)          folder_id (direct update)
```

---

## 9. Error Handling Flow

```
Component Error
    │
    ├─ Try/Catch Block
    │
    ├─ HTTPException (Backend)
    │   ├─ 404: Not Found
    │   ├─ 409: Conflict (duplicate, validation)
    │   ├─ 400: Bad Request
    │   └─ 500: Server Error
    │
    ├─ Frontend Catch
    │   ├─ Parse error message
    │   ├─ Log to console (debug)
    │   ├─ Show toast notification
    │   └─ Revert optimistic update
    │
    └─ User sees:
        ├─ Error message in toast
        ├─ UI state rolled back
        └─ Ability to retry action
```

---

## 10. Authentication & Access Control

```
Request Header
    │
    ├─ user_id (from context/auth)
    │
    └─ Backend Validation:
        │
        ├─ Include user_id in all queries
        │   WHERE user_id = $1 AND ...
        │
        ├─ Check folder ownership
        │   SELECT EXISTS(SELECT 1 FROM folders
        │   WHERE id = $1 AND user_id = $2)
        │
        ├─ Check content ownership
        │   SELECT EXISTS(SELECT 1 FROM content_items
        │   WHERE id = $1 AND user_id = $2)
        │
        └─ Return 404 if user doesn't have access
```

---

**Document Version**: 1.0
**Created**: October 2025
**Diagrams**: Complete and Accurate
