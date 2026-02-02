"""
Traderra Folder Management System - Pydantic Models

Comprehensive data models for folder and content management system.
Supports hierarchical folder organization and multiple content types.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any, Union, Literal
from uuid import UUID
from pydantic import BaseModel, Field, validator
from enum import Enum


class ContentType(str, Enum):
    """Supported content types in the journal system"""
    TRADE_ENTRY = "trade_entry"
    DOCUMENT = "document"
    NOTE = "note"
    STRATEGY = "strategy"
    RESEARCH = "research"
    REVIEW = "review"


class FolderIcon(str, Enum):
    """Available folder icons (Lucide React icons)"""
    FOLDER = "folder"
    JOURNAL_TEXT = "journal-text"
    TRENDING_UP = "trending-up"
    TRENDING_DOWN = "trending-down"
    TARGET = "target"
    SEARCH = "search"
    STAR = "star"
    BOOKMARK = "bookmark"
    CALENDAR = "calendar"
    ARCHIVE = "archive"
    PIE_CHART = "pie-chart"
    BUILDING = "building"
    FILE_TEXT = "file-text"
    LIGHTBULB = "lightbulb"
    LAYERS = "layers"


# Base Models

class FolderBase(BaseModel):
    """Base folder model with common fields"""
    name: str = Field(..., min_length=1, max_length=255, description="Folder name")
    icon: FolderIcon = Field(default=FolderIcon.FOLDER, description="Folder icon")
    color: str = Field(default="#FFD700", pattern=r"^#[0-9A-Fa-f]{6}$", description="Folder color (hex)")
    position: int = Field(default=0, ge=0, description="Display position within parent")

    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Folder name cannot be empty or whitespace only')
        return v.strip()


class ContentItemBase(BaseModel):
    """Base content item model with common fields"""
    type: ContentType = Field(..., description="Content type")
    title: str = Field(..., min_length=1, max_length=255, description="Content title")
    content: Optional[Dict[str, Any]] = Field(default=None, description="Content data (JSON)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    tags: List[str] = Field(default_factory=list, description="Content tags")

    @validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Content title cannot be empty or whitespace only')
        return v.strip()

    @validator('tags')
    def validate_tags(cls, v):
        return [tag.strip().lower() for tag in v if tag.strip()]


# Create Models (for POST requests)

class FolderCreate(FolderBase):
    """Model for creating new folders"""
    parent_id: Optional[UUID] = Field(default=None, description="Parent folder ID")
    user_id: str = Field(..., description="User ID who owns the folder")


class ContentItemCreate(ContentItemBase):
    """Model for creating new content items"""
    folder_id: Optional[UUID] = Field(default=None, description="Parent folder ID")
    user_id: str = Field(..., description="User ID who owns the content")


# Update Models (for PUT/PATCH requests)

class FolderUpdate(BaseModel):
    """Model for updating folders"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    icon: Optional[FolderIcon] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    position: Optional[int] = Field(None, ge=0)
    parent_id: Optional[UUID] = None

    @validator('name')
    def validate_name(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Folder name cannot be empty or whitespace only')
        return v.strip() if v else v


class ContentItemUpdate(BaseModel):
    """Model for updating content items"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    folder_id: Optional[UUID] = None

    @validator('title')
    def validate_title(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Content title cannot be empty or whitespace only')
        return v.strip() if v else v

    @validator('tags')
    def validate_tags(cls, v):
        if v is not None:
            return [tag.strip().lower() for tag in v if tag.strip()]
        return v


# Response Models (for API responses)

class Folder(FolderBase):
    """Complete folder model for responses"""
    id: UUID
    parent_id: Optional[UUID]
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FolderWithChildren(Folder):
    """Folder model with nested children for tree responses"""
    children: List['FolderWithChildren'] = Field(default_factory=list)
    content_count: int = Field(default=0, description="Number of content items in this folder")


class ContentItem(ContentItemBase):
    """Complete content item model for responses"""
    id: UUID
    folder_id: Optional[UUID]
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContentItemWithFolder(ContentItem):
    """Content item with folder information"""
    folder_name: Optional[str] = None
    folder_icon: Optional[str] = None
    folder_color: Optional[str] = None


# Move/Organization Models

class FolderMove(BaseModel):
    """Model for moving folders"""
    new_parent_id: Optional[UUID] = Field(description="New parent folder ID (null for root)")
    new_position: Optional[int] = Field(default=None, ge=0, description="New position in parent")


class ContentItemMove(BaseModel):
    """Model for moving content items"""
    folder_id: Optional[UUID] = Field(description="New folder ID (null for root)")


class BulkContentMove(BaseModel):
    """Model for moving multiple content items"""
    content_item_ids: List[UUID] = Field(..., min_items=1)
    folder_id: Optional[UUID] = Field(description="Target folder ID")


# Query/Filter Models

class FolderQuery(BaseModel):
    """Query parameters for folder listing"""
    user_id: Optional[str] = None
    parent_id: Optional[UUID] = None
    include_children: bool = Field(default=False)
    include_content_count: bool = Field(default=True)


class ContentItemQuery(BaseModel):
    """Query parameters for content item listing"""
    user_id: Optional[str] = None
    folder_id: Optional[UUID] = None
    type: Optional[ContentType] = None
    tags: Optional[List[str]] = None
    search: Optional[str] = Field(None, description="Search in title and content")
    limit: int = Field(default=50, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)


# Response Collections

class FolderTreeResponse(BaseModel):
    """Response model for folder tree"""
    folders: List[FolderWithChildren]
    total_folders: int
    total_content_items: int


class ContentItemListResponse(BaseModel):
    """Response model for content item lists"""
    items: List[ContentItemWithFolder]
    total: int
    limit: int
    offset: int
    has_more: bool


class FolderStatsResponse(BaseModel):
    """Response model for folder statistics"""
    folder_id: UUID
    folder_name: str
    content_count: int
    content_types: Dict[str, int]
    recent_activity: List[ContentItem]
    tags: List[str]


# Trade Entry specific models (extending ContentItem)

class TradeEntryData(BaseModel):
    """Specific model for trade entry content"""
    symbol: str
    side: str  # "Long" or "Short"
    entry_price: float
    exit_price: Optional[float] = None
    quantity: Optional[int] = None
    pnl: Optional[float] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    emotion: Optional[str] = None
    category: Optional[str] = None  # "win" or "loss"
    setup_analysis: Optional[str] = None
    execution_notes: Optional[str] = None
    lessons_learned: Optional[str] = None


class TradeEntryCreate(ContentItemCreate):
    """Create model for trade entries"""
    type: Literal[ContentType.TRADE_ENTRY] = Field(default=ContentType.TRADE_ENTRY)
    trade_data: TradeEntryData

    def dict(self, **kwargs):
        data = super().dict(**kwargs)
        # Merge trade_data into content field
        data['content'] = {
            'trade_data': data.pop('trade_data'),
            'blocks': []  # Initialize empty blocks for rich text editor
        }
        return data


# Document specific models (for rich text content)

class DocumentBlock(BaseModel):
    """Single block in a document (rich text editor)"""
    id: Optional[str] = None
    type: str  # paragraph, heading, list, etc.
    data: Dict[str, Any]


class DocumentContent(BaseModel):
    """Document content structure"""
    version: str = Field(default="1.0")
    blocks: List[DocumentBlock] = Field(default_factory=list)


class DocumentCreate(ContentItemCreate):
    """Create model for documents"""
    type: Literal[ContentType.DOCUMENT] = Field(default=ContentType.DOCUMENT)
    document_content: DocumentContent

    def dict(self, **kwargs):
        data = super().dict(**kwargs)
        data['content'] = data.pop('document_content').dict()
        return data


# Enable forward references for recursive models
FolderWithChildren.model_rebuild()