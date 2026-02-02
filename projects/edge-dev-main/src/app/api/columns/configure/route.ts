/**
 * Column Configuration API
 * Runtime control of scan result display columns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getColumnConfiguration } from '@/services/columnConfigurationService';

// GET /api/columns/configure - Get columns or layouts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scannerType = searchParams.get('scanner_type') || 'lc_d2';
    const action = searchParams.get('action') || 'columns';
    const layoutId = searchParams.get('layout_id');
    const includeHidden = searchParams.get('include_hidden') === 'true';

    const columnConfig = getColumnConfiguration();

    let result;

    switch (action) {
      case 'columns':
        // Get columns for scanner type
        result = {
          success: true,
          scanner_type: scannerType,
          columns: columnConfig.getColumnsForScanner(scannerType, includeHidden)
        };
        break;

      case 'layout':
        // Get specific layout
        if (layoutId) {
          const layout = columnConfig.loadLayout(layoutId);
          const columns = layout ? columnConfig.applyLayout(layoutId) : [];
          result = {
            success: true,
            layout: layout,
            columns: columns
          };
        } else {
          // Get default layout for scanner type
          const layout = columnConfig.getLayout(scannerType);
          const columns = layout ? columnConfig.applyLayout(layout.id) : [];
          result = {
            success: true,
            layout: layout,
            columns: columns
          };
        }
        break;

      case 'layouts':
        // Get all layouts for scanner type
        result = {
          success: true,
          scanner_type: scannerType,
          layouts: columnConfig.getLayouts(scannerType)
        };
        break;

      case 'presets':
        // Get available presets
        result = {
          success: true,
          scanner_type: scannerType,
          presets: columnConfig.getPresets(scannerType)
        };
        break;

      case 'stats':
        // Get service statistics
        result = {
          success: true,
          stats: columnConfig.getStats()
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: columns, layout, layouts, presets, or stats'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Column GET API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/columns/configure - Add, edit, or remove columns
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const columnConfig = getColumnConfiguration();

    let result;

    switch (action) {
      case 'add_column':
        // Add a new column
        result = {
          success: true,
          message: 'Column added successfully',
          column: columnConfig.addColumn(data.column)
        };
        break;

      case 'remove_column':
        // Remove a column
        const removed = columnConfig.removeColumn(data.column_id);
        result = {
          success: removed,
          message: removed ? 'Column removed successfully' : 'Column not found'
        };
        break;

      case 'edit_column':
        // Edit a column
        const edited = columnConfig.editColumn(data.column_id, data.updates);
        result = {
          success: edited,
          message: edited ? 'Column updated successfully' : 'Column not found'
        };
        break;

      case 'toggle_visibility':
        // Toggle column visibility
        const toggled = columnConfig.toggleColumnVisibility(data.column_id);
        result = {
          success: toggled,
          message: toggled ? 'Visibility toggled successfully' : 'Column not found'
        };
        break;

      case 'reorder_columns':
        // Reorder columns
        columnConfig.reorderColumns(data.column_ids);
        result = {
          success: true,
          message: 'Columns reordered successfully'
        };
        break;

      case 'save_layout':
        // Save a custom layout
        const layout = columnConfig.saveLayout(data.layout);
        result = {
          success: true,
          message: 'Layout saved successfully',
          layout: layout
        };
        break;

      case 'delete_layout':
        // Delete a layout
        const deleted = columnConfig.deleteLayout(data.layout_id);
        result = {
          success: deleted,
          message: deleted ? 'Layout deleted successfully' : 'Layout not found'
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: add_column, remove_column, edit_column, toggle_visibility, reorder_columns, save_layout, delete_layout'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Column POST API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/columns/configure - Update columns or layouts
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const columnConfig = getColumnConfiguration();

    let result;

    switch (action) {
      case 'update_column':
        // Update a column (alias for edit_column)
        const edited = columnConfig.editColumn(data.column_id, data.updates);
        result = {
          success: edited,
          message: edited ? 'Column updated successfully' : 'Column not found'
        };
        break;

      case 'update_layout':
        // Update a layout
        const layout = columnConfig.saveLayout(data.layout);
        result = {
          success: true,
          message: 'Layout updated successfully',
          layout: layout
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: update_column, update_layout'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Column PUT API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/columns/configure - Remove columns or layouts
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'delete';
    const columnId = searchParams.get('column_id');
    const layoutId = searchParams.get('layout_id');

    const columnConfig = getColumnConfiguration();

    let result;

    if (action === 'delete_column' && columnId) {
      const removed = columnConfig.removeColumn(columnId);
      result = {
        success: removed,
        message: removed ? 'Column deleted successfully' : 'Column not found'
      };
    } else if (action === 'delete_layout' && layoutId) {
      const deleted = columnConfig.deleteLayout(layoutId);
      result = {
        success: deleted,
        message: deleted ? 'Layout deleted successfully' : 'Layout not found'
      };
    } else {
      result = {
        success: false,
        error: 'Missing required parameters. Provide column_id or layout_id'
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Column DELETE API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
