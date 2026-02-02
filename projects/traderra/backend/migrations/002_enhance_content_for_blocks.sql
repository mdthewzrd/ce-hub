-- Migration: Enhance content table for block-based editing
-- Version: 002
-- Date: 2024-10-17

-- Add new columns to support block-based content
ALTER TABLE content
ADD COLUMN IF NOT EXISTS editor_mode VARCHAR(20) DEFAULT 'rich-text' CHECK (editor_mode IN ('rich-text', 'blocks')),
ADD COLUMN IF NOT EXISTS blocks_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS block_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS block_types TEXT[] DEFAULT '{}';

-- Create index for JSONB queries on blocks_data
CREATE INDEX IF NOT EXISTS idx_content_blocks_data_gin ON content USING gin (blocks_data);

-- Create index for block_types array
CREATE INDEX IF NOT EXISTS idx_content_block_types ON content USING gin (block_types);

-- Create index for editor_mode
CREATE INDEX IF NOT EXISTS idx_content_editor_mode ON content (editor_mode);

-- Create a new table for block templates
CREATE TABLE IF NOT EXISTS block_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    block_type VARCHAR(50) NOT NULL,
    template_data JSONB NOT NULL,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for block_templates
CREATE INDEX IF NOT EXISTS idx_block_templates_category ON block_templates (category);
CREATE INDEX IF NOT EXISTS idx_block_templates_block_type ON block_templates (block_type);
CREATE INDEX IF NOT EXISTS idx_block_templates_is_system ON block_templates (is_system);
CREATE INDEX IF NOT EXISTS idx_block_templates_is_active ON block_templates (is_active);
CREATE INDEX IF NOT EXISTS idx_block_templates_created_by ON block_templates (created_by);

-- Create GIN index for template_data JSONB
CREATE INDEX IF NOT EXISTS idx_block_templates_data_gin ON block_templates USING gin (template_data);

-- Insert default trading block templates
INSERT INTO block_templates (name, description, category, block_type, template_data, is_system) VALUES
(
    'Basic Trade Entry',
    'Simple trade entry template with essential fields',
    'trading',
    'tradeEntry',
    '{
        "symbol": "",
        "side": "long",
        "entryPrice": 0,
        "quantity": 0,
        "entryDate": "",
        "notes": "",
        "setup": "",
        "outcome": ""
    }',
    true
),
(
    'Detailed Trade Entry',
    'Comprehensive trade entry with risk management fields',
    'trading',
    'tradeEntry',
    '{
        "symbol": "",
        "side": "long",
        "entryPrice": 0,
        "exitPrice": null,
        "quantity": 0,
        "entryDate": "",
        "exitDate": null,
        "stopLoss": null,
        "takeProfit": null,
        "commission": null,
        "notes": "",
        "setup": "Identified setup based on...",
        "outcome": "",
        "tags": []
    }',
    true
),
(
    'Breakout Strategy Template',
    'Template for documenting breakout trading strategies',
    'trading',
    'strategyTemplate',
    '{
        "name": "Breakout Strategy",
        "description": "Trade breakouts from key support/resistance levels with volume confirmation",
        "timeframe": "4H, Daily",
        "markets": ["Forex", "Stocks", "Crypto"],
        "entryRules": [
            "Price breaks above/below key resistance/support level",
            "Volume increase on breakout (>1.5x average)",
            "Retest of broken level holds as new support/resistance"
        ],
        "exitRules": [
            "Price reaches target (2-3x risk)",
            "Trailing stop triggered",
            "Failed retest of breakout level"
        ],
        "riskManagement": {
            "stopLoss": "Below/above breakout level",
            "takeProfit": "2-3x risk ratio",
            "positionSize": "1-2% account risk per trade",
            "maxRisk": "6% total portfolio risk"
        },
        "indicators": ["Volume", "Support/Resistance", "Moving Averages"],
        "notes": ""
    }',
    true
),
(
    'Weekly Performance Review',
    'Template for weekly trading performance analysis',
    'trading',
    'performanceSummary',
    '{
        "period": {
            "name": "Weekly Review",
            "startDate": "",
            "endDate": ""
        },
        "metrics": {
            "totalTrades": 0,
            "winningTrades": 0,
            "losingTrades": 0,
            "winRate": 0,
            "totalPnL": 0,
            "grossProfit": 0,
            "grossLoss": 0,
            "profitFactor": 0,
            "avgWin": 0,
            "avgLoss": 0,
            "avgReturn": 0,
            "maxWin": 0,
            "maxLoss": 0,
            "consecutiveWins": 0,
            "consecutiveLosses": 0,
            "maxDrawdown": 0
        },
        "breakdown": {},
        "insights": [],
        "improvements": [],
        "notes": ""
    }',
    true
),
(
    'Monthly Performance Summary',
    'Template for monthly trading performance analysis',
    'trading',
    'performanceSummary',
    '{
        "period": {
            "name": "Monthly Summary",
            "startDate": "",
            "endDate": ""
        },
        "metrics": {
            "totalTrades": 0,
            "winningTrades": 0,
            "losingTrades": 0,
            "winRate": 0,
            "totalPnL": 0,
            "grossProfit": 0,
            "grossLoss": 0,
            "profitFactor": 0,
            "avgWin": 0,
            "avgLoss": 0,
            "avgReturn": 0,
            "maxWin": 0,
            "maxLoss": 0,
            "consecutiveWins": 0,
            "consecutiveLosses": 0,
            "maxDrawdown": 0,
            "sharpeRatio": null,
            "returnOnAccount": null
        },
        "breakdown": {
            "byStrategy": {},
            "bySymbol": {},
            "byTimeframe": {}
        },
        "goals": {
            "target": "",
            "achieved": false,
            "notes": ""
        },
        "insights": [],
        "improvements": [],
        "notes": ""
    }',
    true
);

-- Create a function to extract block information from content
CREATE OR REPLACE FUNCTION extract_block_info(content_json JSONB)
RETURNS TABLE(block_count INTEGER, block_types TEXT[]) AS $$
DECLARE
    count_val INTEGER := 0;
    types_val TEXT[] := '{}';
    block_types_set TEXT[] := '{}';
BEGIN
    -- If content is null or empty, return zeros
    IF content_json IS NULL OR content_json = 'null'::jsonb THEN
        RETURN QUERY SELECT 0, '{}'::TEXT[];
        RETURN;
    END IF;

    -- Recursive function to traverse content and count blocks
    WITH RECURSIVE content_traverse AS (
        -- Base case: start with the root content array
        SELECT
            jsonb_array_elements(content_json->'content') as node,
            1 as level
        WHERE content_json ? 'content'

        UNION ALL

        -- Recursive case: traverse nested content
        SELECT
            jsonb_array_elements(ct.node->'content') as node,
            ct.level + 1
        FROM content_traverse ct
        WHERE ct.node ? 'content'
    )
    SELECT
        COUNT(*)::INTEGER,
        array_agg(DISTINCT (node->>'type')) FILTER (WHERE node->>'type' IN ('tradeEntry', 'strategyTemplate', 'performanceSummary'))
    INTO count_val, types_val
    FROM content_traverse
    WHERE node->>'type' IN ('tradeEntry', 'strategyTemplate', 'performanceSummary');

    -- Handle null array
    IF types_val IS NULL THEN
        types_val := '{}';
    END IF;

    RETURN QUERY SELECT count_val, types_val;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to automatically update block metadata
CREATE OR REPLACE FUNCTION update_block_metadata()
RETURNS TRIGGER AS $$
DECLARE
    block_info RECORD;
BEGIN
    -- Only process if content has changed
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        -- Extract block information
        SELECT * INTO block_info FROM extract_block_info(NEW.content);

        -- Update the block metadata
        NEW.block_count := block_info.block_count;
        NEW.block_types := block_info.block_types;

        -- Set editor mode based on presence of blocks
        IF block_info.block_count > 0 THEN
            NEW.editor_mode := 'blocks';
        ELSIF NEW.editor_mode IS NULL THEN
            NEW.editor_mode := 'rich-text';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_block_metadata ON content;
CREATE TRIGGER trigger_update_block_metadata
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_block_metadata();

-- Update existing content to populate block metadata
UPDATE content
SET
    editor_mode = CASE
        WHEN block_info.block_count > 0 THEN 'blocks'
        ELSE 'rich-text'
    END,
    block_count = block_info.block_count,
    block_types = block_info.block_types
FROM (
    SELECT
        id,
        (extract_block_info(content)).*
    FROM content
) AS block_info
WHERE content.id = block_info.id;

-- Add useful views for block analytics
CREATE OR REPLACE VIEW content_block_stats AS
SELECT
    editor_mode,
    COUNT(*) as total_documents,
    AVG(block_count) as avg_blocks_per_document,
    SUM(block_count) as total_blocks,
    COUNT(DISTINCT unnest(block_types)) as unique_block_types
FROM content
GROUP BY editor_mode;

CREATE OR REPLACE VIEW popular_block_types AS
SELECT
    block_type,
    COUNT(*) as usage_count,
    COUNT(DISTINCT c.id) as documents_count
FROM content c
CROSS JOIN unnest(c.block_types) as block_type
WHERE c.block_types IS NOT NULL
GROUP BY block_type
ORDER BY usage_count DESC;

-- Add comments for documentation
COMMENT ON COLUMN content.editor_mode IS 'Editor mode: rich-text or blocks';
COMMENT ON COLUMN content.blocks_data IS 'Additional metadata about blocks in the content';
COMMENT ON COLUMN content.block_count IS 'Number of trading-specific blocks in the content';
COMMENT ON COLUMN content.block_types IS 'Array of block types present in the content';

COMMENT ON TABLE block_templates IS 'Pre-defined templates for trading blocks';
COMMENT ON COLUMN block_templates.template_data IS 'JSON template data for the block';
COMMENT ON COLUMN block_templates.is_system IS 'Whether this is a system-provided template';

-- Grant permissions (adjust as needed for your user roles)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON block_templates TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;