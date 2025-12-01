"""
AG-UI (Agent User Interface) Component Patterns
Integration of animated gradient UI components with agent interactions
"""

import asyncio
from typing import Dict, List, Optional, Any, Union, Callable
from dataclasses import dataclass, field
from enum import Enum
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AnimationType(Enum):
    """Types of AG-UI animations"""
    GRADIENT_TEXT = "gradient_text"
    SHINY_TEXT = "shiny_text"
    AURORA_TEXT = "aurora_text"
    ANIMATED_BEAM = "animated_beam"
    CIRCULAR_PROGRESS = "circular_progress"
    GRID_PATTERN = "grid_pattern"
    NUMBER_TICKER = "number_ticker"
    WORD_ROTATE = "word_rotate"
    TYPING_ANIMATION = "typing_animation"

class InteractionEvent(Enum):
    """Types of user interaction events"""
    HOVER = "hover"
    CLICK = "click"
    FOCUS = "focus"
    INPUT = "input"
    SCROLL = "scroll"
    LOAD = "load"
    ERROR = "error"
    SUCCESS = "success"

@dataclass
class AnimationConfig:
    """Configuration for AG-UI animations"""
    animation_type: AnimationType
    duration: float = 2.0
    speed: float = 1.0
    color_from: str = "#ffaa40"
    color_to: str = "#9c40ff"
    loop: bool = True
    trigger_events: List[InteractionEvent] = field(default_factory=list)
    css_classes: List[str] = field(default_factory=list)
    custom_properties: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ComponentPattern:
    """Reusable AG-UI component pattern"""
    name: str
    description: str
    animation_configs: List[AnimationConfig] = field(default_factory=list)
    react_component: str = ""
    vue_component: str = ""
    vanilla_js: str = ""
    usage_examples: Dict[str, str] = field(default_factory=dict)
    accessibility_features: List[str] = field(default_factory=list)

class AGUIComponentLibrary:
    """
    Library of AG-UI component patterns for CE Hub integration
    """

    def __init__(self):
        self.patterns: Dict[str, ComponentPattern] = {}
        self.animation_registry: Dict[AnimationType, Dict[str, Any]] = {}
        self.logger = logging.getLogger(__name__)

        # Initialize built-in patterns
        self._initialize_patterns()
        self._initialize_animations()

    def _initialize_patterns(self):
        """Initialize built-in AG-UI component patterns"""

        # Animated Gradient Text Pattern
        gradient_text = ComponentPattern(
            name="animated_gradient_text",
            description="Text with animated gradient colors perfect for agent responses",
            react_component="""
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";

export const AgentResponseText = ({ children, className = "" }) => {
    return (
        <AnimatedGradientText
            className={className}
            speed={1.5}
            colorFrom="#3b82f6"
            colorTo="#8b5cf6"
        >
            {children}
        </AnimatedGradientText>
    );
};
            """.strip(),
            vue_component="""
<template>
    <div
        ref="gradientText"
        :class="['animated-gradient-text', className]"
        :style="gradientStyle"
    >
        <slot />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
    speed: { type: Number, default: 1 },
    colorFrom: { type: String, default: '#ffaa40' },
    colorTo: { type: String, default: '#9c40ff' },
    className: { type: String, default: '' }
})

const gradientText = ref(null)
const gradientStyle = computed(() => ({
    '--animation-speed': `${props.speed}s`,
    '--color-from': props.colorFrom,
    '--color-to': props.colorTo,
    background: `linear-gradient(90deg, ${props.colorFrom}, ${props.colorTo})`,
    backgroundSize: '200% 100%',
    animation: `gradient ${props.speed * 2}s linear infinite`
}))

onMounted(() => {
    // Add CSS animation
    const style = document.createElement('style')
    style.textContent = `
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }
    `
    document.head.appendChild(style)
})
</script>
            """.strip(),
            animation_configs=[
                AnimationConfig(
                    animation_type=AnimationType.GRADIENT_TEXT,
                    duration=3.0,
                    speed=1.5,
                    trigger_events=[InteractionEvent.LOAD, InteractionEvent.HOVER]
                )
            ],
            usage_examples={
                "agent_response": "<AnimatedGradientText>Thinking...</AnimatedGradientText>",
                "status_indicator": "<AnimatedGradientText>Processing</AnimatedGradientText>",
                "action_button": "<AnimatedGradientText>Generate</AnimatedGradientText>"
            },
            accessibility_features=[
                "Reduced motion support",
                "High contrast fallback colors",
                "Screen reader friendly text alternatives"
            ]
        )

        # Agent Status Indicator Pattern
        status_indicator = ComponentPattern(
            name="agent_status_indicator",
            description="Circular progress indicator showing agent processing status",
            react_component="""
import { AnimatedCircularProgress } from "@/components/magicui/animated-circular-progress";

export const AgentStatusIndicator = ({
    status = "thinking",
    progress = 0,
    className = ""
}) => {
    const statusColors = {
        thinking: "#3b82f6",
        processing: "#f59e0b",
        success: "#10b981",
        error: "#ef4444"
    };

    return (
        <div className={`agent-status ${className}`}>
            <AnimatedCircularProgress
                value={progress}
                size={40}
                strokeWidth={3}
                color={statusColors[status]}
            />
            <span className="status-text">{status}</span>
        </div>
    );
};
            """.strip(),
            animation_configs=[
                AnimationConfig(
                    animation_type=AnimationType.CIRCULAR_PROGRESS,
                    duration=1.0,
                    trigger_events=[InteractionEvent.INPUT, InteractionEvent.LOAD]
                )
            ],
            usage_examples={
                "thinking_indicator": '<AgentStatusIndicator status="thinking" progress={75} />',
                "processing_status": '<AgentStatusIndicator status="processing" progress={45} />',
                "success_state": '<AgentStatusIndicator status="success" progress={100} />'
            }
        )

        # Message Beam Animation Pattern
        message_beam = ComponentPattern(
            name="message_beam_animation",
            description="Animated beam effect for agent message delivery",
            react_component="""
import { AnimatedBeam } from "@/components/magicui/animated-beam";

export const AgentMessageBeam = ({
    fromElement,
    toElement,
    className = ""
}) => {
    return (
        <AnimatedBeam
            containerClassName={className}
            fromRef={fromElement}
            toRef={toElement}
            duration={2}
            curveHeight={20}
            beamColor="#8b5cf6"
        />
    );
};
            """.strip(),
            animation_configs=[
                AnimationConfig(
                    animation_type=AnimationType.ANIMATED_BEAM,
                    duration=2.0,
                    color_from="#8b5cf6",
                    trigger_events=[InteractionEvent.CLICK, InteractionEvent.SUCCESS]
                )
            ]
        )

        # Typing Indicator Pattern
        typing_indicator = ComponentPattern(
            name="typing_indicator",
            description="Animated typing indicator showing agent is composing response",
            react_component="""
import { TypingAnimation } from "@/components/magicui/typing-animation";

export const AgentTypingIndicator = ({
    isTyping = false,
    className = ""
}) => {
    if (!isTyping) return null;

    return (
        <div className={`typing-indicator ${className}`}>
            <div className="typing-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
            </div>
            <TypingAnimation text="Agent is typing..." />
        </div>
    );
};
            """.strip(),
            animation_configs=[
                AnimationConfig(
                    animation_type=AnimationType.TYPING_ANIMATION,
                    duration=1.5,
                    trigger_events=[InteractionEvent.INPUT, InteractionEvent.LOAD]
                )
            ]
        )

        self.patterns.update({
            "gradient_text": gradient_text,
            "status_indicator": status_indicator,
            "message_beam": message_beam,
            "typing_indicator": typing_indicator
        })

    def _initialize_animations(self):
        """Initialize animation registry with performance-optimized CSS"""

        # Gradient Text Animation
        self.animation_registry[AnimationType.GRADIENT_TEXT] = {
            "css": """
.animated-gradient-text {
    background: linear-gradient(90deg, var(--color-from, #ffaa40), var(--color-to, #9c40ff));
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient var(--animation-speed, 3s) linear infinite;
}

@keyframes gradient {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
}

@media (prefers-reduced-motion: reduce) {
    .animated-gradient-text {
        animation: none;
        background: linear-gradient(90deg, var(--color-from, #ffaa40), var(--color-to, #9c40ff));
    }
}
            """.strip(),
            "performance_notes": "Uses GPU-accelerated CSS transforms for smooth animation",
            "accessibility": "Supports prefers-reduced-motion and high-contrast mode"
        }

        # Circular Progress Animation
        self.animation_registry[AnimationType.CIRCULAR_PROGRESS] = {
            "css": """
.animated-circular-progress {
    transform: rotate(-90deg);
    transition: stroke-dashoffset var(--duration, 1s) ease-in-out;
}

.progress-ring {
    stroke-linecap: round;
    stroke-dasharray: var(--circumference);
    stroke-dashoffset: var(--offset);
    transition: stroke-dashoffset 0.5s ease-in-out;
}

@keyframes progress-pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
}

.animated-circular-progress.animating {
    animation: progress-pulse 2s ease-in-out infinite;
}
            """.strip(),
            "performance_notes": "Uses SVG stroke animations with hardware acceleration"
        }

        # Typing Animation
        self.animation_registry[AnimationType.TYPING_ANIMATION] = {
            "css": """
.typing-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
}

.typing-dots {
    display: flex;
    gap: 4px;
}

.typing-dots .dot {
    width: 8px;
    height: 8px;
    background-color: currentColor;
    border-radius: 50%;
    animation: typing-bounce 1.4s ease-in-out infinite;
}

.typing-dots .dot:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dots .dot:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing-bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
}

@media (prefers-reduced-motion: reduce) {
    .typing-dots .dot {
        animation: none;
    }
}
            """.strip()
        }

    def get_pattern(self, pattern_name: str) -> Optional[ComponentPattern]:
        """Get a component pattern by name"""
        return self.patterns.get(pattern_name)

    def list_patterns(self) -> List[str]:
        """List all available pattern names"""
        return list(self.patterns.keys())

    def create_agent_interaction_component(
        self,
        pattern_name: str,
        interaction_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create an agent interaction component based on a pattern

        Args:
            pattern_name: Name of the pattern to use
            interaction_context: Context including agent state, user input, etc.

        Returns:
            Component configuration with animations and interactions
        """
        pattern = self.get_pattern(pattern_name)
        if not pattern:
            raise ValueError(f"Pattern '{pattern_name}' not found")

        # Customize based on interaction context
        agent_state = interaction_context.get("agent_state", "idle")
        user_intent = interaction_context.get("user_intent", "general")

        component_config = {
            "pattern": pattern,
            "customizations": self._get_customizations_for_context(
                agent_state, user_intent, interaction_context
            ),
            "interaction_events": self._get_interaction_events(interaction_context),
            "accessibility_config": self._get_accessibility_config(interaction_context)
        }

        return component_config

    def _get_customizations_for_context(
        self,
        agent_state: str,
        user_intent: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get customizations based on agent state and context"""

        customizations = {}

        # Color schemes based on agent state
        state_colors = {
            "thinking": {"from": "#3b82f6", "to": "#1d4ed8"},
            "processing": {"from": "#f59e0b", "to": "#d97706"},
            "success": {"from": "#10b981", "to": "#059669"},
            "error": {"from": "#ef4444", "to": "#dc2626"},
            "idle": {"from": "#6b7280", "to": "#4b5563"}
        }

        # Speed based on urgency
        urgency_speeds = {
            "high": 2.0,
            "medium": 1.5,
            "low": 1.0
        }

        customizations["colors"] = state_colors.get(agent_state, state_colors["idle"])
        customizations["speed"] = urgency_speeds.get(
            context.get("urgency", "medium"),
            1.5
        )

        return customizations

    def _get_interaction_events(self, context: Dict[str, Any]) -> List[InteractionEvent]:
        """Get relevant interaction events for the context"""
        events = [InteractionEvent.LOAD]  # Always load

        if context.get("interactive", True):
            events.extend([InteractionEvent.HOVER, InteractionEvent.CLICK])

        if context.get("input_required", False):
            events.append(InteractionEvent.INPUT)

        return events

    def _get_accessibility_config(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Get accessibility configuration"""
        return {
            "reduced_motion": context.get("respect_motion_preference", True),
            "high_contrast": context.get("high_contrast_mode", False),
            "screen_reader_support": True,
            "keyboard_navigation": context.get("keyboard_nav", True)
        }

class AgentUIBridge:
    """
    Bridge between CE Hub agents and AG-UI components
    """

    def __init__(self, component_library: AGUIComponentLibrary):
        self.library = component_library
        self.active_animations: Dict[str, Any] = {}
        self.logger = logging.getLogger(__name__)

    async def create_agent_response_ui(
        self,
        agent_name: str,
        response_text: str,
        response_state: str = "delivering"
    ) -> Dict[str, Any]:
        """
        Create UI for agent response with appropriate animations

        Args:
            agent_name: Name of the agent
            response_text: The response content
            response_state: State of the response (thinking, delivering, complete)

        Returns:
            UI configuration with animations
        """

        # Determine appropriate pattern based on state
        if response_state == "thinking":
            pattern_name = "typing_indicator"
            display_text = f"{agent_name} is thinking..."
        elif response_state == "delivering":
            pattern_name = "gradient_text"
            display_text = response_text
        else:  # complete
            pattern_name = "gradient_text"
            display_text = response_text

        # Create component
        component_config = self.library.create_agent_interaction_component(
            pattern_name,
            {
                "agent_state": response_state,
                "agent_name": agent_name,
                "content": response_text,
                "urgency": "medium"
            }
        )

        return {
            "agent_name": agent_name,
            "state": response_state,
            "ui_component": component_config,
            "display_text": display_text,
            "metadata": {
                "timestamp": asyncio.get_event_loop().time(),
                "animation_id": f"{agent_name}_{response_state}_{int(asyncio.get_event_loop().time())}"
            }
        }

    async def create_status_indicator_ui(
        self,
        agent_name: str,
        status: str,
        progress: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Create status indicator UI for agent operations
        """

        component_config = self.library.create_agent_interaction_component(
            "status_indicator",
            {
                "agent_state": status,
                "agent_name": agent_name,
                "progress": progress or 0,
                "interactive": False
            }
        )

        return {
            "agent_name": agent_name,
            "status": status,
            "progress": progress,
            "ui_component": component_config
        }

    async def animate_agent_handoff(
        self,
        from_agent: str,
        to_agent: str,
        handoff_context: str
    ) -> Dict[str, Any]:
        """
        Create animation for agent handoff
        """

        component_config = self.library.create_agent_interaction_component(
            "message_beam",
            {
                "agent_state": "handoff",
                "from_agent": from_agent,
                "to_agent": to_agent,
                "context": handoff_context,
                "urgency": "low"
            }
        )

        return {
            "handoff_type": "agent_to_agent",
            "from_agent": from_agent,
            "to_agent": to_agent,
            "context": handoff_context,
            "ui_component": component_config,
            "animation_duration": 2.0
        }

    def export_component_css(self, pattern_names: List[str] = None) -> str:
        """
        Export CSS for specified patterns or all patterns

        Args:
            pattern_names: List of pattern names to export CSS for

        Returns:
            Combined CSS string
        """

        if pattern_names is None:
            pattern_names = self.library.list_patterns()

        css_parts = []

        for pattern_name in pattern_names:
            pattern = self.library.get_pattern(pattern_name)
            if pattern:
                for anim_config in pattern.animation_configs:
                    anim_type = anim_config.animation_type
                    if anim_type in self.library.animation_registry:
                        css_parts.append(
                            self.library.animation_registry[anim_type]["css"]
                        )

        return "\n\n".join(css_parts)

# Global instance
default_agui_library = AGUIComponentLibrary()
default_ui_bridge = AgentUIBridge(default_agui_library)

# Utility functions
async def create_agent_ui(
    agent_name: str,
    content: str,
    state: str = "delivering"
) -> Dict[str, Any]:
    """Quick function to create agent UI"""
    return await default_ui_bridge.create_agent_response_ui(
        agent_name, content, state
    )

async def create_status_ui(
    agent_name: str,
    status: str,
    progress: Optional[float] = None
) -> Dict[str, Any]:
    """Quick function to create status UI"""
    return await default_ui_bridge.create_status_indicator_ui(
        agent_name, status, progress
    )

def get_agui_css(patterns: List[str] = None) -> str:
    """Quick function to get AG-UI CSS"""
    return default_ui_bridge.export_component_css(patterns)