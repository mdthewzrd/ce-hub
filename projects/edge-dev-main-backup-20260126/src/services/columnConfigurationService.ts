/**
 * Dynamic Column Configuration Service
 * Runtime control of scan result display columns per scanner type
 */

// ========== TYPES ==========

export type ColumnType = 'data' | 'computed' | 'parameter' | 'validation' | 'display';

export interface ColumnDefinition {
  id: string;
  name: string;
  label: string;
  type: ColumnType;
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'array';
  description?: string;
  visible: boolean;
  order: number;
  width?: number; // in pixels
  format?: (value: any) => string; // Custom formatting function
  compute?: (row: any) => any; // For computed columns
  source: 'scanner' | 'system' | 'user';
  tags: string[];
  scanner_types: string[]; // Which scanner types this column applies to
}

export interface ColumnLayout {
  id: string;
  name: string;
  description?: string;
  scanner_type: string;
  columns: string[]; // Column IDs in display order
  created_at: Date;
  updated_at: Date;
  is_default: boolean;
}

export interface ColumnPreset {
  scanner_type: string;
  name: string;
  description: string;
  columns: ColumnDefinition[];
}

// ========== COLUMN DEFINITIONS ==========

// Common columns available across scanner types
const COMMON_COLUMNS: ColumnDefinition[] = [
  {
    id: 'ticker',
    name: 'ticker',
    label: 'Ticker',
    type: 'data',
    data_type: 'string',
    description: 'Stock ticker symbol',
    visible: true,
    order: 1,
    source: 'scanner',
    tags: ['essential', 'identifier'],
    scanner_types: ['*'] // Applies to all scanner types
  },
  {
    id: 'date',
    name: 'date',
    label: 'Date',
    type: 'data',
    data_type: 'date',
    description: 'Signal date',
    visible: true,
    order: 2,
    source: 'scanner',
    tags: ['essential', 'time'],
    scanner_types: ['*']
  },
  {
    id: 'scanner_label',
    name: 'scanner_label',
    label: 'Scanner Pattern',
    type: 'data',
    data_type: 'string',
    description: 'Which scanner pattern triggered',
    visible: true,
    order: 3,
    source: 'scanner',
    tags: ['essential', 'pattern'],
    scanner_types: ['*']
  }
];

// LC D2 specific columns
const LC_D2_COLUMNS: ColumnDefinition[] = [
  {
    id: 'gap_percent',
    name: 'gap_percent',
    label: 'Gap %',
    type: 'data',
    data_type: 'number',
    description: 'Gap percentage (open vs prev close)',
    visible: true,
    order: 4,
    width: 100,
    format: (val) => `${val.toFixed(2)}%`,
    source: 'scanner',
    tags: ['price', 'gap'],
    scanner_types: ['lc_d2', 'lc']
  },
  {
    id: 'volume',
    name: 'volume',
    label: 'Volume',
    type: 'data',
    data_type: 'number',
    description: 'Trading volume',
    visible: true,
    order: 5,
    width: 120,
    format: (val) => (val / 1000000).toFixed(2) + 'M',
    source: 'scanner',
    tags: ['volume', 'liquidity'],
    scanner_types: ['lc_d2', 'lc']
  },
  {
    id: 'close_price',
    name: 'close_price',
    label: 'Close Price',
    type: 'data',
    data_type: 'number',
    description: 'Closing price',
    visible: false,
    order: 6,
    width: 100,
    format: (val) => `$${val.toFixed(2)}`,
    source: 'scanner',
    tags: ['price'],
    scanner_types: ['lc_d2', 'lc']
  }
];

// Backside B specific columns
const BACKSIDE_B_COLUMNS: ColumnDefinition[] = [
  {
    id: 'gap_percent',
    name: 'gap_percent',
    label: 'Gap %',
    type: 'data',
    data_type: 'number',
    description: 'Gap percentage (downward)',
    visible: true,
    order: 4,
    width: 100,
    format: (val) => `${val.toFixed(2)}%`,
    source: 'scanner',
    tags: ['price', 'gap'],
    scanner_types: ['backside_b', 'backside']
  },
  {
    id: 'is_para_b',
    name: 'is_para_b',
    label: 'Para B',
    type: 'validation',
    data_type: 'boolean',
    description: 'Is Para B pattern',
    visible: true,
    order: 5,
    width: 80,
    format: (val) => val ? '✓' : '✗',
    source: 'scanner',
    tags: ['pattern', 'validation'],
    scanner_types: ['backside_b', 'backside']
  },
  {
    id: 'pm_cap',
    name: 'pm_cap',
    label: 'PM Cap',
    type: 'data',
    data_type: 'number',
    description: 'Price cap for Para B',
    visible: false,
    order: 6,
    width: 100,
    format: (val) => `$${val.toFixed(2)}`,
    source: 'scanner',
    tags: ['price', 'validation'],
    scanner_types: ['backside_b', 'backside']
  }
];

// ========== PRESETS ==========

const COLUMN_PRESETS: ColumnPreset[] = [
  {
    scanner_type: 'lc_d2',
    name: 'Standard LC D2',
    description: 'Default LC D2 scanner columns',
    columns: [
      ...COMMON_COLUMNS,
      ...LC_D2_COLUMNS
    ]
  },
  {
    scanner_type: 'backside_b',
    name: 'Standard Backside B',
    description: 'Default Backside B scanner columns',
    columns: [
      ...COMMON_COLUMNS,
      ...BACKSIDE_B_COLUMNS
    ]
  },
  {
    scanner_type: 'lc_d2',
    name: 'LC D2 Compact',
    description: 'Minimal LC D2 columns for quick review',
    columns: [
      { ...COMMON_COLUMNS[0], visible: true, order: 1 }, // ticker
      { ...COMMON_COLUMNS[2], visible: true, order: 2 }, // scanner_label
      { ...LC_D2_COLUMNS[0], visible: true, order: 3 }  // gap_percent
    ]
  },
  {
    scanner_type: 'lc_d2',
    name: 'LC D2 Detailed',
    description: 'All LC D2 columns including optional ones',
    columns: [
      ...COMMON_COLUMNS.map(c => ({ ...c, visible: true })),
      ...LC_D2_COLUMNS.map(c => ({ ...c, visible: true }))
    ]
  }
];

// ========== SERVICE ==========

export class ColumnConfigurationService {
  private columns: Map<string, ColumnDefinition> = new Map();
  private layouts: Map<string, ColumnLayout> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initializeDefaults();
  }

  /**
   * Initialize with default columns and presets
   */
  private initializeDefaults() {
    // Register all columns
    this.registerColumns(COMMON_COLUMNS);
    this.registerColumns(LC_D2_COLUMNS);
    this.registerColumns(BACKSIDE_B_COLUMNS);

    // Register default layouts from presets
    COLUMN_PRESETS.forEach(preset => {
      const layout: ColumnLayout = {
        id: `${preset.scanner_type}_${preset.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: preset.name,
        description: preset.description,
        scanner_type: preset.scanner_type,
        columns: preset.columns.map(c => c.id),
        created_at: new Date(),
        updated_at: new Date(),
        is_default: preset.name.includes('Standard')
      };
      this.layouts.set(layout.id, layout);
    });

    this.initialized = true;
  }

  /**
   * Register multiple columns
   */
  private registerColumns(columns: ColumnDefinition[]) {
    columns.forEach(col => {
      this.columns.set(col.id, col);
    });
  }

  /**
   * Get columns for a specific scanner type
   */
  getColumnsForScanner(scannerType: string, includeHidden: boolean = false): ColumnDefinition[] {
    const allColumns = Array.from(this.columns.values());

    // Filter columns that apply to this scanner type
    const applicableColumns = allColumns.filter(col =>
      col.scanner_types.includes('*') ||
      col.scanner_types.includes(scannerType) ||
      col.scanner_types.includes(scannerType.replace('_', '').toLowerCase())
    );

    // Filter by visibility if requested
    let visibleColumns = includeHidden
      ? applicableColumns
      : applicableColumns.filter(col => col.visible);

    // Sort by order
    return visibleColumns.sort((a, b) => a.order - b.order);
  }

  /**
   * Get a layout for a scanner type
   */
  getLayout(scannerType: string): ColumnLayout | null {
    const layouts = Array.from(this.layouts.values())
      .filter(l => l.scanner_type === scannerType);

    // Return default layout or first available
    return layouts.find(l => l.is_default) || layouts[0] || null;
  }

  /**
   * Apply a layout to get actual column definitions
   */
  applyLayout(layoutId: string): ColumnDefinition[] {
    const layout = this.layouts.get(layoutId);
    if (!layout) {
      return [];
    }

    const columns: ColumnDefinition[] = [];
    layout.columns.forEach(colId => {
      const col = this.columns.get(colId);
      if (col && col.visible) {
        columns.push(col);
      }
    });

    return columns;
  }

  /**
   * Add a new column
   */
  addColumn(column: ColumnDefinition): void {
    this.columns.set(column.id, column);
  }

  /**
   * Remove a column
   */
  removeColumn(columnId: string): boolean {
    return this.columns.delete(columnId);
  }

  /**
   * Edit a column
   */
  editColumn(columnId: string, updates: Partial<ColumnDefinition>): boolean {
    const column = this.columns.get(columnId);
    if (!column) {
      return false;
    }

    const updated = { ...column, ...updates };
    this.columns.set(columnId, updated);
    return true;
  }

  /**
   * Toggle column visibility
   */
  toggleColumnVisibility(columnId: string): boolean {
    const column = this.columns.get(columnId);
    if (!column) {
      return false;
    }

    column.visible = !column.visible;
    this.columns.set(columnId, column);
    return true;
  }

  /**
   * Reorder columns
   */
  reorderColumns(columnIds: string[]): void {
    columnIds.forEach((colId, index) => {
      const column = this.columns.get(colId);
      if (column) {
        column.order = index;
        this.columns.set(colId, column);
      }
    });
  }

  /**
   * Save a custom layout
   */
  saveLayout(layout: Omit<ColumnLayout, 'id' | 'created_at' | 'updated_at'>): ColumnLayout {
    const newLayout: ColumnLayout = {
      id: `${layout.scanner_type}_${Date.now()}`,
      ...layout,
      created_at: new Date(),
      updated_at: new Date()
    };

    this.layouts.set(newLayout.id, newLayout);
    return newLayout;
  }

  /**
   * Load a layout
   */
  loadLayout(layoutId: string): ColumnLayout | null {
    return this.layouts.get(layoutId) || null;
  }

  /**
   * Delete a layout
   */
  deleteLayout(layoutId: string): boolean {
    return this.layouts.delete(layoutId);
  }

  /**
   * Get available presets for a scanner type
   */
  getPresets(scannerType: string): ColumnPreset[] {
    return COLUMN_PRESETS.filter(p =>
      p.scanner_type === scannerType ||
      p.scanner_type === scannerType.replace('_', '').toLowerCase()
    );
  }

  /**
   * Get all layouts for a scanner type
   */
  getLayouts(scannerType: string): ColumnLayout[] {
    return Array.from(this.layouts.values())
      .filter(l => l.scanner_type === scannerType)
      .sort((a, b) => a.is_default ? -1 : 1); // Defaults first
  }

  /**
   * Format a value using column's format function
   */
  formatValue(columnId: string, value: any): string {
    const column = this.columns.get(columnId);
    if (!column || !column.format) {
      return String(value);
    }

    try {
      return column.format(value);
    } catch (error) {
      console.error(`Format error for column ${columnId}:`, error);
      return String(value);
    }
  }

  /**
   * Compute a value using column's compute function
   */
  computeValue(columnId: string, row: any): any {
    const column = this.columns.get(columnId);
    if (!column || !column.compute) {
      return null;
    }

    try {
      return column.compute(row);
    } catch (error) {
      console.error(`Compute error for column ${columnId}:`, error);
      return null;
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      totalColumns: this.columns.size,
      totalLayouts: this.layouts.size,
      initialized: this.initialized,
      scannerTypes: [...new Set(
        Array.from(this.columns.values())
          .flatMap(c => c.scanner_types)
          .filter(t => t !== '*')
      )]
    };
  }
}

// ========== EXPORT SINGLETON ==========

let _instance: ColumnConfigurationService | null = null;

export const getColumnConfiguration = (): ColumnConfigurationService => {
  if (!_instance) {
    _instance = new ColumnConfigurationService();
  }
  return _instance;
};

export const columnConfig = new Proxy({} as ColumnConfigurationService, {
  get(target, prop) {
    const instance = getColumnConfiguration();
    const value = instance[prop as keyof ColumnConfigurationService];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
