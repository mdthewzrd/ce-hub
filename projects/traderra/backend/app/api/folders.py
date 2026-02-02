"""
Traderra Folder Management System - FastAPI Router

RESTful API endpoints for folder and content management.
Provides comprehensive CRUD operations with hierarchy support.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query, Path
from fastapi.responses import JSONResponse
import asyncpg
import logging

from ..models.folder_models import (
    Folder,
    FolderCreate,
    FolderUpdate,
    FolderMove,
    FolderWithChildren,
    FolderTreeResponse,
    FolderStatsResponse,
    ContentItem,
    ContentItemCreate,
    ContentItemUpdate,
    ContentItemMove,
    BulkContentMove,
    ContentItemWithFolder,
    ContentItemListResponse,
    ContentType,
    TradeEntryCreate,
    DocumentCreate
)
from ..core.dependencies import get_database_connection
from ..core.archon_client import get_archon_client

router = APIRouter(prefix="/api/folders", tags=["folders"])
logger = logging.getLogger(__name__)


# =============================================
# FOLDER ENDPOINTS
# =============================================

@router.post("/", response_model=Folder, status_code=201)
async def create_folder(
    folder_data: FolderCreate,
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Create a new folder

    Args:
        folder_data: Folder creation data

    Returns:
        Created folder

    Raises:
        HTTPException: If parent folder doesn't exist or database error
    """
    try:
        # Validate parent folder exists if specified
        if folder_data.parent_id:
            parent_exists = await db.fetchval(
                "SELECT EXISTS(SELECT 1 FROM folders WHERE id = $1 AND user_id = $2)",
                folder_data.parent_id, folder_data.user_id
            )
            if not parent_exists:
                raise HTTPException(
                    status_code=404,
                    detail=f"Parent folder {folder_data.parent_id} not found"
                )

        # Create folder
        folder_id = await db.fetchval(
            """
            INSERT INTO folders (name, parent_id, user_id, icon, color, position)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            """,
            folder_data.name,
            folder_data.parent_id,
            folder_data.user_id,
            folder_data.icon.value,
            folder_data.color,
            folder_data.position
        )

        # Fetch and return created folder
        folder_row = await db.fetchrow(
            "SELECT * FROM folders WHERE id = $1",
            folder_id
        )

        return Folder(**dict(folder_row))

    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="A folder with this name already exists in the parent folder"
        )
    except Exception as e:
        logger.error(f"Error creating folder: {e}")
        raise HTTPException(status_code=500, detail="Failed to create folder")


@router.get("/", response_model=List[Folder])
async def list_folders(
    user_id: str = Query(..., description="User ID"),
    parent_id: Optional[UUID] = Query(None, description="Parent folder ID"),
    include_content_count: bool = Query(True, description="Include content counts"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    List folders for a user

    Args:
        user_id: User ID
        parent_id: Optional parent folder filter
        include_content_count: Whether to include content counts

    Returns:
        List of folders
    """
    try:
        if include_content_count:
            query = """
            SELECT f.*, COALESCE(cc.content_count, 0) as content_count
            FROM folders f
            LEFT JOIN (
                SELECT folder_id, COUNT(*) as content_count
                FROM content_items
                GROUP BY folder_id
            ) cc ON f.id = cc.folder_id
            WHERE f.user_id = $1
            """
            params = [user_id]
        else:
            query = "SELECT * FROM folders WHERE user_id = $1"
            params = [user_id]

        if parent_id is not None:
            query += f" AND parent_id = ${len(params) + 1}"
            params.append(parent_id)
        else:
            query += " AND parent_id IS NULL"

        query += " ORDER BY position, name"

        rows = await db.fetch(query, *params)
        return [Folder(**dict(row)) for row in rows]

    except Exception as e:
        logger.error(f"Error listing folders: {e}")
        raise HTTPException(status_code=500, detail="Failed to list folders")


@router.get("/tree", response_model=FolderTreeResponse)
async def get_folder_tree(
    user_id: str = Query(..., description="User ID"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Get complete folder tree for a user

    Args:
        user_id: User ID

    Returns:
        Hierarchical folder tree with content counts
    """
    try:
        # Use the folder_tree_view
        rows = await db.fetch(
            "SELECT * FROM folder_tree_view WHERE user_id = $1 ORDER BY sort_path",
            user_id
        )

        # Build tree structure
        folder_map = {}
        root_folders = []

        for row in rows:
            folder_dict = dict(row)
            folder = FolderWithChildren(**folder_dict)
            folder_map[folder.id] = folder

            if folder.parent_id is None:
                root_folders.append(folder)

        # Build parent-child relationships
        for folder in folder_map.values():
            if folder.parent_id and folder.parent_id in folder_map:
                folder_map[folder.parent_id].children.append(folder)

        # Count total content items
        total_content = await db.fetchval(
            "SELECT COUNT(*) FROM content_items WHERE user_id = $1",
            user_id
        )

        return FolderTreeResponse(
            folders=root_folders,
            total_folders=len(folder_map),
            total_content_items=total_content or 0
        )

    except Exception as e:
        logger.error(f"Error getting folder tree: {e}")
        raise HTTPException(status_code=500, detail="Failed to get folder tree")


@router.get("/{folder_id}", response_model=Folder)
async def get_folder(
    folder_id: UUID = Path(..., description="Folder ID"),
    user_id: str = Query(..., description="User ID"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Get a specific folder

    Args:
        folder_id: Folder ID
        user_id: User ID for authorization

    Returns:
        Folder details
    """
    try:
        folder_row = await db.fetchrow(
            "SELECT * FROM folders WHERE id = $1 AND user_id = $2",
            folder_id, user_id
        )

        if not folder_row:
            raise HTTPException(status_code=404, detail="Folder not found")

        return Folder(**dict(folder_row))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting folder: {e}")
        raise HTTPException(status_code=500, detail="Failed to get folder")


@router.put("/{folder_id}", response_model=Folder)
async def update_folder(
    folder_id: UUID = Path(..., description="Folder ID"),
    folder_data: FolderUpdate = ...,
    user_id: str = Query(..., description="User ID"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Update a folder

    Args:
        folder_id: Folder ID
        folder_data: Update data
        user_id: User ID for authorization

    Returns:
        Updated folder
    """
    try:
        # Check folder exists and user has access
        folder_exists = await db.fetchval(
            "SELECT EXISTS(SELECT 1 FROM folders WHERE id = $1 AND user_id = $2)",
            folder_id, user_id
        )
        if not folder_exists:
            raise HTTPException(status_code=404, detail="Folder not found")

        # Validate parent folder if changing
        if folder_data.parent_id is not None:
            if folder_data.parent_id == folder_id:
                raise HTTPException(
                    status_code=400,
                    detail="Folder cannot be its own parent"
                )

            parent_exists = await db.fetchval(
                "SELECT EXISTS(SELECT 1 FROM folders WHERE id = $1 AND user_id = $2)",
                folder_data.parent_id, user_id
            )
            if not parent_exists:
                raise HTTPException(
                    status_code=404,
                    detail="Parent folder not found"
                )

        # Build update query
        update_fields = []
        params = []
        param_count = 1

        for field, value in folder_data.dict(exclude_unset=True).items():
            if field == "icon" and value:
                value = value.value
            update_fields.append(f"{field} = ${param_count}")
            params.append(value)
            param_count += 1

        if not update_fields:
            # No updates provided, return current folder
            folder_row = await db.fetchrow(
                "SELECT * FROM folders WHERE id = $1",
                folder_id
            )
            return Folder(**dict(folder_row))

        # Add updated_at
        update_fields.append(f"updated_at = ${param_count}")
        params.append(datetime.utcnow())
        param_count += 1

        # Add WHERE clause params
        params.extend([folder_id, user_id])

        query = f"""
        UPDATE folders
        SET {', '.join(update_fields)}
        WHERE id = ${param_count - 1} AND user_id = ${param_count}
        RETURNING *
        """

        folder_row = await db.fetchrow(query, *params)
        return Folder(**dict(folder_row))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating folder: {e}")
        raise HTTPException(status_code=500, detail="Failed to update folder")


@router.post("/{folder_id}/move", response_model=Folder)
async def move_folder(
    folder_id: UUID = Path(..., description="Folder ID"),
    move_data: FolderMove = ...,
    user_id: str = Query(..., description="User ID"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Move a folder to a new parent or position

    Args:
        folder_id: Folder ID
        move_data: Move operation data
        user_id: User ID for authorization

    Returns:
        Updated folder
    """
    try:
        # Use update folder endpoint with move data
        folder_update = FolderUpdate(
            parent_id=move_data.new_parent_id,
            position=move_data.new_position
        )

        return await update_folder(folder_id, folder_update, user_id, db)

    except Exception as e:
        logger.error(f"Error moving folder: {e}")
        raise HTTPException(status_code=500, detail="Failed to move folder")


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: UUID = Path(..., description="Folder ID"),
    user_id: str = Query(..., description="User ID"),
    force: bool = Query(False, description="Force delete non-empty folder"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Delete a folder

    Args:
        folder_id: Folder ID
        user_id: User ID for authorization
        force: Force delete even if folder has content

    Returns:
        Success message
    """
    try:
        # Check folder exists
        folder_row = await db.fetchrow(
            "SELECT * FROM folders WHERE id = $1 AND user_id = $2",
            folder_id, user_id
        )
        if not folder_row:
            raise HTTPException(status_code=404, detail="Folder not found")

        # Check if folder has content or children
        if not force:
            content_count = await db.fetchval(
                "SELECT COUNT(*) FROM content_items WHERE folder_id = $1",
                folder_id
            )
            children_count = await db.fetchval(
                "SELECT COUNT(*) FROM folders WHERE parent_id = $1",
                folder_id
            )

            if content_count > 0 or children_count > 0:
                raise HTTPException(
                    status_code=409,
                    detail="Folder is not empty. Use force=true to delete"
                )

        # Delete folder (CASCADE will handle children and content)
        await db.execute(
            "DELETE FROM folders WHERE id = $1 AND user_id = $2",
            folder_id, user_id
        )

        return {"message": "Folder deleted successfully", "folder_id": str(folder_id)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting folder: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete folder")


@router.get("/{folder_id}/stats", response_model=FolderStatsResponse)
async def get_folder_stats(
    folder_id: UUID = Path(..., description="Folder ID"),
    user_id: str = Query(..., description="User ID"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Get folder statistics and recent activity

    Args:
        folder_id: Folder ID
        user_id: User ID for authorization

    Returns:
        Folder statistics
    """
    try:
        # Get folder info
        folder_row = await db.fetchrow(
            "SELECT * FROM folders WHERE id = $1 AND user_id = $2",
            folder_id, user_id
        )
        if not folder_row:
            raise HTTPException(status_code=404, detail="Folder not found")

        # Get content count by type
        content_types = await db.fetch(
            """
            SELECT type, COUNT(*) as count
            FROM content_items
            WHERE folder_id = $1
            GROUP BY type
            """,
            folder_id
        )

        # Get recent activity
        recent_items = await db.fetch(
            """
            SELECT * FROM content_items
            WHERE folder_id = $1
            ORDER BY updated_at DESC
            LIMIT 5
            """,
            folder_id
        )

        # Get all tags
        tags_result = await db.fetchval(
            """
            SELECT array_agg(DISTINCT tag)
            FROM content_items, unnest(tags) as tag
            WHERE folder_id = $1
            """,
            folder_id
        )

        return FolderStatsResponse(
            folder_id=folder_id,
            folder_name=folder_row['name'],
            content_count=sum(row['count'] for row in content_types),
            content_types={row['type']: row['count'] for row in content_types},
            recent_activity=[ContentItem(**dict(row)) for row in recent_items],
            tags=tags_result or []
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting folder stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get folder stats")


# =============================================
# CONTENT ITEM ENDPOINTS
# =============================================

@router.post("/content", response_model=ContentItem, status_code=201)
async def create_content_item(
    content_data: ContentItemCreate,
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Create a new content item

    Args:
        content_data: Content creation data

    Returns:
        Created content item
    """
    try:
        # Validate folder exists if specified
        if content_data.folder_id:
            folder_exists = await db.fetchval(
                "SELECT EXISTS(SELECT 1 FROM folders WHERE id = $1 AND user_id = $2)",
                content_data.folder_id, content_data.user_id
            )
            if not folder_exists:
                raise HTTPException(
                    status_code=404,
                    detail=f"Folder {content_data.folder_id} not found"
                )

        # Create content item
        content_id = await db.fetchval(
            """
            INSERT INTO content_items (folder_id, type, title, content, metadata, tags, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
            """,
            content_data.folder_id,
            content_data.type.value,
            content_data.title,
            content_data.content,
            content_data.metadata,
            content_data.tags,
            content_data.user_id
        )

        # Fetch and return created content item
        content_row = await db.fetchrow(
            "SELECT * FROM content_items WHERE id = $1",
            content_id
        )

        return ContentItem(**dict(content_row))

    except Exception as e:
        logger.error(f"Error creating content item: {e}")
        raise HTTPException(status_code=500, detail="Failed to create content item")


@router.post("/content/trade-entry", response_model=ContentItem, status_code=201)
async def create_trade_entry(
    trade_data: TradeEntryCreate,
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Create a new trade entry (specialized content item)

    Args:
        trade_data: Trade entry data

    Returns:
        Created trade entry as content item
    """
    # Convert to standard content item and create
    content_data = ContentItemCreate(**trade_data.dict())
    return await create_content_item(content_data, db)


@router.get("/content", response_model=ContentItemListResponse)
async def list_content_items(
    user_id: str = Query(..., description="User ID"),
    folder_id: Optional[UUID] = Query(None, description="Folder ID filter"),
    type: Optional[ContentType] = Query(None, description="Content type filter"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    tags: Optional[List[str]] = Query(None, description="Tag filters"),
    limit: int = Query(50, ge=1, le=1000, description="Result limit"),
    offset: int = Query(0, ge=0, description="Result offset"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    List content items with filters

    Args:
        user_id: User ID
        folder_id: Optional folder filter
        type: Optional content type filter
        search: Optional search term
        tags: Optional tag filters
        limit: Result limit
        offset: Result offset

    Returns:
        Paginated content items with folder information
    """
    try:
        # Build query
        where_conditions = ["ci.user_id = $1"]
        params = [user_id]
        param_count = 2

        if folder_id is not None:
            where_conditions.append(f"ci.folder_id = ${param_count}")
            params.append(folder_id)
            param_count += 1

        if type is not None:
            where_conditions.append(f"ci.type = ${param_count}")
            params.append(type.value)
            param_count += 1

        if search:
            where_conditions.append(f"(ci.title ILIKE ${param_count} OR ci.content::text ILIKE ${param_count})")
            params.append(f"%{search}%")
            param_count += 1

        if tags:
            where_conditions.append(f"ci.tags && ${param_count}")
            params.append(tags)
            param_count += 1

        where_clause = " AND ".join(where_conditions)

        # Get total count
        count_query = f"""
        SELECT COUNT(*)
        FROM content_items ci
        WHERE {where_clause}
        """
        total = await db.fetchval(count_query, *params)

        # Get items with folder info
        items_query = f"""
        SELECT ci.*, f.name as folder_name, f.icon as folder_icon, f.color as folder_color
        FROM content_items ci
        LEFT JOIN folders f ON ci.folder_id = f.id
        WHERE {where_clause}
        ORDER BY ci.updated_at DESC
        LIMIT ${param_count} OFFSET ${param_count + 1}
        """
        params.extend([limit, offset])

        rows = await db.fetch(items_query, *params)
        items = [ContentItemWithFolder(**dict(row)) for row in rows]

        return ContentItemListResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
            has_more=offset + limit < total
        )

    except Exception as e:
        logger.error(f"Error listing content items: {e}")
        raise HTTPException(status_code=500, detail="Failed to list content items")


@router.get("/content/{content_id}", response_model=ContentItemWithFolder)
async def get_content_item(
    content_id: UUID = Path(..., description="Content ID"),
    user_id: str = Query(..., description="User ID"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Get a specific content item

    Args:
        content_id: Content ID
        user_id: User ID for authorization

    Returns:
        Content item with folder information
    """
    try:
        content_row = await db.fetchrow(
            """
            SELECT ci.*, f.name as folder_name, f.icon as folder_icon, f.color as folder_color
            FROM content_items ci
            LEFT JOIN folders f ON ci.folder_id = f.id
            WHERE ci.id = $1 AND ci.user_id = $2
            """,
            content_id, user_id
        )

        if not content_row:
            raise HTTPException(status_code=404, detail="Content item not found")

        return ContentItemWithFolder(**dict(content_row))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting content item: {e}")
        raise HTTPException(status_code=500, detail="Failed to get content item")


@router.put("/content/{content_id}", response_model=ContentItem)
async def update_content_item(
    content_id: UUID = Path(..., description="Content ID"),
    content_data: ContentItemUpdate = ...,
    user_id: str = Query(..., description="User ID"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Update a content item

    Args:
        content_id: Content ID
        content_data: Update data
        user_id: User ID for authorization

    Returns:
        Updated content item
    """
    try:
        # Check content exists and user has access
        content_exists = await db.fetchval(
            "SELECT EXISTS(SELECT 1 FROM content_items WHERE id = $1 AND user_id = $2)",
            content_id, user_id
        )
        if not content_exists:
            raise HTTPException(status_code=404, detail="Content item not found")

        # Validate folder if changing
        if content_data.folder_id is not None:
            folder_exists = await db.fetchval(
                "SELECT EXISTS(SELECT 1 FROM folders WHERE id = $1 AND user_id = $2)",
                content_data.folder_id, user_id
            )
            if not folder_exists:
                raise HTTPException(
                    status_code=404,
                    detail="Target folder not found"
                )

        # Build update query
        update_fields = []
        params = []
        param_count = 1

        for field, value in content_data.dict(exclude_unset=True).items():
            update_fields.append(f"{field} = ${param_count}")
            params.append(value)
            param_count += 1

        if not update_fields:
            # No updates provided, return current content
            content_row = await db.fetchrow(
                "SELECT * FROM content_items WHERE id = $1",
                content_id
            )
            return ContentItem(**dict(content_row))

        # Add updated_at
        update_fields.append(f"updated_at = ${param_count}")
        params.append(datetime.utcnow())
        param_count += 1

        # Add WHERE clause params
        params.extend([content_id, user_id])

        query = f"""
        UPDATE content_items
        SET {', '.join(update_fields)}
        WHERE id = ${param_count - 1} AND user_id = ${param_count}
        RETURNING *
        """

        content_row = await db.fetchrow(query, *params)
        return ContentItem(**dict(content_row))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating content item: {e}")
        raise HTTPException(status_code=500, detail="Failed to update content item")


@router.post("/content/{content_id}/move", response_model=ContentItem)
async def move_content_item(
    content_id: UUID = Path(..., description="Content ID"),
    move_data: ContentItemMove = ...,
    user_id: str = Query(..., description="User ID"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Move a content item to a different folder

    Args:
        content_id: Content ID
        move_data: Move operation data
        user_id: User ID for authorization

    Returns:
        Updated content item
    """
    try:
        content_update = ContentItemUpdate(folder_id=move_data.folder_id)
        return await update_content_item(content_id, content_update, user_id, db)

    except Exception as e:
        logger.error(f"Error moving content item: {e}")
        raise HTTPException(status_code=500, detail="Failed to move content item")


@router.post("/content/bulk-move")
async def bulk_move_content_items(
    move_data: BulkContentMove = ...,
    user_id: str = Query(..., description="User ID"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Move multiple content items to a folder

    Args:
        move_data: Bulk move operation data
        user_id: User ID for authorization

    Returns:
        Success message with count
    """
    try:
        # Validate folder exists if specified
        if move_data.folder_id:
            folder_exists = await db.fetchval(
                "SELECT EXISTS(SELECT 1 FROM folders WHERE id = $1 AND user_id = $2)",
                move_data.folder_id, user_id
            )
            if not folder_exists:
                raise HTTPException(
                    status_code=404,
                    detail="Target folder not found"
                )

        # Update content items
        result = await db.execute(
            """
            UPDATE content_items
            SET folder_id = $1, updated_at = NOW()
            WHERE id = ANY($2) AND user_id = $3
            """,
            move_data.folder_id,
            move_data.content_item_ids,
            user_id
        )

        # Extract count from result
        moved_count = int(result.split()[-1]) if result else 0

        return {
            "message": f"Successfully moved {moved_count} content items",
            "moved_count": moved_count,
            "target_folder_id": str(move_data.folder_id) if move_data.folder_id else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error bulk moving content items: {e}")
        raise HTTPException(status_code=500, detail="Failed to move content items")


@router.delete("/content/{content_id}")
async def delete_content_item(
    content_id: UUID = Path(..., description="Content ID"),
    user_id: str = Query(..., description="User ID"),
    db: asyncpg.Connection = Depends(get_database_connection)
):
    """
    Delete a content item

    Args:
        content_id: Content ID
        user_id: User ID for authorization

    Returns:
        Success message
    """
    try:
        # Check content exists
        content_row = await db.fetchrow(
            "SELECT * FROM content_items WHERE id = $1 AND user_id = $2",
            content_id, user_id
        )
        if not content_row:
            raise HTTPException(status_code=404, detail="Content item not found")

        # Delete content item
        await db.execute(
            "DELETE FROM content_items WHERE id = $1 AND user_id = $2",
            content_id, user_id
        )

        return {
            "message": "Content item deleted successfully",
            "content_id": str(content_id)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting content item: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete content item")