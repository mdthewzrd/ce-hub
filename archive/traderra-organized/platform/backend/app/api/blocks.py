"""
Block-specific API endpoints for Traderra trading journal.
Handles block templates, block operations, and block analytics.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from uuid import UUID
import json

from ..core.database import get_database_connection
from ..core.auth import get_current_user

router = APIRouter()

# Pydantic models for block operations
class BlockTemplate(BaseModel):
    id: Optional[UUID] = None
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., pattern="^(basic|media|trading|advanced|ai)$")
    block_type: str = Field(..., pattern="^(tradeEntry|strategyTemplate|performanceSummary|paragraph|heading|list)$")
    template_data: Dict[str, Any]
    is_system: bool = False
    is_active: bool = True

class BlockTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., pattern="^(basic|media|trading|advanced|ai)$")
    block_type: str = Field(..., pattern="^(tradeEntry|strategyTemplate|performanceSummary|paragraph|heading|list)$")
    template_data: Dict[str, Any]

class BlockTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, pattern="^(basic|media|trading|advanced|ai)$")
    block_type: Optional[str] = Field(None, pattern="^(tradeEntry|strategyTemplate|performanceSummary|paragraph|heading|list)$")
    template_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class ContentModeUpdate(BaseModel):
    editor_mode: str = Field(..., pattern="^(rich-text|blocks)$")

class BlockAnalytics(BaseModel):
    total_documents: int
    total_blocks: int
    avg_blocks_per_document: float
    block_type_distribution: Dict[str, int]
    popular_templates: List[Dict[str, Any]]

# Block Templates endpoints
@router.get("/templates", response_model=List[BlockTemplate])
async def get_block_templates(
    category: Optional[str] = Query(None, pattern="^(basic|media|trading|advanced|ai)$"),
    block_type: Optional[str] = Query(None),
    is_system: Optional[bool] = Query(None),
    is_active: bool = Query(True),
    current_user = Depends(get_current_user)
):
    """Get block templates with optional filtering."""

    query = """
        SELECT id, name, description, category, block_type, template_data,
               is_system, is_active, created_by, created_at, updated_at
        FROM block_templates
        WHERE is_active = $1
    """
    params = [is_active]
    param_count = 1

    if category:
        param_count += 1
        query += f" AND category = ${param_count}"
        params.append(category)

    if block_type:
        param_count += 1
        query += f" AND block_type = ${param_count}"
        params.append(block_type)

    if is_system is not None:
        param_count += 1
        query += f" AND is_system = ${param_count}"
        params.append(is_system)

    # Add user filter for non-system templates
    if not is_system:
        param_count += 1
        query += f" AND (is_system = true OR created_by = ${param_count})"
        params.append(current_user.id)

    query += " ORDER BY is_system DESC, category, name"

    async with get_database_connection() as conn:
        rows = await conn.fetch(query, *params)

        templates = []
        for row in rows:
            template = BlockTemplate(
                id=row['id'],
                name=row['name'],
                description=row['description'],
                category=row['category'],
                block_type=row['block_type'],
                template_data=row['template_data'],
                is_system=row['is_system'],
                is_active=row['is_active']
            )
            templates.append(template)

        return templates

@router.post("/templates", response_model=BlockTemplate)
async def create_block_template(
    template: BlockTemplateCreate,
    current_user = Depends(get_current_user)
):
    """Create a new block template."""

    query = """
        INSERT INTO block_templates (name, description, category, block_type, template_data, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, description, category, block_type, template_data,
                  is_system, is_active, created_by, created_at, updated_at
    """

    async with get_database_connection() as conn:
        row = await conn.fetchrow(
            query,
            template.name,
            template.description,
            template.category,
            template.block_type,
            json.dumps(template.template_data),
            current_user.id
        )

        if not row:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create block template"
            )

        return BlockTemplate(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            category=row['category'],
            block_type=row['block_type'],
            template_data=row['template_data'],
            is_system=row['is_system'],
            is_active=row['is_active']
        )

@router.get("/templates/{template_id}", response_model=BlockTemplate)
async def get_block_template(
    template_id: UUID,
    current_user = Depends(get_current_user)
):
    """Get a specific block template."""

    query = """
        SELECT id, name, description, category, block_type, template_data,
               is_system, is_active, created_by, created_at, updated_at
        FROM block_templates
        WHERE id = $1 AND (is_system = true OR created_by = $2)
    """

    async with get_database_connection() as conn:
        row = await conn.fetchrow(query, template_id, current_user.id)

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Block template not found"
            )

        return BlockTemplate(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            category=row['category'],
            block_type=row['block_type'],
            template_data=row['template_data'],
            is_system=row['is_system'],
            is_active=row['is_active']
        )

@router.put("/templates/{template_id}", response_model=BlockTemplate)
async def update_block_template(
    template_id: UUID,
    template_update: BlockTemplateUpdate,
    current_user = Depends(get_current_user)
):
    """Update a block template (only non-system templates by their creator)."""

    # Check if template exists and user has permission
    check_query = """
        SELECT id, is_system, created_by
        FROM block_templates
        WHERE id = $1
    """

    async with get_database_connection() as conn:
        existing = await conn.fetchrow(check_query, template_id)

        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Block template not found"
            )

        if existing['is_system'] or existing['created_by'] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify system templates or templates created by other users"
            )

        # Build update query dynamically
        updates = []
        params = []
        param_count = 0

        if template_update.name is not None:
            param_count += 1
            updates.append(f"name = ${param_count}")
            params.append(template_update.name)

        if template_update.description is not None:
            param_count += 1
            updates.append(f"description = ${param_count}")
            params.append(template_update.description)

        if template_update.category is not None:
            param_count += 1
            updates.append(f"category = ${param_count}")
            params.append(template_update.category)

        if template_update.block_type is not None:
            param_count += 1
            updates.append(f"block_type = ${param_count}")
            params.append(template_update.block_type)

        if template_update.template_data is not None:
            param_count += 1
            updates.append(f"template_data = ${param_count}")
            params.append(json.dumps(template_update.template_data))

        if template_update.is_active is not None:
            param_count += 1
            updates.append(f"is_active = ${param_count}")
            params.append(template_update.is_active)

        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        param_count += 1
        updates.append(f"updated_at = CURRENT_TIMESTAMP")
        params.append(template_id)

        query = f"""
            UPDATE block_templates
            SET {', '.join(updates)}
            WHERE id = ${param_count}
            RETURNING id, name, description, category, block_type, template_data,
                      is_system, is_active, created_by, created_at, updated_at
        """

        row = await conn.fetchrow(query, *params)

        return BlockTemplate(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            category=row['category'],
            block_type=row['block_type'],
            template_data=row['template_data'],
            is_system=row['is_system'],
            is_active=row['is_active']
        )

@router.delete("/templates/{template_id}")
async def delete_block_template(
    template_id: UUID,
    current_user = Depends(get_current_user)
):
    """Delete a block template (only non-system templates by their creator)."""

    query = """
        DELETE FROM block_templates
        WHERE id = $1 AND is_system = false AND created_by = $2
        RETURNING id
    """

    async with get_database_connection() as conn:
        result = await conn.fetchrow(query, template_id, current_user.id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Block template not found or cannot be deleted"
            )

        return {"message": "Block template deleted successfully"}

# Content mode management
@router.put("/content/{content_id}/mode")
async def update_content_mode(
    content_id: UUID,
    mode_update: ContentModeUpdate,
    current_user = Depends(get_current_user)
):
    """Update the editor mode for a content document."""

    # Verify user owns the content
    check_query = """
        SELECT id FROM content
        WHERE id = $1 AND user_id = $2
    """

    async with get_database_connection() as conn:
        existing = await conn.fetchrow(check_query, content_id, current_user.id)

        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content not found"
            )

        # Update the editor mode
        update_query = """
            UPDATE content
            SET editor_mode = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING editor_mode
        """

        result = await conn.fetchrow(update_query, mode_update.editor_mode, content_id)

        return {"editor_mode": result['editor_mode'], "message": "Editor mode updated successfully"}

# Block analytics
@router.get("/analytics", response_model=BlockAnalytics)
async def get_block_analytics(
    current_user = Depends(get_current_user)
):
    """Get analytics about block usage for the current user."""

    async with get_database_connection() as conn:
        # Get overall stats
        stats_query = """
            SELECT
                COUNT(*) as total_documents,
                COALESCE(SUM(block_count), 0) as total_blocks,
                COALESCE(AVG(block_count), 0) as avg_blocks_per_document
            FROM content
            WHERE user_id = $1
        """

        stats = await conn.fetchrow(stats_query, current_user.id)

        # Get block type distribution
        distribution_query = """
            SELECT
                block_type,
                COUNT(*) as count
            FROM content c
            CROSS JOIN unnest(c.block_types) as block_type
            WHERE c.user_id = $1 AND c.block_types IS NOT NULL
            GROUP BY block_type
            ORDER BY count DESC
        """

        distribution = await conn.fetch(distribution_query, current_user.id)

        # Get popular templates (system templates usage)
        templates_query = """
            SELECT
                bt.name,
                bt.category,
                bt.block_type,
                COUNT(*) as usage_count
            FROM block_templates bt
            INNER JOIN content c ON c.block_types @> ARRAY[bt.block_type]
            WHERE c.user_id = $1 AND bt.is_system = true
            GROUP BY bt.id, bt.name, bt.category, bt.block_type
            ORDER BY usage_count DESC
            LIMIT 10
        """

        templates = await conn.fetch(templates_query, current_user.id)

        return BlockAnalytics(
            total_documents=stats['total_documents'],
            total_blocks=stats['total_blocks'],
            avg_blocks_per_document=float(stats['avg_blocks_per_document']),
            block_type_distribution={row['block_type']: row['count'] for row in distribution},
            popular_templates=[
                {
                    "name": row['name'],
                    "category": row['category'],
                    "block_type": row['block_type'],
                    "usage_count": row['usage_count']
                }
                for row in templates
            ]
        )

# Block conversion utilities
@router.post("/content/{content_id}/convert-to-blocks")
async def convert_content_to_blocks(
    content_id: UUID,
    current_user = Depends(get_current_user)
):
    """Convert rich-text content to block-based format."""

    # This is a placeholder for future implementation
    # Would analyze existing content and suggest block conversions

    query = """
        SELECT id, content, editor_mode
        FROM content
        WHERE id = $1 AND user_id = $2
    """

    async with get_database_connection() as conn:
        content = await conn.fetchrow(query, content_id, current_user.id)

        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content not found"
            )

        if content['editor_mode'] == 'blocks':
            return {"message": "Content is already in block format"}

        # TODO: Implement actual conversion logic
        # For now, just change the mode
        await conn.execute(
            "UPDATE content SET editor_mode = 'blocks', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            content_id
        )

        return {
            "message": "Content converted to block format",
            "suggestions": [
                "Consider converting trade mentions to Trade Entry blocks",
                "Strategy discussions could become Strategy Template blocks",
                "Performance data could become Performance Summary blocks"
            ]
        }