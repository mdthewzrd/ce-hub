# CE-Hub Organization Plan

## 🎯 Target Structure

```
ce-hub/
├── core/                           # Core CE-Hub system files
│   ├── servers/                    # All API servers
│   │   ├── mobile-claude-api-optimized.py
│   │   ├── mobile-claude-api-enhanced.py
│   │   └── mobile-server-pro.py
│   ├── interfaces/                 # Web interfaces
│   │   ├── mobile-pro-v3-fixed.html
│   │   ├── mobile-dashboard.html
│   │   └── desktop/
│   ├── scripts/                    # Utility scripts
│   │   ├── automation/
│   │   ├── setup/
│   │   └── maintenance/
│   └── config/                     # Configuration files
│       ├── chat_config.yml
│       ├── model_config.yml
│       └── claude_desktop_config.json
│
├── projects/                       # Active project workspaces
│   ├── traderra/                   # Trading journal system
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── docs/
│   │   ├── tests/
│   │   └── README.md
│   ├── edge-dev/                   # Mobile dashboard (consolidated)
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── mobile/
│   │   ├── docs/
│   │   ├── tests/
│   │   └── README.md
│   ├── renata/                     # AI Calendar system
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── docs/
│   │   ├── tests/
│   │   └── README.md
│   └── claude-bridge/              # Claude integration tools
│       ├── backend/
│       ├── docs/
│       └── README.md
│
├── assets/                         # Shared resources
│   ├── docs/                       # Documentation system (keep existing)
│   │   ├── projects/
│   │   ├── patterns/
│   │   ├── context/
│   │   └── sessions/
│   ├── templates/                  # Reusable templates
│   │   ├── mobile/
│   │   ├── api/
│   │   └── project-structure/
│   ├── tools/                      # Shared utilities
│   │   ├── testing/
│   │   ├── deployment/
│   │   └── monitoring/
│   └── media/                      # Screenshots, images, etc.
│       ├── screenshots/
│       ├── diagrams/
│       └── demos/
│
├── archive/                        # Deprecated/old files
│   ├── old-mobile-interfaces/
│   ├── deprecated-scripts/
│   ├── test-artifacts/
│   └── backup-configs/
│
├── workspace/                      # Temporary/working files
│   ├── experiments/
│   ├── prototypes/
│   └── scratch/
│
├── .system/                        # Hidden system files
│   ├── .git/
│   ├── .vscode/
│   ├── .cache/
│   └── .env
│
└── README.md                       # Main CE-Hub documentation
```

## 🧹 File Migration Strategy

### Phase 1: Core System Files
- Move all API servers → `core/servers/`
- Move all mobile interfaces → `core/interfaces/`
- Consolidate config files → `core/config/`

### Phase 2: Project Consolidation
- Merge edge-dev + edge.dev.mobile → `projects/edge-dev/`
- Organize traderra properly → `projects/traderra/`
- Create clear project structure template

### Phase 3: Asset Organization
- Move test files → `assets/tools/testing/`
- Organize screenshots → `assets/media/screenshots/`
- Group templates → `assets/templates/`

### Phase 4: Archive & Cleanup
- Archive duplicate/old files → `archive/`
- Clean up loose files in root
- Set up .gitignore for workspace/

### Phase 5: Automation Setup
- Create file organization scripts
- Set up automated cleanup tools
- Implement project template generator

## 🎯 Benefits

1. **Clear Separation**: Core system vs projects vs assets
2. **Scalable**: Easy to add new projects with consistent structure
3. **Navigable**: Logical hierarchy, no more hunting for files
4. **Clean Root**: Only essential top-level items
5. **Future-Proof**: Template-driven project creation
6. **Maintainable**: Automated organization tools

## 📋 Implementation Checklist

- [ ] Create new directory structure
- [ ] Migrate core system files
- [ ] Consolidate duplicate projects
- [ ] Organize loose test/utility files
- [ ] Archive deprecated content
- [ ] Update all path references
- [ ] Test all interfaces and servers
- [ ] Create maintenance automation
- [ ] Update documentation