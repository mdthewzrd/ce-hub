"""
Trading Context Learning Models

Database models for storing user-specific trading context, corrections,
and learning patterns to improve Renata AI's understanding over time.
"""

from sqlalchemy import Column, String, Text, JSON, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


class UserTradingProfile(Base):
    """
    Stores user-specific trading context and learned vocabulary

    This table maintains the personalized trading context that Renata
    learns about each user over time.
    """
    __tablename__ = "user_trading_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(50), unique=True, nullable=False, index=True)

    # Trading Context Fields
    trading_instruments = Column(JSON, nullable=True, comment="User's preferred trading instruments")
    trading_strategies = Column(JSON, nullable=True, comment="User's trading strategies and methodologies")
    risk_preferences = Column(JSON, nullable=True, comment="Risk management preferences and limits")
    terminology_preferences = Column(JSON, nullable=True, comment="User's preferred trading terminology")

    # Learning Metrics
    total_corrections = Column(Integer, default=0, comment="Total number of corrections made by user")
    learning_confidence = Column(Float, default=0.0, comment="AI confidence in understanding user context")
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    corrections = relationship("TradingContextCorrection", back_populates="user_profile")
    feedback_sessions = relationship("UserFeedbackSession", back_populates="user_profile")


class TradingTerminology(Base):
    """
    Stores user-specific trading terminology and definitions

    Maps user's preferred terms to standard trading concepts,
    enabling personalized communication.
    """
    __tablename__ = "trading_terminology"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(50), nullable=False, index=True)

    # Terminology Fields
    user_term = Column(String(100), nullable=False, comment="User's preferred term")
    standard_term = Column(String(100), nullable=False, comment="Standard trading term")
    context = Column(Text, nullable=True, comment="Context where this term is used")
    confidence = Column(Float, default=1.0, comment="Confidence in this mapping")

    # Metadata
    learned_from = Column(String(50), nullable=True, comment="How this was learned (correction, conversation, etc.)")
    usage_count = Column(Integer, default=0, comment="How often this term mapping is used")
    last_used = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TradingContextCorrection(Base):
    """
    Stores corrections when Renata misunderstands trading context

    This is the core feedback table that captures when users correct
    Renata's misunderstanding of trading terms or concepts.
    """
    __tablename__ = "trading_context_corrections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_profile_id = Column(UUID(as_uuid=True), ForeignKey("user_trading_profiles.id"), nullable=False)

    # Original Context
    original_user_input = Column(Text, nullable=False, comment="What the user originally said")
    renata_interpretation = Column(Text, nullable=True, comment="How Renata interpreted it")
    renata_response = Column(Text, nullable=True, comment="Renata's response")

    # Correction Details
    user_correction = Column(Text, nullable=False, comment="User's correction/clarification")
    correction_type = Column(String(50), nullable=False, comment="Type: terminology, context, strategy, etc.")
    trading_concept = Column(String(100), nullable=True, comment="Which trading concept was misunderstood")

    # Learning Metadata
    conversation_context = Column(JSON, nullable=True, comment="Full conversation context")
    ui_context = Column(JSON, nullable=True, comment="UI state when correction happened")
    applied_to_user_profile = Column(Boolean, default=False, comment="Whether correction was applied to profile")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user_profile = relationship("UserTradingProfile", back_populates="corrections")


class UserFeedbackSession(Base):
    """
    Tracks user feedback sessions and response quality

    Captures when users provide explicit feedback (👍/👎/🔧) on Renata's responses
    to track improvement over time.
    """
    __tablename__ = "user_feedback_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_profile_id = Column(UUID(as_uuid=True), ForeignKey("user_trading_profiles.id"), nullable=False)

    # Feedback Context
    user_query = Column(Text, nullable=False, comment="User's original question/request")
    renata_response = Column(Text, nullable=False, comment="Renata's response")
    feedback_type = Column(String(20), nullable=False, comment="thumbs_up, thumbs_down, fix_understanding")

    # Specific Feedback
    feedback_details = Column(Text, nullable=True, comment="Detailed feedback from user")
    improvement_suggestions = Column(Text, nullable=True, comment="User suggestions for improvement")

    # Context and Metadata
    trading_context = Column(JSON, nullable=True, comment="Trading context at time of feedback")
    conversation_history = Column(JSON, nullable=True, comment="Recent conversation history")
    renata_mode = Column(String(20), nullable=False, comment="analyst, coach, or mentor")

    # Quality Metrics
    response_relevance = Column(Integer, nullable=True, comment="User-rated relevance (1-5)")
    terminology_accuracy = Column(Integer, nullable=True, comment="User-rated terminology accuracy (1-5)")
    actionability = Column(Integer, nullable=True, comment="User-rated actionability (1-5)")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user_profile = relationship("UserTradingProfile", back_populates="feedback_sessions")


class LearningPattern(Base):
    """
    Stores identified patterns from user corrections and feedback

    AI-generated patterns that emerge from user feedback to improve
    future responses for this user and potentially other users.
    """
    __tablename__ = "learning_patterns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(50), nullable=False, index=True)

    # Pattern Details
    pattern_type = Column(String(50), nullable=False, comment="terminology, strategy, risk, psychology, etc.")
    pattern_description = Column(Text, nullable=False, comment="Description of the identified pattern")
    trigger_conditions = Column(JSON, nullable=False, comment="When this pattern should be applied")
    response_modifications = Column(JSON, nullable=False, comment="How to modify responses")

    # Pattern Metadata
    confidence_score = Column(Float, default=0.0, comment="Confidence in this pattern")
    supporting_corrections = Column(JSON, nullable=True, comment="Correction IDs that support this pattern")
    usage_count = Column(Integer, default=0, comment="How often this pattern has been applied")
    success_rate = Column(Float, default=0.0, comment="Success rate when pattern is applied")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_applied = Column(DateTime, nullable=True)


class ConversationEffectiveness(Base):
    """
    Tracks conversation effectiveness metrics over time

    Measures how well Renata understands and responds to each user
    to track learning progress.
    """
    __tablename__ = "conversation_effectiveness"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(50), nullable=False, index=True)

    # Time Period
    measurement_period = Column(String(20), nullable=False, comment="daily, weekly, monthly")
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)

    # Effectiveness Metrics
    total_interactions = Column(Integer, default=0)
    positive_feedback_count = Column(Integer, default=0)
    negative_feedback_count = Column(Integer, default=0)
    corrections_needed = Column(Integer, default=0)

    # Calculated Metrics
    understanding_accuracy = Column(Float, default=0.0, comment="% of interactions understood correctly")
    response_satisfaction = Column(Float, default=0.0, comment="Average user satisfaction score")
    learning_velocity = Column(Float, default=0.0, comment="Rate of improvement over time")

    # Context Categories
    terminology_accuracy = Column(Float, default=0.0)
    strategy_understanding = Column(Float, default=0.0)
    risk_comprehension = Column(Float, default=0.0)
    psychology_insights = Column(Float, default=0.0)

    # Timestamps
    calculated_at = Column(DateTime, default=datetime.utcnow)


# Database initialization and utilities
def create_learning_tables(engine):
    """Create all learning-related tables"""
    Base.metadata.create_all(bind=engine)


def get_or_create_user_profile(session, user_id: str) -> UserTradingProfile:
    """Get existing user profile or create new one"""
    profile = session.query(UserTradingProfile).filter_by(user_id=user_id).first()

    if not profile:
        profile = UserTradingProfile(
            user_id=user_id,
            trading_instruments=[],
            trading_strategies=[],
            risk_preferences={},
            terminology_preferences={}
        )
        session.add(profile)
        session.commit()

    return profile


# Example queries for common learning operations
class LearningQueries:
    """Common queries for trading context learning"""

    @staticmethod
    def get_user_terminology(session, user_id: str) -> dict:
        """Get user's preferred terminology mappings"""
        terms = session.query(TradingTerminology).filter_by(user_id=user_id).all()
        return {term.user_term: term.standard_term for term in terms}

    @staticmethod
    def get_recent_corrections(session, user_id: str, limit: int = 10):
        """Get user's recent corrections for learning"""
        profile = session.query(UserTradingProfile).filter_by(user_id=user_id).first()
        if not profile:
            return []

        return (session.query(TradingContextCorrection)
               .filter_by(user_profile_id=profile.id)
               .order_by(TradingContextCorrection.created_at.desc())
               .limit(limit)
               .all())

    @staticmethod
    def get_learning_patterns(session, user_id: str, pattern_type: str = None):
        """Get applicable learning patterns for user"""
        query = session.query(LearningPattern).filter_by(user_id=user_id)

        if pattern_type:
            query = query.filter_by(pattern_type=pattern_type)

        return query.filter(LearningPattern.confidence_score > 0.6).all()

    @staticmethod
    def calculate_learning_effectiveness(session, user_id: str, days: int = 7):
        """Calculate recent learning effectiveness metrics"""
        from datetime import datetime, timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Get recent feedback
        profile = session.query(UserTradingProfile).filter_by(user_id=user_id).first()
        if not profile:
            return None

        recent_feedback = (session.query(UserFeedbackSession)
                          .filter_by(user_profile_id=profile.id)
                          .filter(UserFeedbackSession.created_at >= cutoff_date)
                          .all())

        if not recent_feedback:
            return None

        positive_count = sum(1 for f in recent_feedback if f.feedback_type == 'thumbs_up')
        total_count = len(recent_feedback)
        corrections_count = sum(1 for f in recent_feedback if f.feedback_type == 'fix_understanding')

        return {
            "understanding_accuracy": positive_count / total_count if total_count > 0 else 0,
            "correction_rate": corrections_count / total_count if total_count > 0 else 0,
            "total_interactions": total_count,
            "period_days": days
        }