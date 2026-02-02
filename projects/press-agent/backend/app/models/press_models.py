"""
Press Agent Database Models
SQLAlchemy models for all database tables
"""
from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey, Integer, JSON, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from ..core.database import Base


class Client(Base):
    """Client accounts who submit press requests"""
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    company = Column(String(255))
    phone = Column(String(50))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    brand_voices = relationship("BrandVoice", back_populates="client", cascade="all, delete-orphan")
    press_requests = relationship("PressRequest", back_populates="client", cascade="all, delete-orphan")


class BrandVoice(Base):
    """Brand voice profiles for clients"""
    __tablename__ = "brand_voices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False, index=True)

    # Voice characteristics stored as JSON
    tone = Column(JSONB, default=dict)  # {formal: 0.8, casual: 0.2, friendly: 0.6}
    style_keywords = Column(JSONB, default=list)  # ["innovative", "cutting-edge", "premium"]
    forbidden_phrases = Column(JSONB, default=list)  # ["world-class", "revolutionary"]
    example_texts = Column(JSONB, default=list)  # Array of example writings

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    client = relationship("Client", back_populates="brand_voices")


class MediaOutlet(Base):
    """Press catalog - media outlets with pricing and details"""
    __tablename__ = "media_outlets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    category = Column(String(100))  # tech, business, finance, health, etc.
    domain = Column(String(255))  # techcrunch.com
    audience_reach = Column(String(50))  # "1M+ monthly readers"

    # Pricing
    base_price = Column(Numeric(10, 2), nullable=False)  # Base submission cost
    expedited_price = Column(Numeric(10, 2))  # Expedited submission

    # Requirements
    word_count_min = Column(Integer, default=400)
    word_count_max = Column(Integer, default=800)
    requirements = Column(Text)  # Special requirements

    # Metadata
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    press_requests = relationship("PressRequest", secondary="request_outlets", back_populates="target_outlets")


class PressRequest(Base):
    """Incoming press release requests"""
    __tablename__ = "press_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False, index=True)

    # Status workflow
    status = Column(String(50), default="incoming", index=True)  # incoming, in_progress, ready_review, completed, cancelled

    # Request details from onboarding
    announcement_type = Column(String(100), nullable=False)  # product_launch, funding, hiring, etc.
    key_messages = Column(JSONB, default=list)  # ["Raised $10M Series A", "Expanding to EU markets"]
    quotes = Column(JSONB, default=list)  # [{"speaker": "CEO Name", "text": "..."}]
    target_date = Column(DateTime(timezone=True))  # Preferred release date

    # Budget and timeline
    budget_min = Column(Numeric(10, 2))
    budget_max = Column(Numeric(10, 2))
    deadline = Column(DateTime(timezone=True))

    # Additional context
    company_description = Column(Text)
    product_service_details = Column(Text)
    target_audience = Column(String(255))
    geographic_focus = Column(String(255))

    # Onboarding completion
    onboarding_complete = Column(Boolean, default=False)
    onboarding_data = Column(JSONB, default=dict)  # Full onboarding questionnaire results

    # Tracking
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    client = relationship("Client", back_populates="press_requests")
    press_releases = relationship("PressRelease", back_populates="request", cascade="all, delete-orphan")
    target_outlets = relationship("MediaOutlet", secondary="request_outlets", back_populates="press_requests")
    conversations = relationship("AgentConversation", back_populates="request", cascade="all, delete-orphan")


class PressRelease(Base):
    """Generated press releases with versioning"""
    __tablename__ = "press_releases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("press_requests.id"), nullable=False, index=True)

    # Content
    headline = Column(Text, nullable=False)
    subheadline = Column(Text)
    body_text = Column(Text, nullable=False)
    about_section = Column(Text)

    # Version tracking
    version = Column(Integer, default=1, index=True)
    parent_version_id = Column(UUID(as_uuid=True), ForeignKey("press_releases.id"))

    # Status
    status = Column(String(50), default="draft")  # draft, under_review, approved, rejected, delivered
    agent_type = Column(String(50))  # writer, editor

    # Quality metrics (from QA)
    quality_score = Column(Float)  # Overall 0-100
    plagiarism_score = Column(Float)  # 0-100 (lower is better)
    ai_detection_score = Column(Float)  # 0-100 (lower is better)
    ap_style_score = Column(Float)  # 0-100
    grammar_score = Column(Float)  # 0-100
    readability_score = Column(Float)  # 0-100

    # Metrics details
    quality_metrics = Column(JSONB, default=dict)  # Detailed breakdown

    # Token usage and cost tracking
    tokens_used = Column(Integer, default=0)
    cost_usd = Column(Numeric(10, 4), default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    request = relationship("PressRequest", back_populates="press_releases")
    qa_reports = relationship("QAReport", back_populates="press_release", cascade="all, delete-orphan")
    parent_version = relationship("PressRelease", remote_side=[id])


class QAReport(Base):
    """Quality check reports for press releases"""
    __tablename__ = "qa_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    press_release_id = Column(UUID(as_uuid=True), ForeignKey("press_releases.id"), nullable=False, index=True)

    # Check results
    check_type = Column(String(50))  # plagiarism, ai_detection, ap_style, grammar, readability
    passed = Column(Boolean, default=False)
    score = Column(Float)
    threshold = Column(Float)

    # Details
    details = Column(JSONB, default=dict)  # Issues found, suggestions, etc.
    suggestions = Column(JSONB, default=list)  # Actionable improvement suggestions

    # Agent info
    agent_version = Column(String(50))  # Agent model version
    checked_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    press_release = relationship("PressRelease", back_populates="qa_reports")


class AgentConversation(Base):
    """Chat history for agent learning and context"""
    __tablename__ = "agent_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("press_requests.id"), nullable=False, index=True)

    # Message
    agent_type = Column(String(50))  # onboarding, writer, editor, qa
    role = Column(String(20))  # user, assistant, system
    content = Column(Text, nullable=False)

    # Context
    tokens = Column(Integer)
    model = Column(String(100))

    # Feedback
    rating = Column(Integer)  # 1-5 if user rated
    feedback = Column(Text)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    request = relationship("PressRequest", back_populates="conversations")


class DeliveryLog(Base):
    """Press release delivery and submission tracking"""
    __tablename__ = "delivery_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    press_release_id = Column(UUID(as_uuid=True), ForeignKey("press_releases.id"), nullable=False)
    outlet_id = Column(UUID(as_uuid=True), ForeignKey("media_outlets.id"))

    # Delivery status
    status = Column(String(50), default="pending")  # pending, submitted, accepted, rejected, needs_revision
    submitted_at = Column(DateTime(timezone=True))
    responded_at = Column(DateTime(timezone=True))

    # Response details
    response_notes = Column(Text)
    revision_requested = Column(Boolean, default=False)
    revision_notes = Column(Text)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


# Association table for many-to-many relationship between PressRequest and MediaOutlet
from sqlalchemy import Table
request_outlets = Table(
    "request_outlets",
    Base.metadata,
    Column("request_id", UUID(as_uuid=True), ForeignKey("press_requests.id"), primary_key=True),
    Column("outlet_id", UUID(as_uuid=True), ForeignKey("media_outlets.id"), primary_key=True),
    Column("selected_at", DateTime(timezone=True), default=datetime.utcnow),
)
