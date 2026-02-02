"""
Trading Context Learning Engine for Renata AI

This engine handles the learning aspects of Renata AI, including:
- Processing user feedback and corrections
- Building personalized trading context
- Applying learned patterns to improve responses
- Storing insights in Archon knowledge graph
"""

import logging
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass

from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..models.learning_models import (
    UserTradingProfile,
    TradingTerminology,
    TradingContextCorrection,
    UserFeedbackSession,
    LearningPattern,
    get_or_create_user_profile,
    LearningQueries
)
from ..core.archon_client import ArchonClient, TradingInsight

logger = logging.getLogger(__name__)


class FeedbackData(BaseModel):
    """User feedback on Renata's response"""
    feedback_type: str  # 'thumbs_up', 'thumbs_down', 'fix_understanding'
    user_query: str
    renata_response: str
    feedback_details: Optional[str] = None
    improvement_suggestions: Optional[str] = None
    renata_mode: str
    trading_context: Optional[Dict[str, Any]] = None


class CorrectionData(BaseModel):
    """User correction of Renata's understanding"""
    original_user_input: str
    renata_interpretation: str
    renata_response: str
    user_correction: str
    correction_type: str  # 'terminology', 'strategy', 'context', etc.
    trading_concept: Optional[str] = None


@dataclass
class UserLearningContext:
    """Compiled learning context for a user"""
    user_id: str
    terminology_mappings: Dict[str, str]
    trading_strategies: List[str]
    risk_preferences: Dict[str, Any]
    recent_corrections: List[str]
    learning_patterns: List[Dict[str, Any]]
    understanding_accuracy: float


class TradingContextLearningEngine:
    """
    Core learning engine for trading context understanding

    Implements the learning feedback loop:
    1. Collect user feedback and corrections
    2. Process and extract learning patterns
    3. Apply patterns to enhance future responses
    4. Store learnings in Archon for cross-user insights
    """

    def __init__(self, db_session: Session, archon_client: ArchonClient):
        self.db = db_session
        self.archon = archon_client

    async def collect_user_feedback(
        self,
        user_id: str,
        feedback: FeedbackData
    ) -> bool:
        """
        Collect and store user feedback on Renata's response

        Args:
            user_id: User identifier
            feedback: Feedback data from user

        Returns:
            True if feedback was processed successfully
        """
        try:
            # Get or create user profile
            user_profile = get_or_create_user_profile(self.db, user_id)

            # Create feedback session record
            feedback_session = UserFeedbackSession(
                user_profile_id=user_profile.id,
                user_query=feedback.user_query,
                renata_response=feedback.renata_response,
                feedback_type=feedback.feedback_type,
                feedback_details=feedback.feedback_details,
                improvement_suggestions=feedback.improvement_suggestions,
                renata_mode=feedback.renata_mode,
                trading_context=feedback.trading_context or {},
                conversation_history={}  # Could be passed in if needed
            )

            self.db.add(feedback_session)
            self.db.commit()

            # Process feedback for learning patterns
            if feedback.feedback_type == 'fix_understanding':
                await self._process_understanding_feedback(user_id, feedback)

            # Update user profile metrics
            await self._update_learning_metrics(user_profile)

            logger.info(f"Collected feedback for user {user_id}: {feedback.feedback_type}")
            return True

        except Exception as e:
            logger.error(f"Failed to collect feedback for user {user_id}: {e}")
            self.db.rollback()
            return False

    async def collect_user_correction(
        self,
        user_id: str,
        correction: CorrectionData
    ) -> bool:
        """
        Collect and process user correction of Renata's understanding

        Args:
            user_id: User identifier
            correction: Correction data from user

        Returns:
            True if correction was processed successfully
        """
        try:
            # Get or create user profile
            user_profile = get_or_create_user_profile(self.db, user_id)

            # Create correction record
            correction_record = TradingContextCorrection(
                user_profile_id=user_profile.id,
                original_user_input=correction.original_user_input,
                renata_interpretation=correction.renata_interpretation,
                renata_response=correction.renata_response,
                user_correction=correction.user_correction,
                correction_type=correction.correction_type,
                trading_concept=correction.trading_concept,
                conversation_context={},
                ui_context={},
                applied_to_user_profile=False
            )

            self.db.add(correction_record)

            # Process correction for learning
            await self._process_correction_for_learning(user_profile, correction)

            # Update correction as applied
            correction_record.applied_to_user_profile = True

            self.db.commit()

            # Store learning insight in Archon
            await self._ingest_correction_insight(user_id, correction)

            logger.info(f"Processed correction for user {user_id}: {correction.correction_type}")
            return True

        except Exception as e:
            logger.error(f"Failed to process correction for user {user_id}: {e}")
            self.db.rollback()
            return False

    async def get_user_learning_context(self, user_id: str) -> UserLearningContext:
        """
        Get compiled learning context for a user to enhance responses

        Args:
            user_id: User identifier

        Returns:
            UserLearningContext with all learned patterns
        """
        try:
            # Get user profile
            user_profile = get_or_create_user_profile(self.db, user_id)

            # Get terminology mappings
            terminology = LearningQueries.get_user_terminology(self.db, user_id)

            # Get recent corrections for context
            recent_corrections = LearningQueries.get_recent_corrections(self.db, user_id, limit=5)
            correction_summaries = [
                f"{corr.trading_concept}: {corr.user_correction}"
                for corr in recent_corrections
                if corr.trading_concept
            ]

            # Get learning patterns
            patterns = LearningQueries.get_learning_patterns(self.db, user_id)
            pattern_data = [
                {
                    "type": pattern.pattern_type,
                    "description": pattern.pattern_description,
                    "trigger_conditions": pattern.trigger_conditions,
                    "response_modifications": pattern.response_modifications,
                    "confidence": pattern.confidence_score
                }
                for pattern in patterns
            ]

            # Calculate recent effectiveness
            effectiveness = LearningQueries.calculate_learning_effectiveness(self.db, user_id)
            understanding_accuracy = effectiveness.get("understanding_accuracy", 0.0) if effectiveness else 0.0

            return UserLearningContext(
                user_id=user_id,
                terminology_mappings=terminology,
                trading_strategies=user_profile.trading_strategies or [],
                risk_preferences=user_profile.risk_preferences or {},
                recent_corrections=correction_summaries,
                learning_patterns=pattern_data,
                understanding_accuracy=understanding_accuracy
            )

        except Exception as e:
            logger.error(f"Failed to get learning context for user {user_id}: {e}")
            # Return empty context as fallback
            return UserLearningContext(
                user_id=user_id,
                terminology_mappings={},
                trading_strategies=[],
                risk_preferences={},
                recent_corrections=[],
                learning_patterns=[],
                understanding_accuracy=0.0
            )

    def apply_learning_to_prompt(
        self,
        base_prompt: str,
        learning_context: UserLearningContext
    ) -> str:
        """
        Apply learned context to enhance Renata's prompt

        Args:
            base_prompt: Original prompt for Renata
            learning_context: User's learning context

        Returns:
            Enhanced prompt with learned context
        """
        try:
            # Start with base prompt
            enhanced_prompt = base_prompt

            # Add user-specific terminology section
            if learning_context.terminology_mappings:
                terminology_section = "\n\nUSER'S PREFERRED TERMINOLOGY:\n"
                for user_term, standard_term in learning_context.terminology_mappings.items():
                    terminology_section += f"- When user says '{user_term}', they mean '{standard_term}'\n"
                enhanced_prompt += terminology_section

            # Add trading strategies context
            if learning_context.trading_strategies:
                strategies_section = f"\n\nUSER'S TRADING STRATEGIES:\n{', '.join(learning_context.trading_strategies)}\n"
                enhanced_prompt += strategies_section

            # Add risk preferences
            if learning_context.risk_preferences:
                risk_section = "\n\nUSER'S RISK PREFERENCES:\n"
                for key, value in learning_context.risk_preferences.items():
                    risk_section += f"- {key}: {value}\n"
                enhanced_prompt += risk_section

            # Add recent corrections context
            if learning_context.recent_corrections:
                corrections_section = "\n\nRECENT LEARNING FROM USER CORRECTIONS:\n"
                for correction in learning_context.recent_corrections[:3]:  # Limit to most recent
                    corrections_section += f"- {correction}\n"
                enhanced_prompt += corrections_section

            # Add specific learning patterns
            applicable_patterns = [
                pattern for pattern in learning_context.learning_patterns
                if pattern["confidence"] > 0.7
            ]

            if applicable_patterns:
                patterns_section = "\n\nLEARNED COMMUNICATION PATTERNS:\n"
                for pattern in applicable_patterns[:3]:  # Limit to top patterns
                    patterns_section += f"- {pattern['description']}\n"
                enhanced_prompt += patterns_section

            # Add learning instruction
            enhanced_prompt += f"""

LEARNING CONTEXT INSTRUCTION:
This user has an understanding accuracy of {learning_context.understanding_accuracy:.1%}.
Apply the above learned context to provide responses that match their specific trading terminology and preferences.
If unsure about their meaning, ask for clarification rather than making assumptions.
"""

            return enhanced_prompt

        except Exception as e:
            logger.error(f"Failed to apply learning to prompt: {e}")
            return base_prompt

    async def _process_understanding_feedback(
        self,
        user_id: str,
        feedback: FeedbackData
    ):
        """Process 'fix_understanding' feedback to extract learning patterns"""

        if not feedback.improvement_suggestions:
            return

        # Extract terminology corrections
        suggestions = feedback.improvement_suggestions.lower()

        # Look for terminology patterns
        if "call it" in suggestions or "mean" in suggestions or "refer to" in suggestions:
            await self._extract_terminology_correction(user_id, feedback)

        # Look for strategy clarifications
        if any(word in suggestions for word in ["strategy", "approach", "method", "style"]):
            await self._extract_strategy_preference(user_id, feedback)

    async def _process_correction_for_learning(
        self,
        user_profile: UserTradingProfile,
        correction: CorrectionData
    ):
        """Process correction to update user profile and create learning patterns"""

        try:
            # Update terminology if it's a terminology correction
            if correction.correction_type == "terminology":
                await self._update_terminology_mapping(
                    user_profile.user_id,
                    correction.original_user_input,
                    correction.user_correction
                )

            # Update trading strategies if mentioned
            if correction.correction_type == "strategy":
                await self._update_strategy_preferences(
                    user_profile,
                    correction.user_correction
                )

            # Create learning pattern
            await self._create_learning_pattern(user_profile.user_id, correction)

        except Exception as e:
            logger.error(f"Failed to process correction for learning: {e}")

    async def _update_terminology_mapping(
        self,
        user_id: str,
        user_term: str,
        correction: str
    ):
        """Extract and store terminology mapping from correction"""

        try:
            # Simple extraction - in production would use more sophisticated NLP
            if "mean" in correction:
                parts = correction.split("mean")
                if len(parts) > 1:
                    standard_term = parts[1].strip().rstrip(".!").strip("\"'")

                    # Store terminology mapping
                    terminology = TradingTerminology(
                        user_id=user_id,
                        user_term=user_term.strip(),
                        standard_term=standard_term,
                        context="user_correction",
                        confidence=1.0,
                        learned_from="correction",
                        usage_count=1,
                        last_used=datetime.utcnow()
                    )

                    self.db.add(terminology)

        except Exception as e:
            logger.error(f"Failed to update terminology mapping: {e}")

    async def _update_strategy_preferences(
        self,
        user_profile: UserTradingProfile,
        correction: str
    ):
        """Extract and update user's trading strategy preferences"""

        try:
            # Extract strategy mentions from correction
            strategy_keywords = [
                "swing trading", "day trading", "scalping", "position trading",
                "momentum", "trend following", "mean reversion", "breakout"
            ]

            mentioned_strategies = [
                strategy for strategy in strategy_keywords
                if strategy in correction.lower()
            ]

            if mentioned_strategies:
                current_strategies = user_profile.trading_strategies or []
                updated_strategies = list(set(current_strategies + mentioned_strategies))
                user_profile.trading_strategies = updated_strategies

        except Exception as e:
            logger.error(f"Failed to update strategy preferences: {e}")

    async def _create_learning_pattern(
        self,
        user_id: str,
        correction: CorrectionData
    ):
        """Create a learning pattern from user correction"""

        try:
            pattern = LearningPattern(
                user_id=user_id,
                pattern_type=correction.correction_type,
                pattern_description=f"User correction: {correction.user_correction}",
                trigger_conditions={
                    "input_contains": [correction.original_user_input.lower()],
                    "context_type": correction.trading_concept
                },
                response_modifications={
                    "apply_correction": correction.user_correction,
                    "avoid_misinterpretation": correction.renata_interpretation
                },
                confidence_score=0.8,
                supporting_corrections=[],
                usage_count=0,
                success_rate=0.0
            )

            self.db.add(pattern)

        except Exception as e:
            logger.error(f"Failed to create learning pattern: {e}")

    async def _update_learning_metrics(self, user_profile: UserTradingProfile):
        """Update user profile learning metrics"""

        try:
            # Calculate recent effectiveness
            effectiveness = LearningQueries.calculate_learning_effectiveness(
                self.db,
                user_profile.user_id,
                days=7
            )

            if effectiveness:
                user_profile.learning_confidence = effectiveness["understanding_accuracy"]
                user_profile.last_updated = datetime.utcnow()

        except Exception as e:
            logger.error(f"Failed to update learning metrics: {e}")

    async def _ingest_correction_insight(
        self,
        user_id: str,
        correction: CorrectionData
    ):
        """Store correction insight in Archon knowledge graph"""

        try:
            insight = TradingInsight(
                content={
                    "correction_type": correction.correction_type,
                    "trading_concept": correction.trading_concept,
                    "user_correction": correction.user_correction,
                    "original_misunderstanding": correction.renata_interpretation,
                    "learning_applied": True,
                    "user_id_hash": hash(user_id) % 10000  # Anonymized user reference
                },
                tags=["trading_context_learning", f"correction_{correction.correction_type}", "user_feedback"],
                insight_type="context_correction",
                metadata={
                    "correction_date": datetime.utcnow().isoformat(),
                    "learning_source": "user_correction"
                }
            )

            await self.archon.ingest_trading_insight(
                insight,
                title=f"Trading Context Correction - {correction.correction_type}"
            )

        except Exception as e:
            logger.error(f"Failed to ingest correction insight: {e}")

    async def _extract_terminology_correction(self, user_id: str, feedback: FeedbackData):
        """Extract terminology correction from feedback"""
        # Implementation for extracting terminology corrections
        pass

    async def _extract_strategy_preference(self, user_id: str, feedback: FeedbackData):
        """Extract strategy preference from feedback"""
        # Implementation for extracting strategy preferences
        pass


# Factory function for dependency injection
def create_learning_engine(db_session: Session, archon_client: ArchonClient) -> TradingContextLearningEngine:
    """Create learning engine with dependencies"""
    return TradingContextLearningEngine(db_session, archon_client)