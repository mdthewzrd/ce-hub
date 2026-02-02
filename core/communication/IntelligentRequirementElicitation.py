"""
Phase 4: Enhanced Communication & Workflow
Intelligent Requirement Elicitation System for Advanced User-Agent Interaction
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

class RequirementType(str, Enum):
    """Requirement type enumeration"""
    FUNCTIONAL = "functional"
    NON_FUNCTIONAL = "non_functional"
    CONSTRAINT = "constraint"
    ASSUMPTION = "assumption"
    DEPENDENCY = "dependency"
    ACCEPTANCE_CRITERIA = "acceptance_criteria"
    USER_STORY = "user_story"
    TECHNICAL = "technical"
    BUSINESS = "business"

class RequirementPriority(str, Enum):
    """Requirement priority levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    OPTIONAL = "optional"

class RequirementStatus(str, Enum):
    """Requirement status"""
    DRAFT = "draft"
    PROPOSED = "proposed"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    IMPLEMENTED = "implemented"
    VERIFIED = "verified"
    DEPRECATED = "deprecated"

class QuestionType(str, Enum):
    """Question type for elicitation"""
    OPEN_ENDED = "open_ended"
    MULTIPLE_CHOICE = "multiple_choice"
    YES_NO = "yes_no"
    RATING = "rating"
    RANKING = "ranking"
    SCENARIO = "scenario"
    COMPARISON = "comparison"
    ELICITATION = "elicitation"
    VALIDATION = "validation"
    CLARIFICATION = "clarification"

class ElicitationStrategy(str, Enum):
    """Elicitation strategy types"""
    INTERVIEW = "interview"
    WORKSHOP = "workshop"
    QUESTIONNAIRE = "questionnaire"
    OBSERVATION = "observation"
    PROTOTYPING = "prototyping"
    BRAINSTORMING = "brainstorming"
    ANALYSIS = "analysis"
    DISCOVERY = "discovery"

class Requirement(BaseModel):
    """Individual requirement model"""
    requirement_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    requirement_type: RequirementType
    priority: RequirementPriority
    status: RequirementStatus = RequirementStatus.DRAFT
    source: str = "user"
    context: Dict[str, Any] = Field(default_factory=dict)
    acceptance_criteria: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    created_by: str
    assigned_to: Optional[str] = None
    estimated_effort: Optional[str] = None
    verification_method: Optional[str] = None
    rationale: Optional[str] = None

    class Config:
        use_enum_values = True

class ElicitationQuestion(BaseModel):
    """Elicitation question model"""
    question_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_text: str
    question_type: QuestionType
    context: Dict[str, Any] = Field(default_factory=dict)
    options: List[str] = Field(default_factory=list)
    expected_answer_format: Optional[str] = None
    follow_up_questions: List[str] = Field(default_factory=list)
    priority: RequirementPriority = RequirementPriority.MEDIUM
    category: str = "general"
    metadata: Dict[str, Any] = Field(default_factory=dict)

class RequirementTrace(BaseModel):
    """Requirement trace model"""
    trace_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    requirement_id: str
    trace_type: str
    source_artifact: str
    target_artifact: str
    relationship_type: str
    created_at: datetime = Field(default_factory=datetime.now)
    created_by: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class RequirementPattern(BaseModel):
    """Requirement pattern for matching"""
    pattern_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    pattern_type: RequirementType
    keywords: List[str] = Field(default_factory=list)
    context_clues: List[str] = Field(default_factory=list)
    question_templates: List[str] = Field(default_factory=list)
    extraction_rules: Dict[str, Any] = Field(default_factory=dict)
    confidence_threshold: float = Field(default=0.7, ge=0.0, le=1.0)

class UserContext(BaseModel):
    """User context model"""
    user_id: str
    session_id: str
    interaction_history: List[Dict[str, Any]] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    expertise_level: str = "intermediate"
    domain_knowledge: List[str] = Field(default_factory=list)
    previous_projects: List[str] = Field(default_factory=list)
    communication_style: str = "direct"
    language_preferences: List[str] = Field(default_factory=["en"])
    context_data: Dict[str, Any] = Field(default_factory=dict)
    last_interaction: Optional[datetime] = None

class RequirementElicitationEngine:
    """Intelligent requirement elicitation engine"""

    def __init__(self):
        self.requirements: Dict[str, Requirement] = {}
        self.questions: Dict[str, ElicitationQuestion] = {}
        self.patterns: Dict[str, RequirementPattern] = {}
        self.traces: Dict[str, RequirementTrace] = {}
        self.user_contexts: Dict[str, UserContext] = {}

        # Elicitation session management
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.session_history: List[Dict[str, Any]] = []

        # Analysis and learning
        self.requirement_clusters: Dict[str, List[str]] = {}
        self.success_patterns: List[Dict[str, Any]] = []
        self.feedback_data: Dict[str, Any] = {}

        # Configuration
        self.config = {
            "max_follow_up_depth": 3,
            "confidence_threshold": 0.7,
            "auto_suggest_patterns": True,
            "enable_learning": True,
            "context_retention_hours": 24,
            "question_timeout_seconds": 300
        }

        self._load_default_patterns()
        logger.info("Initialized Requirement Elicitation Engine")

    def create_elicitation_session(self, user_id: str, initial_request: str, session_config: Dict[str, Any] = None) -> str:
        """Create a new elicitation session"""
        session_id = str(uuid.uuid4())

        # Initialize user context if needed
        if user_id not in self.user_contexts:
            self.user_contexts[user_id] = UserContext(
                user_id=user_id,
                session_id=session_id,
                interaction_history=[],
                context_data=session_config or {}
            )

        # Create session
        session = {
            "session_id": session_id,
            "user_id": user_id,
            "initial_request": initial_request,
            "created_at": datetime.now(),
            "status": "active",
            "current_phase": "analysis",
            "questions_asked": [],
            "requirements_identified": [],
            "context_data": session_config or {},
            "strategy": self._determine_elicitation_strategy(initial_request),
            "metadata": {}
        }

        self.active_sessions[session_id] = session

        # Analyze initial request
        self._analyze_initial_request(session_id, initial_request)

        logger.info(f"Created elicitation session: {session_id} for user: {user_id}")
        return session_id

    def analyze_user_input(self, session_id: str, user_input: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Analyze user input and generate insights"""
        if session_id not in self.active_sessions:
            return {"error": "Session not found"}

        session = self.active_sessions[session_id]
        user_context = self.user_contexts.get(session["user_id"])

        # Update interaction history
        interaction = {
            "timestamp": datetime.now(),
            "input": user_input,
            "context": context or {},
            "session_phase": session.get("current_phase", "unknown")
        }

        if user_context:
            user_context.interaction_history.append(interaction)
            user_context.last_interaction = datetime.now()

        # Perform analysis
        analysis_result = {
            "session_id": session_id,
            "analysis_timestamp": datetime.now(),
            "input_analysis": self._analyze_text(user_input),
            "requirement_candidates": self._extract_requirements(user_input, context),
            "suggested_questions": self._generate_follow_up_questions(session_id, user_input),
            "pattern_matches": self._match_patterns(user_input),
            "confidence_scores": self._calculate_confidence_scores(user_input),
            "next_actions": self._determine_next_actions(session_id, user_input)
        }

        # Update session
        session["last_interaction"] = datetime.now()
        session["interaction_count"] = session.get("interaction_count", 0) + 1

        return analysis_result

    def generate_elicitation_questions(self, session_id: str, focus_areas: List[str] = None) -> List[ElicitationQuestion]:
        """Generate intelligent elicitation questions"""
        if session_id not in self.active_sessions:
            return []

        session = self.active_sessions[session_id]
        user_context = self.user_contexts.get(session["user_id"])

        questions = []

        # Generate questions based on session phase
        phase = session.get("current_phase", "discovery")

        if phase == "discovery":
            questions.extend(self._generate_discovery_questions(session, focus_areas))
        elif phase == "clarification":
            questions.extend(self._generate_clarification_questions(session, focus_areas))
        elif phase == "validation":
            questions.extend(self._generate_validation_questions(session, focus_areas))
        elif phase == "prioritization":
            questions.extend(self._generate_prioritization_questions(session, focus_areas))

        # Personalize questions based on user context
        if user_context:
            questions = self._personalize_questions(questions, user_context)

        # Rank questions by priority and relevance
        questions = self._rank_questions(questions, session)

        return questions[:10]  # Return top 10 questions

    def extract_and_create_requirements(self, session_id: str, user_input: str, context: Dict[str, Any] = None) -> List[Requirement]:
        """Extract and create requirements from user input"""
        if session_id not in self.active_sessions:
            return []

        session = self.active_sessions[session_id]
        user_context = self.user_contexts.get(session["user_id"])

        # Extract requirement candidates
        candidates = self._extract_requirements(user_input, context)
        created_requirements = []

        for candidate in candidates:
            if candidate["confidence"] >= self.config["confidence_threshold"]:
                # Create requirement
                requirement = Requirement(
                    title=candidate["title"],
                    description=candidate["description"],
                    requirement_type=candidate["type"],
                    priority=candidate.get("priority", RequirementPriority.MEDIUM),
                    source="user_input",
                    context={
                        "session_id": session_id,
                        "extraction_confidence": candidate["confidence"],
                        "source_text": candidate["source_text"],
                        "extraction_method": candidate["extraction_method"]
                    },
                    created_by=session["user_id"],
                    rationale=candidate.get("rationale"),
                    tags=candidate.get("tags", [])
                )

                self.requirements[requirement.requirement_id] = requirement
                session["requirements_identified"].append(requirement.requirement_id)
                created_requirements.append(requirement)

        # Update session phase if appropriate
        if len(created_requirements) > 0:
            self._update_session_phase(session_id)

        return created_requirements

    def validate_requirement(self, requirement_id: str, validation_criteria: Dict[str, Any] = None) -> Dict[str, Any]:
        """Validate a requirement against criteria"""
        if requirement_id not in self.requirements:
            return {"valid": False, "error": "Requirement not found"}

        requirement = self.requirements[requirement_id]
        validation_result = {
            "requirement_id": requirement_id,
            "validation_timestamp": datetime.now(),
            "is_valid": True,
            "validation_scores": {},
            "issues": [],
            "suggestions": []
        }

        # Basic validation rules
        validation_rules = {
            "title_clarity": self._validate_title_clarity(requirement),
            "description_completeness": self._validate_description_completeness(requirement),
            "acceptance_criteria_quality": self._validate_acceptance_criteria(requirement),
            "testability": self._validate_testability(requirement),
            "feasibility": self._validate_feasibility(requirement),
            "uniqueness": self._validate_uniqueness(requirement)
        }

        validation_result["validation_scores"] = validation_rules

        # Overall validity
        min_score = 0.6  # Minimum acceptable score
        validation_result["is_valid"] = all(score >= min_score for score in validation_rules.values())

        # Generate issues and suggestions
        for rule, score in validation_rules.items():
            if score < min_score:
                validation_result["issues"].append(f"{rule}: Score {score:.2f} below threshold")
                validation_result["suggestions"].extend(self._get_improvement_suggestions(rule, requirement))

        return validation_result

    def trace_requirements(self, source_requirement_id: str, target_artifact: str, relationship_type: str = "implements") -> RequirementTrace:
        """Create requirement traceability"""
        trace = RequirementTrace(
            requirement_id=source_requirement_id,
            trace_type="requirement_to_artifact",
            source_artifact=source_requirement_id,
            target_artifact=target_artifact,
            relationship_type=relationship_type,
            created_by="system"
        )

        self.traces[trace.trace_id] = trace
        return trace

    def get_requirement_analytics(self, session_id: str = None) -> Dict[str, Any]:
        """Get comprehensive requirement analytics"""
        requirements = list(self.requirements.values())

        if session_id:
            session = self.active_sessions.get(session_id)
            if session:
                requirement_ids = session.get("requirements_identified", [])
                requirements = [req for req in requirements if req.requirement_id in requirement_ids]

        analytics = {
            "total_requirements": len(requirements),
            "requirements_by_type": {},
            "requirements_by_priority": {},
            "requirements_by_status": {},
            "average_description_length": 0,
            "requirements_with_acceptance_criteria": 0,
            "complexity_distribution": {},
            "traceability_coverage": 0,
            "elicitation_effectiveness": self._calculate_elicitation_effectiveness(session_id)
        }

        if not requirements:
            return analytics

        # Calculate statistics
        total_desc_length = sum(len(req.description) for req in requirements)
        analytics["average_description_length"] = total_desc_length / len(requirements)
        analytics["requirements_with_acceptance_criteria"] = sum(1 for req in requirements if req.acceptance_criteria)

        # Group by various attributes
        for req in requirements:
            # By type
            req_type = req.requirement_type.value
            analytics["requirements_by_type"][req_type] = analytics["requirements_by_type"].get(req_type, 0) + 1

            # By priority
            priority = req.priority.value
            analytics["requirements_by_priority"][priority] = analytics["requirements_by_priority"].get(priority, 0) + 1

            # By status
            status = req.status.value
            analytics["requirements_by_status"][status] = analytics["requirements_by_status"].get(status, 0) + 1

        # Traceability coverage
        traced_requirements = set(trace.requirement_id for trace in self.traces.values())
        if requirements:
            analytics["traceability_coverage"] = len(traced_requirements.intersection(set(req.requirement_id for req in requirements))) / len(requirements)

        return analytics

    def suggest_requirement_improvements(self, requirement_id: str) -> Dict[str, Any]:
        """Suggest improvements for a requirement"""
        if requirement_id not in self.requirements:
            return {"error": "Requirement not found"}

        requirement = self.requirements[requirement_id]
        suggestions = {
            "requirement_id": requirement_id,
            "improvement_suggestions": [],
            "quality_score": 0,
            "priority_recommendations": [],
            "acceptance_criteria_suggestions": [],
            "dependency_recommendations": []
        }

        # Analyze and suggest improvements
        validation_result = self.validate_requirement(requirement_id)

        if not validation_result["is_valid"]:
            suggestions["improvement_suggestions"] = validation_result["suggestions"]

        # Quality score
        validation_scores = validation_result.get("validation_scores", {})
        if validation_scores:
            suggestions["quality_score"] = sum(validation_scores.values()) / len(validation_scores)

        # Priority recommendations
        if requirement.requirement_type == RequirementType.FUNCTIONAL:
            if requirement.priority in [RequirementPriority.LOW, RequirementPriority.OPTIONAL]:
                suggestions["priority_recommendations"].append("Consider increasing priority for functional requirements")

        # Acceptance criteria suggestions
        if not requirement.acceptance_criteria:
            suggestions["acceptance_criteria_suggestions"].append("Add specific, measurable acceptance criteria")
        elif len(requirement.acceptance_criteria) < 2:
            suggestions["acceptance_criteria_suggestions"].append("Consider adding more comprehensive acceptance criteria")

        # Dependency recommendations
        similar_requirements = self._find_similar_requirements(requirement)
        if similar_requirements:
            for similar_req in similar_requirements:
                if similar_req.requirement_id not in requirement.dependencies:
                    suggestions["dependency_recommendations"].append(f"Consider dependency on: {similar_req.title}")

        return suggestions

    def _determine_elicitation_strategy(self, initial_request: str) -> ElicitationStrategy:
        """Determine the best elicitation strategy based on the initial request"""
        request_lower = initial_request.lower()

        # Keywords for different strategies
        strategy_keywords = {
            ElicitationStrategy.INTERVIEW: ["tell me", "explain", "describe", "walk through"],
            ElicitationStrategy.WORKSHOP: ["collaborate", "team", "group", "workshop"],
            ElicitationStrategy.QUESTIONNAIRE: ["questions", "survey", "form", "checklist"],
            ElicitationStrategy.PROTOTYPING: ["prototype", "mockup", "demo", "example"],
            ElicitationStrategy.BRAINSTORMING: ["ideas", "brainstorm", "creative", "suggest"],
            ElicitationStrategy.ANALYSIS: ["analyze", "review", "examine", "existing"],
            ElicitationStrategy.DISCOVERY: ["explore", "discover", "find", "identify"]
        }

        # Find best matching strategy
        best_strategy = ElicitationStrategy.INTERVIEW  # Default
        best_score = 0

        for strategy, keywords in strategy_keywords.items():
            score = sum(1 for keyword in keywords if keyword in request_lower)
            if score > best_score:
                best_score = score
                best_strategy = strategy

        return best_strategy

    def _analyze_initial_request(self, session_id: str, initial_request: str):
        """Analyze the initial request to set up the session"""
        session = self.active_sessions[session_id]

        # Extract key information
        analysis = self._analyze_text(initial_request)

        # Update session context
        session["initial_analysis"] = analysis
        session["identified_entities"] = analysis.get("entities", [])
        session["key_topics"] = analysis.get("key_topics", [])
        session["complexity_assessment"] = analysis.get("complexity", "medium")

    def _analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze text for key information"""
        # Simplified text analysis - in production, would use NLP libraries
        analysis = {
            "word_count": len(text.split()),
            "sentence_count": len(text.split('.')),
            "sentiment": "neutral",
            "entities": [],
            "key_topics": [],
            "complexity": "medium"
        }

        # Extract potential requirement indicators
        requirement_indicators = [
            "should", "must", "shall", "will", "need to", "want to", "require",
            "support", "provide", "enable", "allow", "restrict", "prevent",
            "display", "show", "hide", "store", "process", "calculate"
        ]

        found_indicators = [indicator for indicator in requirement_indicators if indicator in text.lower()]
        analysis["requirement_indicators"] = found_indicators

        # Assess complexity
        if len(found_indicators) > 5 or analysis["word_count"] > 100:
            analysis["complexity"] = "high"
        elif len(found_indicators) < 2 or analysis["word_count"] < 30:
            analysis["complexity"] = "low"

        return analysis

    def _extract_requirements(self, text: str, context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Extract requirement candidates from text"""
        candidates = []

        # Pattern-based extraction
        patterns = [
            r"(?i)(?:the system|it|we)\s+(?:should|must|shall)\s+([^.]+)",
            r"(?i)(?:i|user)\s+(?:want|need)\s+(?:to|that)\s+([^.]+)",
            r"(?i)(?:ability|function|feature)\s+to\s+([^.]+)",
            r"(?i)(?:support|provide|enable)\s+([^.]+)",
        ]

        for i, pattern in enumerate(patterns):
            matches = re.findall(pattern, text)
            for match in matches:
                candidate = {
                    "title": f"Extracted Requirement {i+1}",
                    "description": match.strip(),
                    "type": RequirementType.FUNCTIONAL,
                    "priority": RequirementPriority.MEDIUM,
                    "confidence": 0.7,
                    "source_text": match,
                    "extraction_method": "pattern_matching"
                }
                candidates.append(candidate)

        return candidates

    def _generate_follow_up_questions(self, session_id: str, user_input: str) -> List[str]:
        """Generate follow-up questions based on user input"""
        questions = []

        # Generic follow-up templates
        templates = [
            "Can you provide more details about {}?",
            "What are the acceptance criteria for {}?",
            "Who are the stakeholders for {}?",
            "What are the constraints or limitations for {}?",
            "How will success be measured for {}?"
        ]

        # Extract key concepts and generate questions
        key_concepts = self._extract_key_concepts(user_input)

        for concept in key_concepts[:3]:  # Limit to top 3 concepts
            template = templates[len(questions) % len(templates)]
            questions.append(template.format(concept))

        return questions

    def _match_patterns(self, text: str) -> List[Dict[str, Any]]:
        """Match text against known requirement patterns"""
        matches = []

        for pattern_id, pattern in self.patterns.items():
            # Simple keyword matching
            keyword_matches = sum(1 for keyword in pattern.keywords if keyword.lower() in text.lower())

            if keyword_matches > 0:
                confidence = keyword_matches / len(pattern.keywords)

                if confidence >= pattern.confidence_threshold:
                    matches.append({
                        "pattern_id": pattern_id,
                        "pattern_name": pattern.name,
                        "pattern_type": pattern.pattern_type.value,
                        "confidence": confidence,
                        "matched_keywords": [kw for kw in pattern.keywords if kw.lower() in text.lower()]
                    })

        return sorted(matches, key=lambda x: x["confidence"], reverse=True)

    def _calculate_confidence_scores(self, text: str) -> Dict[str, float]:
        """Calculate confidence scores for different aspects"""
        scores = {
            "requirement_clarity": 0.8,
            "completeness": 0.7,
            "testability": 0.6,
            "feasibility": 0.8
        }

        # Adjust scores based on text characteristics
        if len(text.split()) < 10:
            scores["completeness"] *= 0.5

        if "test" in text.lower() or "verify" in text.lower():
            scores["testability"] *= 1.2

        return scores

    def _determine_next_actions(self, session_id: str, user_input: str) -> List[str]:
        """Determine recommended next actions"""
        actions = []

        session = self.active_sessions.get(session_id, {})
        phase = session.get("current_phase", "discovery")

        if phase == "discovery":
            actions.extend([
                "ask_clarifying_questions",
                "identify_stakeholders",
                "define_scope"
            ])
        elif phase == "clarification":
            actions.extend([
                "validate_understanding",
                "refine_requirements",
                "identify_dependencies"
            ])
        elif phase == "validation":
            actions.extend([
                "review_acceptance_criteria",
                "verify_completeness",
                "assess_feasibility"
            ])

        return actions

    def _generate_discovery_questions(self, session: Dict[str, Any], focus_areas: List[str] = None) -> List[ElicitationQuestion]:
        """Generate discovery phase questions"""
        questions = []

        # Basic discovery questions
        discovery_questions = [
            "What problem are you trying to solve?",
            "Who will use this system?",
            "What are the main goals and objectives?",
            "What are the current pain points?",
            "What does success look like?"
        ]

        for question_text in discovery_questions:
            question = ElicitationQuestion(
                question_text=question_text,
                question_type=QuestionType.OPEN_ENDED,
                category="discovery"
            )
            questions.append(question)

        return questions

    def _generate_clarification_questions(self, session: Dict[str, Any], focus_areas: List[str] = None) -> List[ElicitationQuestion]:
        """Generate clarification phase questions"""
        questions = []

        # Get identified requirements
        requirement_ids = session.get("requirements_identified", [])

        for req_id in requirement_ids:
            if req_id in self.requirements:
                req = self.requirements[req_id]

                if not req.acceptance_criteria:
                    question = ElicitationQuestion(
                        question_text=f"What are the acceptance criteria for '{req.title}'?",
                        question_type=QuestionType.ELICITATION,
                        category="acceptance_criteria",
                        context={"requirement_id": req_id}
                    )
                    questions.append(question)

        return questions

    def _generate_validation_questions(self, session: Dict[str, Any], focus_areas: List[str] = None) -> List[ElicitationQuestion]:
        """Generate validation phase questions"""
        questions = []

        validation_questions = [
            "Are these requirements complete?",
            "Are there any missing requirements?",
            "Do these requirements conflict with each other?",
            "Are all requirements feasible?",
            "Have all stakeholders been considered?"
        ]

        for question_text in validation_questions:
            question = ElicitationQuestion(
                question_text=question_text,
                question_type=QuestionType.VALIDATION,
                category="validation"
            )
            questions.append(question)

        return questions

    def _generate_prioritization_questions(self, session: Dict[str, Any], focus_areas: List[str] = None) -> List[ElicitationQuestion]:
        """Generate prioritization phase questions"""
        questions = []

        prioritization_questions = [
            "Which requirements are most critical?",
            "What are the must-have versus nice-to-have features?",
            "What are the implementation priorities?",
            "Are there any dependencies between requirements?",
            "What constraints might affect prioritization?"
        ]

        for question_text in prioritization_questions:
            question = ElicitationQuestion(
                question_text=question_text,
                question_type=QuestionType.RANKING,
                category="prioritization"
            )
            questions.append(question)

        return questions

    def _personalize_questions(self, questions: List[ElicitationQuestion], user_context: UserContext) -> List[ElicitationQuestion]:
        """Personalize questions based on user context"""
        # Adjust question complexity based on expertise level
        if user_context.expertise_level == "beginner":
            # Simplify questions for beginners
            for question in questions:
                if "technical" in question.category:
                    question.question_text = f"Can you explain in simple terms: {question.question_text}"

        elif user_context.expertise_level == "expert":
            # Add technical depth for experts
            for question in questions:
                if question.category == "general":
                    question.question_text = f"From a technical perspective: {question.question_text}"

        return questions

    def _rank_questions(self, questions: List[ElicitationQuestion], session: Dict[str, Any]) -> List[ElicitationQuestion]:
        """Rank questions by priority and relevance"""
        # Simple ranking based on priority and session context
        def question_score(q):
            score = 0

            # Priority weight
            priority_weights = {
                RequirementPriority.CRITICAL: 4,
                RequirementPriority.HIGH: 3,
                RequirementPriority.MEDIUM: 2,
                RequirementPriority.LOW: 1,
                RequirementPriority.OPTIONAL: 0.5
            }
            score += priority_weights.get(q.priority, 2)

            # Category relevance based on session phase
            phase = session.get("current_phase", "discovery")
            if phase == "discovery" and q.category in ["discovery", "general"]:
                score += 2
            elif phase == "clarification" and q.category in ["clarification", "acceptance_criteria"]:
                score += 2
            elif phase == "validation" and q.category == "validation":
                score += 2
            elif phase == "prioritization" and q.category == "prioritization":
                score += 2

            return score

        return sorted(questions, key=question_score, reverse=True)

    def _update_session_phase(self, session_id: str):
        """Update session phase based on progress"""
        session = self.active_sessions[session_id]
        requirement_count = len(session.get("requirements_identified", []))
        interaction_count = session.get("interaction_count", 0)

        # Determine next phase
        if requirement_count == 0:
            session["current_phase"] = "discovery"
        elif requirement_count < 5:
            session["current_phase"] = "clarification"
        elif interaction_count < 10:
            session["current_phase"] = "validation"
        else:
            session["current_phase"] = "prioritization"

    def _validate_title_clarity(self, requirement: Requirement) -> float:
        """Validate requirement title clarity"""
        score = 1.0

        # Check title length
        if len(requirement.title) < 5:
            score *= 0.5
        elif len(requirement.title) > 100:
            score *= 0.8

        # Check for clear action words
        action_words = ["shall", "should", "must", "will", "provide", "enable", "support", "allow"]
        if not any(word in requirement.title.lower() for word in action_words):
            score *= 0.7

        # Check ambiguity
        ambiguous_words = ["etc", "various", "multiple", "several"]
        if any(word in requirement.title.lower() for word in ambiguous_words):
            score *= 0.8

        return min(score, 1.0)

    def _validate_description_completeness(self, requirement: Requirement) -> float:
        """Validate requirement description completeness"""
        score = 0.5  # Base score

        # Length requirement
        if len(requirement.description) > 50:
            score += 0.2
        if len(requirement.description) > 150:
            score += 0.1

        # Information elements
        if any(word in requirement.description.lower() for word in ["who", "user", "actor"]):
            score += 0.1
        if any(word in requirement.description.lower() for word in ["when", "trigger", "condition"]):
            score += 0.1
        if any(word in requirement.description.lower() for word in ["what", "output", "result"]):
            score += 0.1

        return min(score, 1.0)

    def _validate_acceptance_criteria(self, requirement: Requirement) -> float:
        """Validate acceptance criteria quality"""
        if not requirement.acceptance_criteria:
            return 0.0

        score = 0.5

        # Number of criteria
        if len(requirement.acceptance_criteria) >= 2:
            score += 0.2
        if len(requirement.acceptance_criteria) >= 3:
            score += 0.1

        # Testability indicators
        testable_indicators = ["verify", "validate", "check", "ensure", "confirm"]
        testable_count = sum(1 for criteria in requirement.acceptance_criteria
                           if any(indicator in criteria.lower() for indicator in testable_indicators))

        if testable_count > 0:
            score += 0.2 * (testable_count / len(requirement.acceptance_criteria))

        return min(score, 1.0)

    def _validate_testability(self, requirement: Requirement) -> float:
        """Validate requirement testability"""
        score = 0.5

        # Check for measurable outcomes
        measurable_words = ["number", "count", "percentage", "time", "within", "less than", "greater than"]
        if any(word in requirement.description.lower() for word in measurable_words):
            score += 0.2

        # Check for clear conditions
        conditional_words = ["if", "when", "then", "given", "when", "then"]
        if any(word in requirement.description.lower() for word in conditional_words):
            score += 0.2

        # Check acceptance criteria
        if requirement.acceptance_criteria:
            score += 0.1

        return min(score, 1.0)

    def _validate_feasibility(self, requirement: Requirement) -> float:
        """Validate requirement feasibility"""
        # Simplified feasibility check
        score = 0.8  # Default to mostly feasible

        # Check for impossible indicators
        impossible_words = ["impossible", "cannot", "never", "always"]
        if any(word in requirement.description.lower() for word in impossible_words):
            score -= 0.3

        # Check for complexity indicators
        complexity_words = ["complex", "difficult", "challenging"]
        if any(word in requirement.description.lower() for word in complexity_words):
            score -= 0.1

        return max(score, 0.0)

    def _validate_uniqueness(self, requirement: Requirement) -> float:
        """Validate requirement uniqueness"""
        similar_requirements = self._find_similar_requirements(requirement)

        if not similar_requirements:
            return 1.0

        # Calculate similarity score
        total_similarity = sum(req["similarity"] for req in similar_requirements)
        avg_similarity = total_similarity / len(similar_requirements)

        return max(0.0, 1.0 - avg_similarity)

    def _get_improvement_suggestions(self, rule: str, requirement: Requirement) -> List[str]:
        """Get improvement suggestions for a specific validation rule"""
        suggestions = []

        rule_suggestions = {
            "title_clarity": [
                "Make the title more specific and action-oriented",
                "Include clear action words like 'shall', 'should', or 'must'",
                "Remove ambiguous terms like 'etc' or 'various'"
            ],
            "description_completeness": [
                "Add more details about who, what, when, where, why",
                "Include context and background information",
                "Describe the expected outcomes and benefits"
            ],
            "acceptance_criteria_quality": [
                "Add specific, measurable acceptance criteria",
                "Include testable conditions and expected results",
                "Define clear pass/fail criteria"
            ],
            "testability": [
                "Add measurable success criteria",
                "Define clear test conditions",
                "Include expected outputs and behaviors"
            ],
            "feasibility": [
                "Review technical constraints and limitations",
                "Consider available resources and capabilities",
                "Break down complex requirements into smaller ones"
            ],
            "uniqueness": [
                "Check for duplicate or overlapping requirements",
                "Consolidate similar requirements",
                "Ensure each requirement has a distinct purpose"
            ]
        }

        return rule_suggestions.get(rule, ["Review and refine the requirement"])

    def _find_similar_requirements(self, requirement: Requirement) -> List[Dict[str, Any]]:
        """Find similar requirements"""
        similar = []

        for other_id, other_req in self.requirements.items():
            if other_id == requirement.requirement_id:
                continue

            # Simple similarity check
            similarity = self._calculate_similarity(requirement, other_req)

            if similarity > 0.5:
                similar.append({
                    "requirement_id": other_id,
                    "title": other_req.title,
                    "similarity": similarity
                })

        return sorted(similar, key=lambda x: x["similarity"], reverse=True)

    def _calculate_similarity(self, req1: Requirement, req2: Requirement) -> float:
        """Calculate similarity between two requirements"""
        # Simple text similarity
        text1 = f"{req1.title} {req1.description}".lower()
        text2 = f"{req2.title} {req2.description}".lower()

        # Word overlap
        words1 = set(text1.split())
        words2 = set(text2.split())

        if not words1 or not words2:
            return 0.0

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        return len(intersection) / len(union)

    def _extract_key_concepts(self, text: str) -> List[str]:
        """Extract key concepts from text"""
        # Simple keyword extraction
        stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "can", "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "her", "its", "our", "their"}

        words = text.lower().split()
        words = [word.strip(".,!?;:") for word in words if word not in stop_words and len(word) > 2]

        # Return most frequent words
        from collections import Counter
        word_counts = Counter(words)

        return [word for word, count in word_counts.most_common(5)]

    def _calculate_elicitation_effectiveness(self, session_id: str = None) -> float:
        """Calculate elicitation effectiveness score"""
        if not session_id:
            return 0.7  # Default effectiveness

        session = self.active_sessions.get(session_id)
        if not session:
            return 0.0

        # Factors affecting effectiveness
        factors = {
            "requirement_count": min(len(session.get("requirements_identified", [])) / 10, 1.0),
            "interaction_efficiency": 1.0 - min(session.get("interaction_count", 0) / 20, 1.0),
            "phase_progress": 0.8 if session.get("current_phase") in ["validation", "prioritization"] else 0.5
        }

        return sum(factors.values()) / len(factors)

    def _load_default_patterns(self):
        """Load default requirement patterns"""
        default_patterns = [
            RequirementPattern(
                name="User Authentication",
                description="Pattern for user authentication requirements",
                pattern_type=RequirementType.FUNCTIONAL,
                keywords=["login", "authenticate", "signin", "password", "credential"],
                context_clues=["security", "access", "user account"],
                question_templates=[
                    "What authentication methods should be supported?",
                    "What are the password requirements?",
                    "Should users be able to reset their passwords?"
                ]
            ),
            RequirementPattern(
                name="Data Reporting",
                description="Pattern for reporting and analytics requirements",
                pattern_type=RequirementType.FUNCTIONAL,
                keywords=["report", "analytics", "dashboard", "chart", "graph"],
                context_clues=["data", "visualization", "metrics"],
                question_templates=[
                    "What data should be included in the reports?",
                    "What format should the reports be in?",
                    "How often should reports be generated?"
                ]
            ),
            RequirementPattern(
                name="Performance Requirements",
                description="Pattern for performance and scalability requirements",
                pattern_type=RequirementType.NON_FUNCTIONAL,
                keywords=["performance", "speed", "response time", "scalability", "load"],
                context_clues=["fast", "responsive", "efficient"],
                question_templates=[
                    "What are the acceptable response times?",
                    "How many users should the system support?",
                    "What are the peak usage requirements?"
                ]
            )
        ]

        for pattern in default_patterns:
            self.patterns[pattern.pattern_id] = pattern

# Global engine instance
requirement_engine = RequirementElicitationEngine()