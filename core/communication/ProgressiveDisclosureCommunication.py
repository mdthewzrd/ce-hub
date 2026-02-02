"""
Phase 4: Enhanced Communication & Workflow
Progressive Disclosure Communication System for Adaptive Information Presentation
"""

from typing import Dict, List, Optional, Any, Union, Callable, TypeVar, Tuple, Set
from pydantic import BaseModel, Field, validator
from abc import ABC, abstractmethod
from enum import Enum
import asyncio
import json
import logging
from datetime import datetime, timedelta
import time
import uuid
import threading
import queue
from dataclasses import dataclass, field
from collections import defaultdict
import copy
import inspect
import re
from typing import Protocol

logger = logging.getLogger(__name__)

class DisclosureLevel(str, Enum):
    """Progressive disclosure levels"""
    ESSENTIAL = "essential"  # Critical information only
    BASIC = "basic"          # Core concepts and key details
    DETAILED = "detailed"    # Comprehensive information
    EXPERT = "expert"        # In-depth technical details
    COMPREHENSIVE = "comprehensive"  # Everything available

class InformationType(str, Enum):
    """Types of information that can be disclosed"""
    OVERVIEW = "overview"
    CONCEPT = "concept"
    EXAMPLE = "example"
    TECHNICAL = "technical"
    TUTORIAL = "tutorial"
    REFERENCE = "reference"
    TROUBLESHOOTING = "troubleshooting"
    BEST_PRACTICE = "best_practice"
    LIMITATION = "limitation"
    ALTERNATIVE = "alternative"

class UserExpertiseLevel(str, Enum):
    """User expertise levels"""
    BEGINNER = "beginner"
    NOVICE = "novice"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class CommunicationStyle(str, Enum):
    """Communication styles"""
    DIRECT = "direct"
    FRIENDLY = "friendly"
    FORMAL = "formal"
    CASUAL = "casual"
    TECHNICAL = "technical"
    EDUCATIONAL = "educational"

class ContentType(str, Enum):
    """Content types for progressive disclosure"""
    TEXT = "text"
    CODE = "code"
    DIAGRAM = "diagram"
    EXAMPLE = "example"
    TUTORIAL = "tutorial"
    REFERENCE = "reference"
    CHECKLIST = "checklist"
    FAQ = "faq"
    GLOSSARY = "glossary"

class InformationBlock(BaseModel):
    """Information block with progressive disclosure metadata"""
    block_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    information_type: InformationType
    disclosure_level: DisclosureLevel
    content_type: ContentType = ContentType.TEXT
    dependencies: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    estimated_read_time: int = Field(default=1)  # minutes
    complexity_score: float = Field(default=0.5, ge=0.0, le=1.0)
    prerequisites: List[str] = Field(default_factory=list)
    learning_objectives: List[str] = Field(default_factory=list)
    examples: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class UserProfile(BaseModel):
    """User profile for personalization"""
    user_id: str
    expertise_level: UserExpertiseLevel
    communication_style: CommunicationStyle
    preferred_content_types: List[ContentType] = Field(default_factory=list)
    learning_goals: List[str] = Field(default_factory=list)
    background_knowledge: List[str] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    interaction_history: List[Dict[str, Any]] = Field(default_factory=list)
    progress_tracker: Dict[str, float] = Field(default_factory=dict)
    last_activity: Optional[datetime] = None

class DisclosureStrategy(BaseModel):
    """Strategy for progressive disclosure"""
    strategy_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    target_expertise_levels: List[UserExpertiseLevel]
    information_hierarchy: Dict[DisclosureLevel, List[str]] = Field(default_factory=dict)
    adaptive_rules: List[Dict[str, Any]] = Field(default_factory=list)
    transition_criteria: Dict[str, Any] = Field(default_factory=dict)
    feedback_integration: bool = True
    personalization_enabled: bool = True

class LearningPath(BaseModel):
    """Learning path for structured information disclosure"""
    path_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    target_expertise_level: UserExpertiseLevel
    estimated_duration: int  # minutes
    information_blocks: List[str] = Field(default_factory=list)  # block_ids
    prerequisites: List[str] = Field(default_factory=list)
    learning_outcomes: List[str] = Field(default_factory=list)
    milestones: List[Dict[str, Any]] = Field(default_factory=list)
    adaptive_branching: bool = True

class ContextualClue(BaseModel):
    """Contextual clue for information relevance"""
    clue_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    clue_type: str
    clue_value: str
    weight: float = Field(default=1.0, ge=0.0, le=1.0)
    extraction_method: str
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ProgressiveDisclosureEngine:
    """Progressive disclosure communication engine"""

    def __init__(self):
        self.information_blocks: Dict[str, InformationBlock] = {}
        self.user_profiles: Dict[str, UserProfile] = {}
        self.disclosure_strategies: Dict[str, DisclosureStrategy] = {}
        self.learning_paths: Dict[str, LearningPath] = {}
        self.contextual_clues: Dict[str, ContextualClue] = {}

        # Session management
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.session_history: List[Dict[str, Any]] = []

        # Analytics and feedback
        self.usage_analytics: Dict[str, Any] = {}
        self.feedback_data: Dict[str, Any] = {}
        self.effectiveness_metrics: Dict[str, float] = {}

        # Configuration
        self.config = {
            "max_blocks_per_disclosure": 5,
            "default_complexity_threshold": 0.7,
            "adaptive_disclosure": True,
            "feedback_learning": True,
            "context_weight": 0.3,
            "expertise_weight": 0.4,
            "interaction_weight": 0.3
        }

        self._load_default_strategies()
        self._load_default_blocks()
        logger.info("Initialized Progressive Disclosure Engine")

    def create_user_profile(self, user_id: str, expertise_level: UserExpertiseLevel,
                          communication_style: CommunicationStyle = CommunicationStyle.DIRECT,
                          preferences: Dict[str, Any] = None) -> UserProfile:
        """Create or update user profile"""
        profile = UserProfile(
            user_id=user_id,
            expertise_level=expertise_level,
            communication_style=communication_style,
            preferences=preferences or {},
            last_activity=datetime.now()
        )

        self.user_profiles[user_id] = profile
        logger.info(f"Created user profile for: {user_id}")
        return profile

    def create_disclosure_session(self, user_id: str, topic: str, initial_context: Dict[str, Any] = None) -> str:
        """Create a new progressive disclosure session"""
        session_id = str(uuid.uuid4())

        # Get or create user profile
        user_profile = self.user_profiles.get(user_id)
        if not user_profile:
            user_profile = self.create_user_profile(user_id, UserExpertiseLevel.INTERMEDIATE)

        session = {
            "session_id": session_id,
            "user_id": user_id,
            "topic": topic,
            "initial_context": initial_context or {},
            "created_at": datetime.now(),
            "current_disclosure_level": self._determine_initial_disclosure_level(user_profile),
            "disclosed_blocks": [],
            "user_interactions": [],
            "context_updates": [],
            "adaptive_adjustments": [],
            "session_effectiveness": 0.0,
            "status": "active"
        }

        self.active_sessions[session_id] = session

        # Analyze initial context
        if initial_context:
            contextual_clues = self._extract_contextual_clues(initial_context)
            session["contextual_clues"] = [clue.clue_id for clue in contextual_clues]

        logger.info(f"Created disclosure session: {session_id} for topic: {topic}")
        return session_id

    def get_progressive_disclosure(self, session_id: str, user_query: str = None,
                                 context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get progressively disclosed information"""
        if session_id not in self.active_sessions:
            return {"error": "Session not found"}

        session = self.active_sessions[session_id]
        user_profile = self.user_profiles.get(session["user_id"])

        if not user_profile:
            return {"error": "User profile not found"}

        # Update context
        if context:
            session["context_updates"].append({
                "timestamp": datetime.now(),
                "context": context
            })

        # Determine disclosure strategy
        strategy = self._select_disclosure_strategy(user_profile, session)

        # Select information blocks
        selected_blocks = self._select_information_blocks(session, strategy, user_query, context)

        # Personalize content
        personalized_blocks = self._personalize_content(selected_blocks, user_profile)

        # Generate disclosure response
        disclosure_response = {
            "session_id": session_id,
            "disclosure_level": session["current_disclosure_level"].value,
            "selected_blocks": [self._format_information_block(block, user_profile) for block in personalized_blocks],
            "suggested_next_levels": self._suggest_next_disclosure_levels(session),
            "learning_recommendations": self._generate_learning_recommendations(session),
            "interactive_elements": self._generate_interactive_elements(personalized_blocks),
            "context_summary": self._generate_context_summary(session),
            "estimated_engagement_time": sum(block.estimated_read_time for block in personalized_blocks),
            "disclosure_strategy": strategy.name if strategy else "default"
        }

        # Update session
        session["disclosed_blocks"].extend([block.block_id for block in personalized_blocks])
        session["last_interaction"] = datetime.now()

        return disclosure_response

    def request_deeper_disclosure(self, session_id: str, topic: str = None,
                                specific_block_id: str = None) -> Dict[str, Any]:
        """Request deeper level of information disclosure"""
        if session_id not in self.active_sessions:
            return {"error": "Session not found"}

        session = self.active_sessions[session_id]

        # Determine next disclosure level
        current_level = session["current_disclosure_level"]
        next_level = self._get_next_disclosure_level(current_level)

        if not next_level:
            return {"message": "Already at maximum disclosure level"}

        # Update session
        session["current_disclosure_level"] = next_level
        session["disclosure_transitions"] = session.get("disclosure_transitions", [])
        session["disclosure_transitions"].append({
            "timestamp": datetime.now(),
            "from_level": current_level.value,
            "to_level": next_level.value,
            "trigger": "user_request",
            "topic": topic,
            "block_id": specific_block_id
        })

        # Get disclosure for new level
        return self.get_progressive_disclosure(session_id)

    def provide_feedback(self, session_id: str, feedback_type: str, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """Provide feedback on disclosure effectiveness"""
        if session_id not in self.active_sessions:
            return {"error": "Session not found"}

        session = self.active_sessions[session_id]

        # Record feedback
        feedback_record = {
            "session_id": session_id,
            "feedback_type": feedback_type,
            "feedback_data": feedback_data,
            "timestamp": datetime.now(),
            "disclosure_level": session["current_disclosure_level"].value,
            "disclosed_blocks": session.get("disclosed_blocks", [])
        }

        # Store feedback
        if session_id not in self.feedback_data:
            self.feedback_data[session_id] = []
        self.feedback_data[session_id].append(feedback_record)

        # Adaptive adjustment if enabled
        if self.config["adaptive_disclosure"]:
            self._make_adaptive_adjustment(session_id, feedback_record)

        return {"success": True, "recorded_feedback": feedback_record}

    def generate_learning_path(self, user_id: str, target_expertise: UserExpertiseLevel,
                             topic: str) -> LearningPath:
        """Generate personalized learning path"""
        user_profile = self.user_profiles.get(user_id)
        if not user_profile:
            user_profile = self.create_user_profile(user_id, UserExpertiseLevel.BEGINNER)

        # Find relevant information blocks
        relevant_blocks = self._find_relevant_blocks(topic, target_expertise)

        # Determine prerequisites
        prerequisites = self._determine_prerequisites(user_profile.expertise_level, target_expertise)

        # Create learning path
        learning_path = LearningPath(
            title=f"Learning Path: {topic} ({target_expertise.value})",
            description=f"Structured path to achieve {target_expertise.value} level in {topic}",
            target_expertise_level=target_expertise,
            estimated_duration=sum(block.estimated_read_time for block in relevant_blocks),
            information_blocks=[block.block_id for block in relevant_blocks],
            prerequisites=prerequisites,
            learning_outcomes=self._generate_learning_outcomes(topic, target_expertise)
        )

        self.learning_paths[learning_path.path_id] = learning_path
        return learning_path

    def get_contextual_suggestions(self, session_id: str, current_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get contextual suggestions for information disclosure"""
        if session_id not in self.active_sessions:
            return []

        session = self.active_sessions[session_id]
        user_profile = self.user_profiles.get(session["user_id"])

        # Extract contextual clues
        contextual_clues = self._extract_contextual_clues(current_context)

        suggestions = []

        for clue in contextual_clues:
            # Find relevant information blocks
            relevant_blocks = self._find_blocks_by_contextual_clue(clue)

            for block in relevant_blocks:
                if block.block_id not in session.get("disclosed_blocks", []):
                    suggestion = {
                        "block_id": block.block_id,
                        "title": block.title,
                        "relevance_score": clue.confidence * clue.weight,
                        "reason": f"Contextual clue: {clue.clue_type} = {clue.clue_value}",
                        "information_type": block.information_type.value,
                        "disclosure_level": block.disclosure_level.value
                    }
                    suggestions.append(suggestion)

        # Sort by relevance score
        suggestions.sort(key=lambda x: x["relevance_score"], reverse=True)

        return suggestions[:5]  # Return top 5 suggestions

    def get_disclosure_analytics(self, user_id: str = None, session_id: str = None) -> Dict[str, Any]:
        """Get comprehensive disclosure analytics"""
        analytics = {
            "total_sessions": len(self.active_sessions),
            "total_users": len(self.user_profiles),
            "average_session_effectiveness": 0.0,
            "disclosure_level_distribution": {},
            "information_type_usage": {},
            "user_expertise_distribution": {},
            "most_disclosed_blocks": [],
            "learning_path_completion": {},
            "feedback_summary": {}
        }

        # Calculate session effectiveness
        if self.active_sessions:
            effectiveness_scores = [
                session.get("session_effectiveness", 0.0)
                for session in self.active_sessions.values()
            ]
            analytics["average_session_effectiveness"] = sum(effectiveness_scores) / len(effectiveness_scores)

        # Distribution analysis
        for session in self.active_sessions.values():
            # Disclosure levels
            level = session.get("current_disclosure_level", DisclosureLevel.BASIC).value
            analytics["disclosure_level_distribution"][level] = analytics["disclosure_level_distribution"].get(level, 0) + 1

            # Information types in disclosed blocks
            for block_id in session.get("disclosed_blocks", []):
                if block_id in self.information_blocks:
                    block = self.information_blocks[block_id]
                    info_type = block.information_type.value
                    analytics["information_type_usage"][info_type] = analytics["information_type_usage"].get(info_type, 0) + 1

        # User expertise distribution
        for profile in self.user_profiles.values():
            expertise = profile.expertise_level.value
            analytics["user_expertise_distribution"][expertise] = analytics["user_expertise_distribution"].get(expertise, 0) + 1

        # Most disclosed blocks
        block_disclosure_count = defaultdict(int)
        for session in self.active_sessions.values():
            for block_id in session.get("disclosed_blocks", []):
                block_disclosure_count[block_id] += 1

        analytics["most_disclosed_blocks"] = [
            {"block_id": block_id, "disclosure_count": count}
            for block_id, count in sorted(block_disclosure_count.items(), key=lambda x: x[1], reverse=True)[:10]
        ]

        # Feedback summary
        if self.feedback_data:
            all_feedback = []
            for session_feedbacks in self.feedback_data.values():
                all_feedback.extend(session_feedbacks)

            if all_feedback:
                analytics["feedback_summary"] = {
                    "total_feedback": len(all_feedback),
                    "average_satisfaction": sum(f["feedback_data"].get("satisfaction", 0) for f in all_feedback) / len(all_feedback),
                    "common_issues": self._analyze_common_feedback_issues(all_feedback)
                }

        return analytics

    def _determine_initial_disclosure_level(self, user_profile: UserProfile) -> DisclosureLevel:
        """Determine initial disclosure level based on user profile"""
        expertise_mapping = {
            UserExpertiseLevel.BEGINNER: DisclosureLevel.ESSENTIAL,
            UserExpertiseLevel.NOVICE: DisclosureLevel.BASIC,
            UserExpertiseLevel.INTERMEDIATE: DisclosureLevel.DETAILED,
            UserExpertiseLevel.ADVANCED: DisclosureLevel.EXPERT,
            UserExpertiseLevel.EXPERT: DisclosureLevel.COMPREHENSIVE
        }

        return expertise_mapping.get(user_profile.expertise_level, DisclosureLevel.BASIC)

    def _select_disclosure_strategy(self, user_profile: UserProfile, session: Dict[str, Any]) -> Optional[DisclosureStrategy]:
        """Select appropriate disclosure strategy"""
        for strategy in self.disclosure_strategies.values():
            if user_profile.expertise_level in strategy.target_expertise_levels:
                return strategy
        return None

    def _select_information_blocks(self, session: Dict[str, Any], strategy: Optional[DisclosureStrategy],
                                 user_query: str = None, context: Dict[str, Any] = None) -> List[InformationBlock]:
        """Select appropriate information blocks for disclosure"""
        current_level = session["current_disclosure_level"]
        topic = session.get("topic", "")

        # Filter by disclosure level
        eligible_blocks = [
            block for block in self.information_blocks.values()
            if block.disclosure_level == current_level
        ]

        # Filter by topic relevance
        if topic:
            topic_keywords = topic.lower().split()
            eligible_blocks = [
                block for block in eligible_blocks
                if any(keyword in block.title.lower() or keyword in block.content.lower()
                      for keyword in topic_keywords) or topic.lower() in " ".join(block.tags).lower()
            ]

        # Filter by complexity
        user_profile = self.user_profiles.get(session["user_id"])
        if user_profile:
            max_complexity = self._get_max_complexity_for_expertise(user_profile.expertise_level)
            eligible_blocks = [block for block in eligible_blocks if block.complexity_score <= max_complexity]

        # Check dependencies
        disclosed_blocks = set(session.get("disclosed_blocks", []))
        eligible_blocks = [
            block for block in eligible_blocks
            if not block.dependencies or all(dep in disclosed_blocks for dep in block.dependencies)
        ]

        # Sort by relevance and return limited number
        if user_query:
            # Boost relevance based on query
            eligible_blocks = self._boost_relevance_by_query(eligible_blocks, user_query)

        return eligible_blocks[:self.config["max_blocks_per_disclosure"]]

    def _personalize_content(self, blocks: List[InformationBlock], user_profile: UserProfile) -> List[InformationBlock]:
        """Personalize content based on user profile"""
        personalized_blocks = []

        for block in blocks:
            personalized_block = copy.deepcopy(block)

            # Adjust content based on communication style
            if user_profile.communication_style == CommunicationStyle.FRIENDLY:
                personalized_block.content = self._make_content_friendly(personalized_block.content)
            elif user_profile.communication_style == CommunicationStyle.TECHNICAL:
                personalized_block.content = self._make_content_technical(personalized_block.content)
            elif user_profile.communication_style == CommunicationStyle.EDUCATIONAL:
                personalized_block.content = self._make_content_educational(personalized_block.content)

            # Add personalized examples based on background
            if user_profile.background_knowledge:
                personalized_block = self._add_personalized_examples(personalized_block, user_profile.background_knowledge)

            personalized_blocks.append(personalized_block)

        return personalized_blocks

    def _format_information_block(self, block: InformationBlock, user_profile: UserProfile) -> Dict[str, Any]:
        """Format information block for presentation"""
        return {
            "block_id": block.block_id,
            "title": block.title,
            "content": block.content,
            "information_type": block.information_type.value,
            "content_type": block.content_type.value,
            "disclosure_level": block.disclosure_level.value,
            "complexity_score": block.complexity_score,
            "estimated_read_time": block.estimated_read_time,
            "tags": block.tags,
            "examples": block.examples,
            "learning_objectives": block.learning_objectives,
            "interactive_elements": self._generate_block_interactive_elements(block, user_profile),
            "related_blocks": self._find_related_blocks(block.block_id)
        }

    def _suggest_next_disclosure_levels(self, session: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Suggest next disclosure levels"""
        current_level = session["current_disclosure_level"]
        all_levels = list(DisclosureLevel)
        current_index = all_levels.index(current_level)

        suggestions = []

        # Suggest next level if available
        if current_index < len(all_levels) - 1:
            next_level = all_levels[current_index + 1]
            suggestions.append({
                "level": next_level.value,
                "description": f"Go to {next_level.value} level for more detailed information",
                "action": "deeper_disclosure"
            })

        # Suggest specific topics for deeper exploration
        disclosed_blocks = session.get("disclosed_blocks", [])
        if disclosed_blocks:
            suggestions.append({
                "level": "specific_topic",
                "description": "Explore specific topics in more detail",
                "action": "topic_deep_dive"
            })

        return suggestions

    def _generate_learning_recommendations(self, session: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate learning recommendations based on session"""
        user_profile = self.user_profiles.get(session["user_id"])
        if not user_profile:
            return []

        recommendations = []

        # Analyze disclosed content
        disclosed_blocks = session.get("disclosed_blocks", [])
        covered_types = set()

        for block_id in disclosed_blocks:
            if block_id in self.information_blocks:
                block = self.information_blocks[block_id]
                covered_types.add(block.information_type)

        # Recommend missing information types
        all_types = set(InformationType)
        missing_types = all_types - covered_types

        for info_type in missing_types:
            recommendations.append({
                "type": "information_type",
                "recommendation": f"Explore {info_type.value} information",
                "reason": "You haven't seen this type of information yet"
            })

        # Recommend learning paths
        current_expertise = user_profile.expertise_level
        if current_expertise != UserExpertiseLevel.EXPERT:
            next_expertise = list(UserExpertiseLevel)[list(UserExpertiseLevel).index(current_expertise) + 1]
            recommendations.append({
                "type": "learning_path",
                "recommendation": f"Path to {next_expertise.value} level",
                "reason": "Advance your expertise level"
            })

        return recommendations

    def _generate_interactive_elements(self, blocks: List[InformationBlock]) -> List[Dict[str, Any]]:
        """Generate interactive elements for disclosed blocks"""
        interactive_elements = []

        for block in blocks:
            if block.content_type == ContentType.CODE:
                interactive_elements.append({
                    "type": "code_executor",
                    "block_id": block.block_id,
                    "description": "Run this code example"
                })
            elif block.content_type == ContentType.TUTORIAL:
                interactive_elements.append({
                    "type": "interactive_tutorial",
                    "block_id": block.block_id,
                    "description": "Follow interactive tutorial"
                })
            elif block.content_type == ContentType.CHECKLIST:
                interactive_elements.append({
                    "type": "progress_tracker",
                    "block_id": block.block_id,
                    "description": "Track your progress"
                })

        return interactive_elements

    def _generate_context_summary(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary of current context"""
        return {
            "topic": session.get("topic", ""),
            "current_disclosure_level": session["current_disclosure_level"].value,
            "blocks_disclosed": len(session.get("disclosed_blocks", [])),
            "session_duration": (datetime.now() - session["created_at"]).total_seconds() / 60,  # minutes
            "interaction_count": len(session.get("user_interactions", [])),
            "context_updates": len(session.get("context_updates", [])),
            "adaptive_adjustments": len(session.get("adaptive_adjustments", []))
        }

    def _extract_contextual_clues(self, context: Dict[str, Any]) -> List[ContextualClue]:
        """Extract contextual clues from input context"""
        clues = []

        # Extract from various context fields
        for context_type, context_value in context.items():
            if isinstance(context_value, str):
                # Extract keywords and entities
                clues.extend(self._extract_textual_clues(context_value, context_type))
            elif isinstance(context_value, dict):
                # Extract from nested context
                nested_clues = self._extract_contextual_clues(context_value)
                clues.extend(nested_clues)
            elif isinstance(context_value, list):
                # Extract from list context
                for item in context_value:
                    if isinstance(item, str):
                        clues.extend(self._extract_textual_clues(item, context_type))

        return clues

    def _extract_textual_clues(self, text: str, clue_type: str) -> List[ContextualClue]:
        """Extract clues from textual context"""
        clues = []

        # Technical indicators
        technical_keywords = ["api", "database", "algorithm", "security", "performance", "scalability"]
        for keyword in technical_keywords:
            if keyword.lower() in text.lower():
                clues.append(ContextualClue(
                    clue_type="technical_keyword",
                    clue_value=keyword,
                    extraction_method="keyword_matching",
                    confidence=0.8
                ))

        # Experience level indicators
        experience_keywords = ["beginner", "expert", "advanced", "basic", "simple", "complex"]
        for keyword in experience_keywords:
            if keyword.lower() in text.lower():
                clues.append(ContextualClue(
                    clue_type="experience_indicator",
                    clue_value=keyword,
                    extraction_method="keyword_matching",
                    confidence=0.7
                ))

        # Problem indicators
        problem_keywords = ["error", "issue", "problem", "bug", "challenge", "difficulty"]
        for keyword in problem_keywords:
            if keyword.lower() in text.lower():
                clues.append(ContextualClue(
                    clue_type="problem_indicator",
                    clue_value=keyword,
                    extraction_method="keyword_matching",
                    confidence=0.9
                ))

        return clues

    def _find_blocks_by_contextual_clue(self, clue: ContextualClue) -> List[InformationBlock]:
        """Find information blocks relevant to contextual clue"""
        relevant_blocks = []

        for block in self.information_blocks.values():
            relevance_score = 0.0

            # Check title and content for clue relevance
            if clue.clue_value.lower() in block.title.lower():
                relevance_score += 0.8
            if clue.clue_value.lower() in block.content.lower():
                relevance_score += 0.6

            # Check tags
            if any(clue.clue_value.lower() in tag.lower() for tag in block.tags):
                relevance_score += 0.4

            # Check information type relevance
            if clue.clue_type == "problem_indicator" and block.information_type == InformationType.TROUBLESHOOTING:
                relevance_score += 1.0
            elif clue.clue_type == "technical_keyword" and block.information_type == InformationType.TECHNICAL:
                relevance_score += 0.8

            if relevance_score > 0.5:
                relevant_blocks.append(block)

        return relevant_blocks

    def _get_next_disclosure_level(self, current_level: DisclosureLevel) -> Optional[DisclosureLevel]:
        """Get next disclosure level"""
        all_levels = list(DisclosureLevel)
        current_index = all_levels.index(current_level)

        if current_index < len(all_levels) - 1:
            return all_levels[current_index + 1]

        return None

    def _get_max_complexity_for_expertise(self, expertise: UserExpertiseLevel) -> float:
        """Get maximum complexity score for expertise level"""
        complexity_mapping = {
            UserExpertiseLevel.BEGINNER: 0.3,
            UserExpertiseLevel.NOVICE: 0.5,
            UserExpertiseLevel.INTERMEDIATE: 0.7,
            UserExpertiseLevel.ADVANCED: 0.9,
            UserExpertiseLevel.EXPERT: 1.0
        }
        return complexity_mapping.get(expertise, 0.7)

    def _boost_relevance_by_query(self, blocks: List[InformationBlock], query: str) -> List[InformationBlock]:
        """Boost block relevance based on user query"""
        query_keywords = query.lower().split()

        for block in blocks:
            relevance_boost = 0.0

            # Check query keyword matches
            title_matches = sum(1 for keyword in query_keywords if keyword in block.title.lower())
            content_matches = sum(1 for keyword in query_keywords if keyword in block.content.lower())
            tag_matches = sum(1 for keyword in query_keywords if any(keyword in tag.lower() for tag in block.tags))

            relevance_boost = (title_matches * 0.3 + content_matches * 0.2 + tag_matches * 0.1)

            # Store boost as metadata
            block.metadata["query_relevance_boost"] = relevance_boost

        # Sort by relevance boost
        return sorted(blocks, key=lambda b: b.metadata.get("query_relevance_boost", 0), reverse=True)

    def _make_content_friendly(self, content: str) -> str:
        """Make content more friendly and conversational"""
        friendly_replacements = {
            "The system should": "You'll be able to",
            "Users must": "You'll need to",
            "This provides": "This gives you",
            "Configuration is required": "You'll want to set this up"
        }

        for formal, friendly in friendly_replacements.items():
            content = content.replace(formal, friendly)

        return content

    def _make_content_technical(self, content: str) -> str:
        """Make content more technical"""
        technical_replacements = {
            "simple": "straightforward",
            "easy": "efficient",
            "show": "display",
            "use": "utilize"
        }

        for simple, technical in technical_replacements.items():
            content = content.replace(simple, technical)

        return content

    def _make_content_educational(self, content: str) -> str:
        """Make content more educational"""
        educational_prefixes = [
            "Let's understand how ",
            "The key concept here is ",
            "This works because ",
            "Think of it as "
        ]

        # Add educational context to first sentence
        if len(content) > 50:
            content = educational_prefixes[0] + content[0].lower() + content[1:]

        return content

    def _add_personalized_examples(self, block: InformationBlock, background_knowledge: List[str]) -> InformationBlock:
        """Add personalized examples based on user background"""
        # This is a simplified implementation
        # In production, would use more sophisticated personalization

        if "web development" in background_knowledge and block.information_type == InformationType.EXAMPLE:
            block.examples.append({
                "context": "web_development",
                "example": "For example, in a React application, this would be implemented as..."
            })

        return block

    def _generate_block_interactive_elements(self, block: InformationBlock, user_profile: UserProfile) -> List[Dict[str, Any]]:
        """Generate interactive elements for a specific block"""
        elements = []

        if block.content_type == ContentType.CODE:
            elements.append({
                "type": "code_editor",
                "language": "python",  # Would be determined from content
                "editable": True
            })

        if block.learning_objectives:
            elements.append({
                "type": "progress_checklist",
                "objectives": block.learning_objectives
            })

        return elements

    def _find_related_blocks(self, block_id: str) -> List[Dict[str, Any]]:
        """Find related information blocks"""
        if block_id not in self.information_blocks:
            return []

        current_block = self.information_blocks[block_id]
        related_blocks = []

        for other_id, other_block in self.information_blocks.items():
            if other_id == block_id:
                continue

            # Simple similarity check
            if (set(current_block.tags) & set(other_block.tags) or
                current_block.information_type == other_block.information_type):
                related_blocks.append({
                    "block_id": other_id,
                    "title": other_block.title,
                    "relationship_type": "similar_content"
                })

        return related_blocks[:3]  # Return top 3 related blocks

    def _make_adaptive_adjustment(self, session_id: str, feedback_record: Dict[str, Any]):
        """Make adaptive adjustment based on feedback"""
        session = self.active_sessions.get(session_id)
        if not session:
            return

        feedback_data = feedback_record["feedback_data"]
        feedback_type = feedback_record["feedback_type"]

        adjustment = {
            "timestamp": datetime.now(),
            "feedback_type": feedback_type,
            "adjustment_made": None
        }

        # Adjust disclosure level based on feedback
        if feedback_type == "complexity_feedback":
            complexity_rating = feedback_data.get("complexity_rating", 3)  # 1-5 scale
            if complexity_rating < 3:
                # Too complex, suggest lower level
                current_level = session["current_disclosure_level"]
                if current_level != DisclosureLevel.ESSENTIAL:
                    session["current_disclosure_level"] = DisclosureLevel.ESSENTIAL
                    adjustment["adjustment_made"] = "reduced_disclosure_level"
            elif complexity_rating > 4:
                # Too simple, suggest higher level
                current_level = session["current_disclosure_level"]
                next_level = self._get_next_disclosure_level(current_level)
                if next_level:
                    session["current_disclosure_level"] = next_level
                    adjustment["adjustment_made"] = "increased_disclosure_level"

        session["adaptive_adjustments"] = session.get("adaptive_adjustments", [])
        session["adaptive_adjustments"].append(adjustment)

    def _find_relevant_blocks(self, topic: str, expertise_level: UserExpertiseLevel) -> List[InformationBlock]:
        """Find information blocks relevant to topic and expertise level"""
        topic_keywords = topic.lower().split()
        relevant_blocks = []

        for block in self.information_blocks.values():
            relevance_score = 0.0

            # Topic relevance
            title_matches = sum(1 for keyword in topic_keywords if keyword in block.title.lower())
            content_matches = sum(1 for keyword in topic_keywords if keyword in block.content.lower())

            relevance_score += title_matches * 2 + content_matches

            # Expertise level compatibility
            target_complexity = self._get_max_complexity_for_expertise(expertise_level)
            if block.complexity_score <= target_complexity:
                relevance_score += 1.0

            if relevance_score > 1.0:
                relevant_blocks.append(block)

        return sorted(relevant_blocks, key=lambda b: b.complexity_score)

    def _determine_prerequisites(self, current_expertise: UserExpertiseLevel, target_expertise: UserExpertiseLevel) -> List[str]:
        """Determine prerequisites for expertise advancement"""
        all_levels = list(UserExpertiseLevel)
        current_index = all_levels.index(current_expertise)
        target_index = all_levels.index(target_expertise)

        if target_index <= current_index:
            return []

        # Generate prerequisite topics
        prerequisites = []
        for i in range(current_index, target_index):
            level = all_levels[i]
            prerequisites.append(f"foundation_{level.value}")

        return prerequisites

    def _generate_learning_outcomes(self, topic: str, expertise_level: UserExpertiseLevel) -> List[str]:
        """Generate learning outcomes for topic and expertise level"""
        outcomes = [
            f"Understand core concepts of {topic}",
            f"Apply {topic} principles in practical scenarios"
        ]

        if expertise_level in [UserExpertiseLevel.ADVANCED, UserExpertiseLevel.EXPERT]:
            outcomes.extend([
                f"Analyze complex {topic} situations",
                f"Design advanced {topic} solutions"
            ])

        return outcomes

    def _analyze_common_feedback_issues(self, feedback_list: List[Dict[str, Any]]) -> List[str]:
        """Analyze common issues from feedback"""
        issues = defaultdict(int)

        for feedback in feedback_list:
            feedback_data = feedback["feedback_data"]
            if "issues" in feedback_data:
                for issue in feedback_data["issues"]:
                    issues[issue] += 1

        # Return top issues
        sorted_issues = sorted(issues.items(), key=lambda x: x[1], reverse=True)
        return [issue for issue, count in sorted_issues[:5]]

    def _load_default_strategies(self):
        """Load default disclosure strategies"""
        # Beginner strategy
        beginner_strategy = DisclosureStrategy(
            name="Beginner Friendly",
            description="Strategy for users with beginner expertise",
            target_expertise_levels=[UserExpertiseLevel.BEGINNER, UserExpertiseLevel.NOVICE],
            information_hierarchy={
                DisclosureLevel.ESSENTIAL: ["overview", "basic_concepts"],
                DisclosureLevel.BASIC: ["examples", "tutorials"],
                DisclosureLevel.DETAILED: ["reference", "best_practices"]
            }
        )

        # Expert strategy
        expert_strategy = DisclosureStrategy(
            name="Expert Technical",
            description="Strategy for users with expert knowledge",
            target_expertise_levels=[UserExpertiseLevel.EXPERT, UserExpertiseLevel.ADVANCED],
            information_hierarchy={
                DisclosureLevel.DETAILED: ["technical", "reference"],
                DisclosureLevel.EXPERT: ["advanced_topics", "optimizations"],
                DisclosureLevel.COMPREHENSIVE: ["all_available"]
            }
        )

        self.disclosure_strategies[beginner_strategy.strategy_id] = beginner_strategy
        self.disclosure_strategies[expert_strategy.strategy_id] = expert_strategy

    def _load_default_blocks(self):
        """Load default information blocks"""
        # Essential blocks
        essential_block = InformationBlock(
            title="Getting Started",
            content="This is the essential information you need to get started.",
            information_type=InformationType.OVERVIEW,
            disclosure_level=DisclosureLevel.ESSENTIAL,
            estimated_read_time=2,
            complexity_score=0.2,
            tags=["beginner", "overview"]
        )

        # Detailed blocks
        technical_block = InformationBlock(
            title="Technical Implementation",
            content="Detailed technical implementation details and code examples.",
            information_type=InformationType.TECHNICAL,
            disclosure_level=DisclosureLevel.DETAILED,
            estimated_read_time=10,
            complexity_score=0.8,
            tags=["technical", "implementation"],
            examples=[{
                "description": "Basic implementation example",
                "code": "def example_function():\n    return 'Hello World'"
            }]
        )

        self.information_blocks[essential_block.block_id] = essential_block
        self.information_blocks[technical_block.block_id] = technical_block

# Global engine instance
disclosure_engine = ProgressiveDisclosureEngine()