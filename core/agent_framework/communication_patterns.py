"""
CE Hub Enhanced Communication Patterns

This module implements sophisticated communication patterns for CE Hub agents,
including intelligent requirement gathering, progressive disclosure, contextual
updates, and multi-agent coordination protocols.
"""

from typing import Dict, List, Any, Optional, Union, Callable, Type
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import json
import logging
from pathlib import Path
import re
from abc import ABC, abstractmethod

# Local imports
from .cehub_dependencies import (
    CEHubDependencies,
    CEHubRunContext,
    ProjectRequirements,
    RequirementQuestion,
    ValidationResult
)


class CommunicationMode(str, Enum):
    """Different modes of communication"""
    INTERACTIVE = "interactive"  # Back-and-forth conversation
    PROGRESSIVE = "progressive"  # Progressive disclosure of information
    BATCH = "batch"  # Collect all requirements upfront
    STREAMING = "streaming"  # Real-time updates
    DEFERRED = "deferred"  # Minimal interaction, async updates


class InformationDepth(str, Enum):
    """Depth levels for information disclosure"""
    MINIMAL = "minimal"  # Just essential information
    SUMMARY = "summary"  # High-level overview
    DETAILED = "detailed"  # Comprehensive information
    TECHNICAL = "technical"  # Deep technical details
    DEBUG = "debug"  # Full debugging information


class UpdatePriority(str, Enum):
    """Priority levels for updates"""
    CRITICAL = "critical"  # Immediate attention required
    HIGH = "high"  # Important information
    NORMAL = "normal"  # Regular updates
    LOW = "low"  " Nice-to-have information
    DEBUG = "debug"  # Debugging information


@dataclass
class CommunicationContext:
    """Context for communication interactions"""
    user_id: str
    session_id: str
    conversation_history: List[Dict[str, Any]] = field(default_factory=list)
    user_preferences: Dict[str, Any] = field(default_factory=dict)
    current_task: Optional[str] = None
    communication_mode: CommunicationMode = CommunicationMode.INTERACTIVE
    information_depth: InformationDepth = InformationDepth.SUMMARY
    update_frequency: timedelta = field(default_factory=lambda: timedelta(minutes=5))

    @classmethod
    def create(cls, user_id: str, session_id: str) -> 'CommunicationContext':
        """Create a new communication context"""
        return cls(
            user_id=user_id,
            session_id=session_id,
            conversation_history=[],
            user_preferences={},
            current_task=None,
            communication_mode=CommunicationMode.INTERACTIVE,
            information_depth=InformationDepth.SUMMARY
        )


@dataclass
class CommunicationMessage:
    """A structured communication message"""
    message_id: str
    timestamp: datetime
    sender: str
    recipient: str
    message_type: str
    content: str
    priority: UpdatePriority = UpdatePriority.NORMAL
    metadata: Dict[str, Any] = field(default_factory=dict)
    attachments: List[str] = field(default_factory=list)
    requires_response: bool = False
    response_deadline: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "message_id": self.message_id,
            "timestamp": self.timestamp.isoformat(),
            "sender": self.sender,
            "recipient": self.recipient,
            "message_type": self.message_type,
            "content": self.content,
            "priority": self.priority.value,
            "metadata": self.metadata,
            "attachments": self.attachments,
            "requires_response": self.requires_response,
            "response_deadline": self.response_deadline.isoformat() if self.response_deadline else None
        }


@dataclass
class UpdateMessage:
    """A progress update message"""
    update_id: str
    task_id: str
    timestamp: datetime
    status: str
    progress_percentage: float
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    next_steps: List[str] = field(default_factory=list)
    blockers: List[str] = field(default_factory=list)
    estimated_completion: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "update_id": self.update_id,
            "task_id": self.task_id,
            "timestamp": self.timestamp.isoformat(),
            "status": self.status,
            "progress_percentage": self.progress_percentage,
            "message": self.message,
            "details": self.details,
            "next_steps": self.next_steps,
            "blockers": self.blockers,
            "estimated_completion": self.estimated_completion.isoformat() if self.estimated_completion else None
        }


class RequirementGatherer:
    """Intelligent requirement gathering with adaptive questioning"""

    def __init__(self, dependencies: CEHubDependencies):
        self.deps = dependencies
        self.logger = logging.getLogger("requirement_gatherer")
        self.question_bank = self._initialize_question_bank()
        self.context_analyzer = ContextAnalyzer(dependencies)

    async def gather_comprehensive_requirements(
        self,
        initial_input: str,
        context: CommunicationContext,
        mode: CommunicationMode = CommunicationMode.INTERACTIVE
    ) -> ProjectRequirements:
        """
        Gather comprehensive requirements using adaptive questioning

        Args:
            initial_input: Initial user input
            context: Communication context
            mode: Communication mode to use

        Returns:
            Comprehensive project requirements
        """
        self.logger.info(f"Starting requirement gathering in {mode.value} mode")

        # Analyze initial input and context
        analysis = await self.context_analyzer.analyze_input(initial_input, context)

        # Generate requirement questions
        questions = await self._generate_adaptive_questions(analysis, context, mode)

        # Collect answers based on mode
        if mode == CommunicationMode.INTERACTIVE:
            answers = await self._interactive_questioning(questions, context)
        elif mode == CommunicationMode.PROGRESSIVE:
            answers = await self._progressive_questioning(questions, context)
        elif mode == CommunicationMode.BATCH:
            answers = await self._batch_questioning(questions, context)
        else:
            answers = await self._minimal_questioning(questions, context)

        # Build requirements from answers
        requirements = await self._build_requirements_from_answers(
            initial_input, analysis, answers, context
        )

        # Validate and refine requirements
        validated_requirements = await self._validate_and_refine_requirements(
            requirements, context
        )

        return validated_requirements

    async def _generate_adaptive_questions(
        self,
        analysis: Dict[str, Any],
        context: CommunicationContext,
        mode: CommunicationMode
    ) -> List[RequirementQuestion]:
        """Generate adaptive questions based on analysis and context"""
        questions = []

        # Core questions for all modes
        core_questions = [
            RequirementQuestion(
                question="What is the primary goal or objective of this task?",
                type="text",
                required=True,
                validation_rule="non_empty"
            ),
            RequirementQuestion(
                question="What does success look like for this task? How will we know it's completed correctly?",
                type="text",
                required=True,
                validation_rule="non_empty"
            ),
            RequirementQuestion(
                question="Are there any specific technical constraints or limitations we need to consider?",
                type="text",
                required=False
            )
        ]

        questions.extend(core_questions)

        # Mode-specific questions
        if mode in [CommunicationMode.INTERACTIVE, CommunicationMode.PROGRESSIVE]:
            # Add more detailed questions for interactive modes
            detailed_questions = [
                RequirementQuestion(
                    question="Which parts of the existing codebase might this task affect?",
                    type="text",
                    required=False
                ),
                RequirementQuestion(
                    question="Are there any existing patterns or conventions we should follow?",
                    type="text",
                    required=False
                ),
                RequirementQuestion(
                    question="What level of testing is required for this task?",
                    type="choice",
                    options=["basic", "comprehensive", "production-grade"],
                    required=False
                ),
                RequirementQuestion(
                    question="Are there any performance or security requirements we should consider?",
                    type="text",
                    required=False
                )
            ]
            questions.extend(detailed_questions)

        # Context-aware questions based on analysis
        complexity = analysis.get("complexity", "moderate")
        if complexity in ["complex", "expert"]:
            complexity_questions = [
                RequirementQuestion(
                    question="This appears to be a complex task. Are there any dependencies or prerequisites we should be aware of?",
                    type="text",
                    required=False
                ),
                RequirementQuestion(
                    question="What is the timeline or deadline for this task?",
                    type="text",
                    required=False
                )
            ]
            questions.extend(complexity_questions)

        # Project-specific questions
        project_type = analysis.get("project_type", "unknown")
        if project_type in ["web_application", "api_service"]:
            web_questions = [
                RequirementQuestion(
                    question="What browsers or platforms should this support?",
                    type="choice",
                    options=["Chrome, Firefox, Safari, Edge", "Chrome only", "Mobile responsive", "Desktop only"],
                    required=False
                )
            ]
            questions.extend(web_questions)

        return questions

    async def _interactive_questioning(
        self,
        questions: List[RequirementQuestion],
        context: CommunicationContext
    ) -> Dict[str, str]:
        """Interactive questioning with back-and-forth conversation"""
        answers = {}

        await self._send_message(
            "I need to gather some information to ensure I deliver exactly what you need. "
            "Let me ask you a few questions about your requirements.",
            context
        )

        for i, question in enumerate(questions):
            # Add progress indicator
            await self._send_message(
                f"Question {i+1} of {len(questions)}:",
                context
            )

            # Ask the question
            answer = await self._ask_question(question, context)
            answers[question.question] = answer

            # Adaptive follow-up based on answer
            follow_up = await self._generate_follow_up_question(question, answer, context)
            if follow_up:
                follow_up_answer = await self._ask_question(follow_up, context)
                answers[f"{question.question}_follow_up"] = follow_up_answer

            # Check for understanding after key questions
            if i == len(questions) // 2:  # Mid-point check
                await self._check_understanding(answers, context)

        return answers

    async def _progressive_questioning(
        self,
        questions: List[RequirementQuestion],
        context: CommunicationContext
    ) -> Dict[str, str]:
        """Progressive questioning with information disclosure"""
        answers = {}

        # Start with high-level questions
        high_level_questions = [q for q in questions if q.required][:3]

        await self._send_message(
            "Let's start with the essential requirements, then we can dive into details as needed.",
            context
        )

        # Ask high-level questions first
        for question in high_level_questions:
            answer = await self._ask_question(question, context)
            answers[question.question] = answer

        # Determine if more detail is needed
        needs_detail = await self._assess_need_for_detail(answers, context)

        if needs_detail:
            detail_questions = [q for q in questions if not q.required]

            await self._send_message(
                "Based on your answers, I have a few more detailed questions to ensure I get everything right.",
                context
            )

            for question in detail_questions:
                answer = await self._ask_question(question, context)
                answers[question.question] = answer

        return answers

    async def _batch_questioning(
        self,
        questions: List[RequirementQuestion],
        context: CommunicationContext
    ) -> Dict[str, Any]:
        """Batch questioning - collect all questions at once"""
        # Create a comprehensive question form
        question_text = self._format_batch_questions(questions)

        await self._send_message(
            "I'll ask all the questions at once to be efficient. Please provide detailed answers to help me understand your requirements completely.",
            context
        )

        answer = await self._ask_question(question_text, context)

        # Parse the batch answer
        answers = self._parse_batch_answer(answer, questions)

        return answers

    async def _minimal_questioning(
        self,
        questions: List[RequirementQuestion],
        context: CommunicationContext
    ) -> Dict[str, str]:
        """Minimal questioning - only essential questions"""
        essential_questions = [q for q in questions if q.required][:2]

        answers = {}
        for question in essential_questions:
            answer = await self._ask_question(question, context)
            answers[question.question] = answer

        return answers

    def _initialize_question_bank(self) -> Dict[str, List[RequirementQuestion]]:
        """Initialize a bank of reusable questions"""
        return {
            "web_development": [
                RequirementQuestion(
                    question="What responsive design requirements do you have?",
                    type="choice",
                    options=["Mobile-first", "Desktop-first", "Fully responsive", "Single device"],
                    required=False
                ),
                RequirementQuestion(
                    question="Which modern browsers need to be supported?",
                    type="multiple_choice",
                    options=["Chrome", "Firefox", "Safari", "Edge", "IE11"],
                    required=False
                )
            ],
            "api_development": [
                RequirementQuestion(
                    question="What authentication method should be used?",
                    type="choice",
                    options=["JWT", "OAuth2", "API Key", "Session-based", "None"],
                    required=False
                ),
                RequirementQuestion(
                    question="What is the expected request volume?",
                    type="choice",
                    options=["<100/day", "100-1000/day", "1000-10000/day", ">10000/day"],
                    required=False
                )
            ],
            "database": [
                RequirementQuestion(
                    question="What data consistency requirements exist?",
                    type="choice",
                    options=["Strong consistency", "Eventual consistency", "No requirements"],
                    required=False
                ),
                RequirementQuestion(
                    question="Are there any data retention or compliance requirements?",
                    type="text",
                    required=False
                )
            ],
            "security": [
                RequirementQuestion(
                    question="What level of security is required?",
                    type="choice",
                    options=["Basic", "Standard", "High security", "Enterprise grade"],
                    required=False
                ),
                RequirementQuestion(
                    question="Are there any specific compliance requirements (GDPR, HIPAA, etc.)?",
                    type="multiple_choice",
                    options=["GDPR", "HIPAA", "SOC2", "PCI-DSS", "None"],
                    required=False
                )
            ],
            "performance": [
                RequirementQuestion(
                    question="What are the performance requirements?",
                    type="text",
                    required=False
                ),
                RequirementQuestion(
                    question="Are there any specific scalability requirements?",
                    type="choice",
                    options=["Small scale", "Medium scale", "Large scale", "Enterprise scale"],
                    required=False
                )
            ]
        }

    async def _generate_follow_up_question(
        self,
        original_question: RequirementQuestion,
        answer: str,
        context: CommunicationContext
    ) -> Optional[str]:
        """Generate intelligent follow-up questions"""
        answer_lower = answer.lower()

        # Follow-up patterns based on answer content
        if "api" in answer_lower:
            return "What kind of API endpoints do you need? (REST, GraphQL, etc.)"
        elif "database" in answer_lower:
            return "Do you have a preference for the database type or should I recommend one?"
        elif "security" in answer_lower or "authentication" in answer_lower:
            return "Are there specific security standards or compliance requirements we need to meet?"
        elif "performance" in answer_lower or "scalability" in answer_lower:
            return "What are the expected traffic patterns or user loads?"
        elif "mobile" in answer_lower or "responsive" in answer_lower:
            return "Should we prioritize mobile experience or ensure parity across all devices?"
        elif "test" in answer_lower:
            return "What testing framework or approach do you prefer?"

        return None

    def _format_batch_questions(self, questions: List[RequirementQuestion]) -> str:
        """Format questions for batch asking"""
        formatted = "Please answer the following questions:\n\n"

        for i, question in enumerate(questions, 1):
            formatted += f"{i}. {question.question}"

            if question.options:
                formatted += f"\n   Options: {', '.join(question.options)}"

            if question.required:
                formatted += " (Required)"

            formatted += "\n\n"

        formatted += "Please provide your answers, numbering them to match the questions."
        return formatted

    def _parse_batch_answer(self, answer: str, questions: List[RequirementQuestion]) -> Dict[str, str]:
        """Parse batch answer into individual question responses"""
        answers = {}

        # Try to match numbered answers
        numbered_pattern = r'(\d+)\.\s*(.*?)(?=\n\d+\.|\n*$)'
        matches = re.findall(numbered_pattern, answer, re.DOTALL)

        for match in matches:
            question_num = int(match[0]) - 1  # Convert to 0-based index
            if 0 <= question_num < len(questions):
                answers[questions[question_num].question] = match[1].strip()

        # If numbered parsing failed, try to match by content
        if not answers:
            for question in questions:
                question_lower = question.question.lower()
                answer_lower = answer.lower()

                # Simple keyword matching
                if any(keyword in answer_lower for keyword in question_lower.split()[:3]):
                    answers[question.question] = answer

        return answers

    # Helper methods for communication
    async def _send_message(self, message: str, context: CommunicationContext):
        """Send a message to the user"""
        await self.deps.send_update(message)

    async def _ask_question(self, question: str, context: CommunicationContext) -> str:
        """Ask a question and get response"""
        return await self.deps.ask_question(question)

    async def _check_understanding(self, answers: Dict[str, str], context: CommunicationContext):
        """Check understanding with user"""
        summary = self._generate_requirements_summary(answers)
        confirmed = await self.deps.ask_question(
            f"Based on your answers, here's what I understand:\n\n{summary}\n\nIs this correct?",
            ["yes", "no", "needs clarification"]
        )
        return confirmed.lower() in ["yes", "correct", "confirmed"]

    def _generate_requirements_summary(self, answers: Dict[str, str]) -> str:
        """Generate a summary of gathered requirements"""
        summary_parts = []

        for question, answer in answers.items():
            if answer.strip():
                summary_parts.append(f"• {question}: {answer}")

        return "\n".join(summary_parts)

    async def _assess_need_for_detail(self, answers: Dict[str, str], context: CommunicationContext) -> bool:
        """Assess if more detail is needed based on current answers"""
        # Simple heuristic: if answers are too short, need more detail
        total_length = sum(len(answer) for answer in answers.values())
        avg_length = total_length / len(answers) if answers else 0

        return avg_length < 50  # If average answer is less than 50 characters

    async def _build_requirements_from_answers(
        self,
        initial_input: str,
        analysis: Dict[str, Any],
        answers: Dict[str, str],
        context: CommunicationContext
    ) -> ProjectRequirements:
        """Build requirements from answers"""
        # Extract key information from answers
        goal = answers.get("What is the primary goal or objective of this task?", "")
        success_criteria = answers.get("What does success look like for this task?", "")
        constraints = answers.get("Are there any specific technical constraints or limitations we need to consider?", "")

        # Split success criteria into list
        success_list = [criteria.strip() for criteria in success_criteria.split('\n') if criteria.strip()]

        # Split constraints into list
        constraint_list = [constraint.strip() for constraint in constraints.split('\n') if constraint.strip()]

        return ProjectRequirements(
            title=self._extract_title(initial_input, goal),
            description=initial_input,
            success_criteria=success_list or [success_criteria],
            technical_constraints=constraint_list,
            # Add other fields as needed
        )

    def _extract_title(self, initial_input: str, goal: str) -> str:
        """Extract a suitable title from input and goal"""
        # Use goal if available, otherwise use first line of input
        if goal and len(goal.strip()) > 10:
            return goal.strip()[:100]

        first_line = initial_input.split('\n')[0].strip()
        return first_line[:100] if first_line else "Untitled Task"

    async def _validate_and_refine_requirements(
        self,
        requirements: ProjectRequirements,
        context: CommunicationContext
    ) -> ProjectRequirements:
        """Validate and refine requirements"""
        # Basic validation
        if not requirements.success_criteria:
            requirements.success_criteria = ["Complete the task as specified"]

        if not requirements.title or len(requirements.title.strip()) == 0:
            requirements.title = "Task Implementation"

        return requirements


class ContextAnalyzer:
    """Analyzes input and context for intelligent communication"""

    def __init__(self, dependencies: CEHubDependencies):
        self.deps = dependencies
        self.logger = logging.getLogger("context_analyzer")

    async def analyze_input(
        self,
        user_input: str,
        context: CommunicationContext
    ) -> Dict[str, Any]:
        """
        Analyze user input and context to understand requirements

        Returns:
            Analysis results with recommendations
        """
        analysis = {
            "complexity": "moderate",
            "project_type": "unknown",
            "technical_requirements": [],
            "ambiguity_score": 0.0,
            "missing_information": [],
            "suggested_approach": "standard",
            "estimated_effort": "2-4 hours",
            "risk_factors": []
        }

        try:
            # Analyze complexity
            analysis["complexity"] = self._assess_complexity(user_input)

            # Detect project type
            analysis["project_type"] = self._detect_project_type(user_input)

            # Identify technical requirements
            analysis["technical_requirements"] = self._identify_technical_requirements(user_input)

            # Calculate ambiguity score
            analysis["ambiguity_score"] = self._calculate_ambiguity(user_input)

            # Identify missing information
            analysis["missing_information"] = self._identify_missing_information(user_input, context)

            # Suggest approach
            analysis["suggested_approach"] = self._suggest_approach(user_input, analysis)

            # Estimate effort
            analysis["estimated_effort"] = self._estimate_effort(user_input, analysis)

            # Identify risk factors
            analysis["risk_factors"] = self._identify_risk_factors(user_input, analysis)

        except Exception as e:
            self.logger.error(f"Error analyzing input: {e}")
            analysis["analysis_error"] = str(e)

        return analysis

    def _assess_complexity(self, user_input: str) -> str:
        """Assess the complexity of the user's request"""
        complexity_keywords = {
            "simple": ["simple", "basic", "quick", "minor", "small", "fix typo", "change text"],
            "moderate": ["feature", "implement", "create", "build", "add", "modify", "update"],
            "complex": ["system", "architecture", "integration", "refactor", "migration", "multiple"],
            "expert": ["performance", "security", "scalability", "optimization", "advanced"]
        }

        input_lower = user_input.lower()
        complexity_scores = {level: 0 for level in complexity_keywords}

        for level, keywords in complexity_keywords.items():
            for keyword in keywords:
                if keyword in input_lower:
                    complexity_scores[level] += 1

        # Return the highest scoring complexity
        if complexity_scores["expert"] > 0:
            return "expert"
        elif complexity_scores["complex"] > 0:
            return "complex"
        elif complexity_scores["moderate"] > 0:
            return "moderate"
        else:
            return "simple"

    def _detect_project_type(self, user_input: str) -> str:
        """Detect the type of project based on user input"""
        type_indicators = {
            "web_application": ["website", "web app", "frontend", "ui", "user interface"],
            "api_service": ["api", "service", "endpoint", "backend", "rest", "graphql"],
            "mobile_app": ["mobile", "ios", "android", "app", "responsive"],
            "data_pipeline": ["data", "pipeline", "etl", "processing", "analytics"],
            "automation_workflow": ["automation", "workflow", "script", "process", "batch"],
            "database": ["database", "schema", "migration", "sql", "nosql"],
            "testing": ["test", "testing", "qa", "quality assurance", "unit test"],
            "documentation": ["documentation", "docs", "readme", "guide", "manual"]
        }

        input_lower = user_input.lower()
        type_scores = {project_type: 0 for project_type in type_indicators}

        for project_type, indicators in type_indicators.items():
            for indicator in indicators:
                if indicator in input_lower:
                    type_scores[project_type] += 1

        # Return the type with highest score
        if max(type_scores.values()) > 0:
            return max(type_scores, key=type_scores.get)
        else:
            return "unknown"

    def _identify_technical_requirements(self, user_input: str) -> List[str]:
        """Identify technical requirements from user input"""
        requirements = []
        input_lower = user_input.lower()

        tech_indicators = {
            "database": ["database", "data storage", "persistence", "sql", "nosql"],
            "authentication": ["auth", "login", "user", "authentication", "authorization"],
            "api": ["api", "endpoint", "service", "rest", "graphql"],
            "frontend": ["ui", "frontend", "interface", "user experience", "responsive"],
            "testing": ["test", "testing", "qa", "unit test", "integration test"],
            "security": ["security", "encryption", "ssl", "https", "vulnerability"],
            "performance": ["performance", "speed", "optimization", "caching"],
            "deployment": ["deploy", "deployment", "production", "staging"],
            "monitoring": ["monitoring", "logging", "metrics", "alerting"]
        }

        for requirement, indicators in tech_indicators.items():
            if any(indicator in input_lower for indicator in indicators):
                requirements.append(requirement)

        return requirements

    def _calculate_ambiguity(self, user_input: str) -> float:
        """Calculate ambiguity score (0.0 = clear, 1.0 = very ambiguous)"""
        ambiguity_indicators = [
            "maybe", "perhaps", "possibly", "might", "could", "think about",
            "not sure", "unclear", "vague", "rough idea", "general"
        ]

        input_lower = user_input.lower()
        ambiguity_count = sum(1 for indicator in ambiguity_indicators if indicator in input_lower)

        # Normalize by text length
        word_count = len(user_input.split())
        if word_count == 0:
            return 1.0

        # Score based on ratio of ambiguity indicators to total words
        ambiguity_score = min(ambiguity_count / word_count * 10, 1.0)

        # Adjust for very short inputs (likely ambiguous)
        if word_count < 10:
            ambiguity_score = max(ambiguity_score, 0.5)

        return ambiguity_score

    def _identify_missing_information(
        self,
        user_input: str,
        context: CommunicationContext
    ) -> List[str]:
        """Identify potentially missing information"""
        missing = []
        input_lower = user_input.lower()

        missing_indicators = {
            "success_criteria": ["success", "complete", "done", "finished"],
            "technical_constraints": ["constraint", "limitation", "requirement", "spec"],
            "timeline": ["deadline", "timeline", "when", "urgency", "due"],
            "scope": ["scope", "boundaries", "what's included", "range"],
            "dependencies": ["dependencies", "prerequisites", "requirements"]
        }

        for missing_type, indicators in missing_indicators.items():
            if not any(indicator in input_lower for indicator in indicators):
                missing.append(missing_type)

        return missing

    def _suggest_approach(
        self,
        user_input: str,
        analysis: Dict[str, Any]
    ) -> str:
        """Suggest the best approach based on analysis"""
        complexity = analysis.get("complexity", "moderate")
        project_type = analysis.get("project_type", "unknown")
        ambiguity_score = analysis.get("ambiguity_score", 0.0)

        if ambiguity_score > 0.7:
            return "detailed_requirements"
        elif complexity == "expert":
            return "research_first"
        elif project_type in ["api_service", "web_application"]:
            return "standard_development"
        elif project_type == "testing":
            return "testing_focused"
        else:
            return "standard"

    def _estimate_effort(
        self,
        user_input: str,
        analysis: Dict[str, Any]
    ) -> str:
        """Estimate effort required"""
        complexity = analysis.get("complexity", "moderate")

        effort_map = {
            "simple": "30 minutes - 2 hours",
            "moderate": "2-6 hours",
            "complex": "6-24 hours",
            "expert": "24+ hours"
        }

        return effort_map.get(complexity, "2-6 hours")

    def _identify_risk_factors(
        self,
        user_input: str,
        analysis: Dict[str, Any]
    ) -> List[str]:
        """Identify potential risk factors"""
        risks = []
        input_lower = user_input.lower()

        risk_patterns = {
            "ambiguous_requirements": ["unclear", "not sure", "maybe", "vague"],
            "complex_integration": ["integrate", "connect", "combine", "multiple systems"],
            "performance_concerns": ["performance", "speed", "slow", "optimization"],
            "security_implications": ["security", "authentication", "authorization", "sensitive data"],
            "timeline_pressure": ["urgent", "asap", "deadline", "rush", "immediately"],
            "limited_information": ["limited info", "not much detail", "basic idea"]
        }

        for risk_type, patterns in risk_patterns.items():
            if any(pattern in input_lower for pattern in patterns):
                risks.append(risk_type)

        return risks


class ProgressiveDisclosurer:
    """Handles progressive disclosure of information"""

    def __init__(self, dependencies: CEHubDependencies):
        self.deps = dependencies
        self.logger = logging.getLogger("progressive_disclosurer")

    async def disclose_information(
        self,
        information: Dict[str, Any],
        context: CommunicationContext,
        initial_depth: InformationDepth = InformationDepth.SUMMARY
    ) -> None:
        """
        Progressively disclose information based on user interest and context
        """
        try:
            # Start with initial depth
            await self._disclose_at_depth(information, context, initial_depth)

            # Monitor for user interest and provide deeper information
            await self._monitor_and_disclose_deeper(information, context)

        except Exception as e:
            self.logger.error(f"Error in progressive disclosure: {e}")

    async def _disclose_at_depth(
        self,
        information: Dict[str, Any],
        context: CommunicationContext,
        depth: InformationDepth
    ) -> None:
        """Disclose information at specified depth"""
        if depth == InformationDepth.MINIMAL:
            await self._disclose_minimal(information, context)
        elif depth == InformationDepth.SUMMARY:
            await self._disclose_summary(information, context)
        elif depth == InformationDepth.DETAILED:
            await self._disclose_detailed(information, context)
        elif depth == InformationDepth.TECHNICAL:
            await self._disclose_technical(information, context)
        elif depth == InformationDepth.DEBUG:
            await self._disclose_debug(information, context)

    async def _disclose_minimal(
        self,
        information: Dict[str, Any],
        context: CommunicationContext
    ) -> None:
        """Disclose minimal essential information"""
        essential_keys = ["status", "progress", "next_steps"]
        minimal_info = {k: information.get(k) for k in essential_keys if k in information}

        await self._send_formatted_update(minimal_info, "Essential Update", context)

    async def _disclose_summary(
        self,
        information: Dict[str, Any],
        context: CommunicationContext
    ) -> None:
        """Disclose summary level information"""
        summary_info = {
            "overview": information.get("overview"),
            "status": information.get("status"),
            "progress": information.get("progress"),
            "key_achievements": information.get("key_achievements", [])[:3],
            "next_steps": information.get("next_steps", [])[:2]
        }

        await self._send_formatted_update(summary_info, "Summary Update", context)

    async def _disclose_detailed(
        self,
        information: Dict[str, Any],
        context: CommunicationContext
    ) -> None:
        """Disclose detailed information"""
        await self._send_formatted_update(information, "Detailed Update", context)

    async def _disclose_technical(
        self,
        information: Dict[str, Any],
        context: CommunicationContext
    ) -> None:
        """Disclose technical details"""
        technical_keys = [
            "technical_details", "implementation", "code_changes",
            "configuration", "metrics", "performance"
        ]
        technical_info = {k: information.get(k) for k in technical_keys if k in information}

        await self._send_formatted_update(technical_info, "Technical Details", context)

    async def _disclose_debug(
        self,
        information: Dict[str, Any],
        context: CommunicationContext
    ) -> None:
        """Disclose debug level information"""
        debug_info = {
            "debug_info": information.get("debug_info"),
            "logs": information.get("logs"),
            "trace": information.get("trace"),
            "error_details": information.get("error_details")
        }

        await self._send_formatted_update(debug_info, "Debug Information", context)

    async def _monitor_and_disclose_deeper(
        self,
        information: Dict[str, Any],
        context: CommunicationContext
    ) -> None:
        """Monitor user interest and provide deeper information"""
        # This would monitor user responses and provide deeper information
        # Implementation depends on the specific user interface
        pass

    async def _send_formatted_update(
        self,
        info: Dict[str, Any],
        title: str,
        context: CommunicationContext
    ) -> None:
        """Send formatted update to user"""
        formatted_message = f"**{title}**\n\n"

        for key, value in info.items():
            if value is not None:
                if isinstance(value, list):
                    formatted_message += f"**{key.replace('_', ' ').title()}**:\n"
                    for item in value:
                        formatted_message += f"  • {item}\n"
                elif isinstance(value, dict):
                    formatted_message += f"**{key.replace('_', ' ').title()}**:\n"
                    for sub_key, sub_value in value.items():
                        formatted_message += f"  {sub_key}: {sub_value}\n"
                else:
                    formatted_message += f"**{key.replace('_', ' ').title()}**: {value}\n"

        formatted_message += "\n"
        formatted_message += "Would you like more details about any of these aspects?"

        await self.deps.send_update(formatted_message)


# Factory functions for easy instantiation
def create_requirement_gatherer(dependencies: CEHubDependencies) -> RequirementGatherer:
    """Create a requirement gatherer instance"""
    return RequirementGatherer(dependencies)


def create_context_analyzer(dependencies: CEHubDependencies) -> ContextAnalyzer:
    """Create a context analyzer instance"""
    return ContextAnalyzer(dependencies)


def create_progressive_disclosurer(dependencies: CEHubDependencies) -> ProgressiveDisclosurer:
    """Create a progressive disclosurer instance"""
    return ProgressiveDisclosurer(dependencies)