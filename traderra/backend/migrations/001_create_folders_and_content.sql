-- Traderra Journal Folder Management System Database Schema
-- Migration 001: Create folders and content_items tables
-- Created: 2025-10-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create folders table for hierarchical organization
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- For future user management
    icon VARCHAR(50) DEFAULT 'folder',
    color VARCHAR(7) DEFAULT '#FFD700', -- Gold accent default
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT folders_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT folders_color_valid CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT folders_no_self_reference CHECK (id != parent_id)
);

-- Create content_items table (unified for all content types)
CREATE TABLE IF NOT EXISTS content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB,
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT content_type_valid CHECK (type IN ('trade_entry', 'document', 'note', 'strategy', 'research', 'review')),
    CONSTRAINT content_title_not_empty CHECK (length(trim(title)) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_position ON folders(position);
CREATE INDEX IF NOT EXISTS idx_content_items_folder_id ON content_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_items_user_id ON content_items(user_id);
CREATE INDEX IF NOT EXISTS idx_content_items_tags ON content_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_content_items_metadata ON content_items USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at handling
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default folder structure
INSERT INTO folders (id, name, user_id, icon, color, position) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Trading Journal', 'default_user', 'journal-text', '#FFD700', 0),
    ('22222222-2222-2222-2222-222222222222', 'Trade Entries', 'default_user', 'trending-up', '#10B981', 1),
    ('33333333-3333-3333-3333-333333333333', 'Strategies', 'default_user', 'target', '#3B82F6', 2),
    ('44444444-4444-4444-4444-444444444444', 'Research', 'default_user', 'search', '#8B5CF6', 3),
    ('55555555-5555-5555-5555-555555555555', 'Goals & Reviews', 'default_user', 'star', '#F59E0B', 4),
    ('66666666-6666-6666-6666-666666666666', 'Templates', 'default_user', 'bookmark', '#6B7280', 5)
ON CONFLICT (id) DO NOTHING;

-- Set parent relationships for default folders
UPDATE folders SET parent_id = '11111111-1111-1111-1111-111111111111'
WHERE id IN ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333',
             '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555',
             '66666666-6666-6666-6666-666666666666');

-- Create subfolders for Trade Entries
INSERT INTO folders (name, parent_id, user_id, icon, color, position) VALUES
    ('2024', '22222222-2222-2222-2222-222222222222', 'default_user', 'calendar', '#10B981', 0),
    ('Archives', '22222222-2222-2222-2222-222222222222', 'default_user', 'archive', '#6B7280', 1)
ON CONFLICT DO NOTHING;

-- Create subfolders for Research
INSERT INTO folders (name, parent_id, user_id, icon, color, position) VALUES
    ('Sectors', '44444444-4444-4444-4444-444444444444', 'default_user', 'pie-chart', '#8B5CF6', 0),
    ('Companies', '44444444-4444-4444-4444-444444444444', 'default_user', 'building', '#8B5CF6', 1),
    ('Economic Data', '44444444-4444-4444-4444-444444444444', 'default_user', 'trending-up', '#8B5CF6', 2)
ON CONFLICT DO NOTHING;

-- Add sample content items to demonstrate the system
INSERT INTO content_items (id, folder_id, type, title, content, metadata, tags, user_id) VALUES
    (
        'c1111111-1111-1111-1111-111111111111',
        '33333333-3333-3333-3333-333333333333',
        'strategy',
        'Momentum Trading Strategy',
        '{"blocks": [{"type": "heading", "data": {"text": "Momentum Trading Strategy", "level": 1}}, {"type": "paragraph", "data": {"text": "A comprehensive strategy for trading momentum breakouts with high probability setups."}}, {"type": "heading", "data": {"text": "Entry Criteria", "level": 2}}, {"type": "list", "data": {"style": "unordered", "items": ["Volume spike above 2x average", "Clean breakout above resistance", "Strong sector momentum", "Risk/reward ratio 1:2 minimum"]}}]}',
        '{"category": "trading_strategy", "difficulty": "intermediate", "success_rate": 0.65}',
        '{"momentum", "breakout", "volume", "strategy"}',
        'default_user'
    ),
    (
        'c2222222-2222-2222-2222-222222222222',
        '55555555-5555-5555-5555-555555555555',
        'review',
        '2024 Q4 Trading Goals',
        '{"blocks": [{"type": "heading", "data": {"text": "Q4 2024 Trading Goals", "level": 1}}, {"type": "paragraph", "data": {"text": "Performance objectives and focus areas for the fourth quarter."}}, {"type": "list", "data": {"style": "ordered", "items": ["Achieve 15% quarterly return", "Maintain win rate above 60%", "Master momentum trading strategy", "Reduce emotional trading mistakes"]}}]}',
        '{"quarter": "Q4", "year": 2024, "status": "active"}',
        '{"goals", "quarterly", "performance", "planning"}',
        'default_user'
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        '66666666-6666-6666-6666-666666666666',
        'document',
        'Trade Entry Template',
        '{"blocks": [{"type": "heading", "data": {"text": "Trade Entry Template", "level": 1}}, {"type": "paragraph", "data": {"text": "Standard template for documenting trade setups and analysis."}}, {"type": "heading", "data": {"text": "Setup Analysis", "level": 2}}, {"type": "list", "data": {"style": "unordered", "items": ["Market conditions", "Technical setup", "Catalyst/reason for trade", "Risk assessment"]}}, {"type": "heading", "data": {"text": "Execution Plan", "level": 2}}, {"type": "list", "data": {"style": "unordered", "items": ["Entry price and method", "Position size calculation", "Stop loss placement", "Profit target levels"]}}]}',
        '{"template_type": "trade_entry", "version": "1.0"}',
        '{"template", "trade", "documentation"}',
        'default_user'
    )
ON CONFLICT (id) DO NOTHING;

-- Create view for folder tree with content counts
CREATE OR REPLACE VIEW folder_tree_view AS
WITH RECURSIVE folder_hierarchy AS (
    -- Base case: root folders (no parent)
    SELECT
        id,
        name,
        parent_id,
        user_id,
        icon,
        color,
        position,
        0 as depth,
        ARRAY[position, id::text] as sort_path,
        name as full_path
    FROM folders
    WHERE parent_id IS NULL

    UNION ALL

    -- Recursive case: child folders
    SELECT
        f.id,
        f.name,
        f.parent_id,
        f.user_id,
        f.icon,
        f.color,
        f.position,
        fh.depth + 1,
        fh.sort_path || ARRAY[f.position, f.id::text],
        fh.full_path || ' > ' || f.name
    FROM folders f
    INNER JOIN folder_hierarchy fh ON f.parent_id = fh.id
),
content_counts AS (
    SELECT
        folder_id,
        COUNT(*) as content_count
    FROM content_items
    GROUP BY folder_id
)
SELECT
    fh.*,
    COALESCE(cc.content_count, 0) as content_count
FROM folder_hierarchy fh
LEFT JOIN content_counts cc ON fh.id = cc.folder_id
ORDER BY fh.sort_path;

-- Create view for content items with folder information
CREATE OR REPLACE VIEW content_with_folder_view AS
SELECT
    ci.*,
    f.name as folder_name,
    f.icon as folder_icon,
    f.color as folder_color
FROM content_items ci
LEFT JOIN folders f ON ci.folder_id = f.id;

COMMENT ON TABLE folders IS 'Hierarchical folder structure for organizing trading journal content';
COMMENT ON TABLE content_items IS 'Unified table for all content types (trade entries, documents, notes, strategies, etc.)';
COMMENT ON VIEW folder_tree_view IS 'Recursive view showing complete folder hierarchy with content counts';
COMMENT ON VIEW content_with_folder_view IS 'Content items with associated folder information';