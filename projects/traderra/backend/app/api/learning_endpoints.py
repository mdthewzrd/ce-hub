"""
Trading Context Learning API Endpoints

FastAPI endpoints for collecting user feedback, corrections, and managing
the trading context learning system for Renata AI.

These endpoints enable:
1. Collecting user feedback (👍/👎/🔧) on Renata's responses
2. Processing corrections when Renata misunderstands trading context
3. Retrieving user's learned trading context and terminology
4. Managing learning patterns and effectiveness metrics
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.dependencies import get_db, get_archon_client
from ..core.archon_client import ArchonClient
from ..ai.learning_engine import (
    TradingContextLearningEngine,
    FeedbackData,
    CorrectionData,
    create_learning_engine
)
from ..models.learning_models import LearningQueries

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/learning", tags=["Learning"])


# Request/Response Models
class UserFeedbackRequest(BaseModel):
    """Request for user feedback on Renata's response"""
    user_id: str = Field(description="User identifier")
    feedback_type: str = Field(description="thumbs_up, thumbs_down, or fix_understanding")
    user_query: str = Field(description="Original user question")
    renata_response: str = Field(description="Renata's response")
    feedback_details: Optional[str] = Field(None, description="Additional feedback details")
    improvement_suggestions: Optional[str] = Field(None, description="How to improve response")
    renata_mode: str = Field(description="analyst, coach, or mentor")
    trading_context: Optional[Dict[str, Any]] = Field(None, description="Trading context")


class UserCorrectionRequest(BaseModel):
    """Request for user correction of Renata's understanding"""
    user_id: str = Field(description="User identifier")
    original_user_input: str = Field(description="What user originally said")
    renata_interpretation: str = Field(description="How Renata interpreted it")
    renata_response: str = Field(description="Renata's response")
    user_correction: str = Field(description="User's correction/clarification")
    correction_type: str = Field(description="terminology, strategy, context, etc.")
    trading_concept: Optional[str] = Field(None, description="Trading concept that was misunderstood")


class TerminologyUpdateRequest(BaseModel):
    """Request to update user's preferred terminology"""
    user_id: str = Field(description="User identifier")
    user_term: str = Field(description="User's preferred term")
    standard_term: str = Field(description="Standard trading term")
    context: Optional[str] = Field(None, description="Context where this term is used")


class LearningContextResponse(BaseModel):
    """Response containing user's learning context"""
    user_id: str
    terminology_mappings: Dict[str, str]
    trading_strategies: List[str]
    risk_preferences: Dict[str, Any]
    recent_corrections: List[str]
    learning_patterns: List[Dict[str, Any]]
    understanding_accuracy: float
    total_corrections: int
    last_updated: Optional[str] = None


class LearningEffectivenessResponse(BaseModel):
    """Response containing learning effectiveness metrics"""
    user_id: str
    period_days: int
    understanding_accuracy: float
    correction_rate: float
    total_interactions: int
    positive_feedback_count: int
    negative_feedback_count: int
    corrections_needed: int
    improvement_trend: Optional[str] = None


class FeedbackResponse(BaseModel):
    """Response after collecting feedback"""
    success: bool
    message: str
    feedback_id: Optional[str] = None
    learning_applied: bool = False
    insights_generated: Optional[List[str]] = None


@router.post("/feedback", response_model=FeedbackResponse)
async def collect_feedback(
    request: UserFeedbackRequest,
    db: Session = Depends(get_db),
    archon: ArchonClient = Depends(get_archon_client)
):
    """
    Collect user feedback on Renata's response

    This endpoint captures user satisfaction with Renata's responses
    and processes feedback for learning improvements.

    Feedback types:
    - thumbs_up: User satisfied with response
    - thumbs_down: User not satisfied with response
    - fix_understanding: User wants to correct Renata's understanding
    """
    try:
        learning_engine = create_learning_engine(db, archon)

        # Create feedback data object
        feedback_data = FeedbackData(
            feedback_type=request.feedback_type,
            user_query=request.user_query,
            renata_response=request.renata_response,
            feedback_details=request.feedback_details,
            improvement_suggestions=request.improvement_suggestions,
            renata_mode=request.renata_mode,
            trading_context=request.trading_context
        )

        # Collect feedback
        success = await learning_engine.collect_user_feedback(
            user_id=request.user_id,
            feedback=feedback_data
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to collect feedback"
            )

        # Generate insights based on feedback
        insights = []
        if request.feedback_type == "fix_understanding":
            insights.append("understanding_correction_needed")
        elif request.feedback_type == "thumbs_down":
            insights.append("response_dissatisfaction")
        elif request.feedback_type == "thumbs_up":
            insights.append("response_satisfaction")

        return FeedbackResponse(
            success=True,
            message=f"Feedback collected successfully: {request.feedback_type}",
            learning_applied=request.feedback_type == "fix_understanding",
            insights_generated=insights
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to collect feedback for user {request.user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feedback collection failed: {str(e)}"
        )


@router.post("/correction", response_model=FeedbackResponse)
async def collect_correction(
    request: UserCorrectionRequest,
    db: Session = Depends(get_db),
    archon: ArchonClient = Depends(get_archon_client)
):
    """
    Collect user correction of Renata's understanding

    This endpoint processes corrections when Renata misunderstands
    trading terminology, concepts, or context.

    The correction is processed to:
    1. Update user's trading profile
    2. Create learning patterns
    3. Store insights in Archon knowledge graph
    """
    try:
        learning_engine = create_learning_engine(db, archon)

        # Create correction data object
        correction_data = CorrectionData(
            original_user_input=request.original_user_input,
            renata_interpretation=request.renata_interpretation,
            renata_response=request.renata_response,
            user_correction=request.user_correction,
            correction_type=request.correction_type,
            trading_concept=request.trading_concept
        )

        # Process correction
        success = await learning_engine.collect_user_correction(
            user_id=request.user_id,
            correction=correction_data
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process correction"
            )

        return FeedbackResponse(
            success=True,
            message=f"Correction processed successfully: {request.correction_type}",
            learning_applied=True,
            insights_generated=[f"correction_{request.correction_type}", "learning_pattern_created"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process correction for user {request.user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Correction processing failed: {str(e)}"
        )


@router.get("/context/{user_id}", response_model=LearningContextResponse)
async def get_user_learning_context(
    user_id: str,
    db: Session = Depends(get_db),
    archon: ArchonClient = Depends(get_archon_client)
):
    """
    Get user's complete learning context

    Returns the user's personalized trading context including:
    - Preferred terminology mappings
    - Trading strategies and preferences
    - Risk management preferences
    - Recent corrections and learning patterns
    - Understanding accuracy metrics
    """
    try:
        learning_engine = create_learning_engine(db, archon)

        # Get user learning context
        learning_context = await learning_engine.get_user_learning_context(user_id)

        # Get additional profile information
        from ..models.learning_models import get_or_create_user_profile
        user_profile = get_or_create_user_profile(db, user_id)

        return LearningContextResponse(
            user_id=learning_context.user_id,
            terminology_mappings=learning_context.terminology_mappings,
            trading_strategies=learning_context.trading_strategies,
            risk_preferences=learning_context.risk_preferences,
            recent_corrections=learning_context.recent_corrections,
            learning_patterns=learning_context.learning_patterns,
            understanding_accuracy=learning_context.understanding_accuracy,
            total_corrections=user_profile.total_corrections,
            last_updated=user_profile.last_updated.isoformat() if user_profile.last_updated else None
        )

    except Exception as e:
        logger.error(f"Failed to get learning context for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve learning context: {str(e)}"
        )


@router.get("/effectiveness/{user_id}", response_model=LearningEffectivenessResponse)
async def get_learning_effectiveness(
    user_id: str,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    Get learning effectiveness metrics for a user

    Returns metrics showing how well the learning system is working:
    - Understanding accuracy over time
    - Correction frequency
    - Feedback patterns
    - Improvement trends
    """
    try:
        # Calculate effectiveness metrics
        effectiveness = LearningQueries.calculate_learning_effectiveness(db, user_id, days)

        if not effectiveness:
            return LearningEffectivenessResponse(
                user_id=user_id,
                period_days=days,
                understanding_accuracy=0.0,
                correction_rate=0.0,
                total_interactions=0,
                positive_feedback_count=0,
                negative_feedback_count=0,
                corrections_needed=0,
                improvement_trend="insufficient_data"
            )

        # Calculate improvement trend (simplified)
        improvement_trend = "improving" if effectiveness["understanding_accuracy"] > 0.7 else "needs_attention"
        if effectiveness["correction_rate"] < 0.1:
            improvement_trend = "stable"

        return LearningEffectivenessResponse(
            user_id=user_id,
            period_days=days,
            understanding_accuracy=effectiveness["understanding_accuracy"],
            correction_rate=effectiveness["correction_rate"],
            total_interactions=effectiveness["total_interactions"],
            positive_feedback_count=0,  # Would need to calculate from feedback sessions
            negative_feedback_count=0,  # Would need to calculate from feedback sessions
            corrections_needed=int(effectiveness["correction_rate"] * effectiveness["total_interactions"]),
            improvement_trend=improvement_trend
        )

    except Exception as e:
        logger.error(f"Failed to get learning effectiveness for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate learning effectiveness: {str(e)}"
        )


@router.post("/terminology", response_model=Dict[str, Any])
async def update_user_terminology(
    request: TerminologyUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update user's preferred terminology

    Allows manual updates to user's terminology preferences
    outside of the correction flow.
    """
    try:
        from ..models.learning_models import TradingTerminology

        # Check if terminology already exists
        existing = db.query(TradingTerminology).filter_by(
            user_id=request.user_id,
            user_term=request.user_term
        ).first()

        if existing:
            # Update existing terminology
            existing.standard_term = request.standard_term
            existing.context = request.context
            existing.last_used = datetime.utcnow()
            existing.usage_count += 1
        else:
            # Create new terminology
            terminology = TradingTerminology(
                user_id=request.user_id,
                user_term=request.user_term,
                standard_term=request.standard_term,
                context=request.context,
                confidence=1.0,
                learned_from="manual_update",
                usage_count=1,
                last_used=datetime.utcnow()
            )
            db.add(terminology)

        db.commit()

        return {
            "success": True,
            "message": f"Terminology updated: '{request.user_term}' → '{request.standard_term}'",
            "user_term": request.user_term,
            "standard_term": request.standard_term
        }

    except Exception as e:
        logger.error(f"Failed to update terminology for user {request.user_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terminology update failed: {str(e)}"
        )


@router.get("/terminology/{user_id}")
async def get_user_terminology(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get user's terminology mappings

    Returns all learned terminology for a user
    """
    try:
        terminology_mappings = LearningQueries.get_user_terminology(db, user_id)

        return {
            "user_id": user_id,
            "terminology_count": len(terminology_mappings),
            "mappings": terminology_mappings,
            "retrieved_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to get terminology for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve terminology: {str(e)}"
        )


@router.get("/patterns/{user_id}")
async def get_user_learning_patterns(
    user_id: str,
    pattern_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get user's learning patterns

    Returns learning patterns that have been identified
    from user corrections and feedback.
    """
    try:
        patterns = LearningQueries.get_learning_patterns(db, user_id, pattern_type)

        pattern_data = [
            {
                "id": str(pattern.id),
                "pattern_type": pattern.pattern_type,
                "description": pattern.pattern_description,
                "confidence_score": pattern.confidence_score,
                "usage_count": pattern.usage_count,
                "success_rate": pattern.success_rate,
                "created_at": pattern.created_at.isoformat(),
                "last_applied": pattern.last_applied.isoformat() if pattern.last_applied else None
            }
            for pattern in patterns
        ]

        return {
            "user_id": user_id,
            "pattern_type_filter": pattern_type,
            "patterns_count": len(pattern_data),
            "patterns": pattern_data,
            "retrieved_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to get learning patterns for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve learning patterns: {str(e)}"
        )


@router.delete("/reset/{user_id}")
async def reset_user_learning(
    user_id: str,
    confirm: bool = False,
    db: Session = Depends(get_db)
):
    """
    Reset user's learning data

    WARNING: This will delete all learned context for the user.
    Use with caution - typically only for testing or user request.
    """
    if not confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must set confirm=true to reset learning data"
        )

    try:
        from ..models.learning_models import (
            UserTradingProfile,
            TradingTerminology,
            TradingContextCorrection,
            UserFeedbackSession,
            LearningPattern
        )

        # Delete all learning data for user
        db.query(TradingTerminology).filter_by(user_id=user_id).delete()
        db.query(LearningPattern).filter_by(user_id=user_id).delete()

        # Delete related data through user profile
        user_profile = db.query(UserTradingProfile).filter_by(user_id=user_id).first()
        if user_profile:
            db.query(TradingContextCorrection).filter_by(user_profile_id=user_profile.id).delete()
            db.query(UserFeedbackSession).filter_by(user_profile_id=user_profile.id).delete()
            db.delete(user_profile)

        db.commit()

        logger.info(f"Reset learning data for user {user_id}")

        return {
            "success": True,
            "message": f"All learning data reset for user {user_id}",
            "user_id": user_id,
            "reset_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to reset learning data for user {user_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Learning data reset failed: {str(e)}"
        )


@router.get("/health")
async def learning_health_check():
    """
    Health check for learning system

    Verifies that the learning endpoints are working
    """
    return {
        "status": "healthy",
        "service": "trading_context_learning",
        "features": [
            "feedback_collection",
            "correction_processing",
            "terminology_learning",
            "pattern_recognition",
            "effectiveness_tracking"
        ],
        "timestamp": datetime.utcnow().isoformat()
    }