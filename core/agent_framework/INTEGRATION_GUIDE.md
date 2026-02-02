# CE Hub Enhanced Agent Framework Integration Guide

## Overview

This guide provides comprehensive instructions for integrating and using the enhanced CE Hub agent framework built on PydanticAI. The new framework provides:

- **Type-safe agent development** with PydanticAI integration
- **Comprehensive validation** with custom validation rules
- **Intelligent communication patterns** with requirement gathering
- **Production-grade error handling** and retry logic
- **Performance monitoring** and metrics collection
- **Standardized agent lifecycle** management

## Quick Start

### 1. Basic Agent Creation

```python
from core.agent_framework.cehub_agent import cehub_agent, AgentRole
from core.agent_framework.cehub_dependencies import (
    CEHubDependencies, ProjectContext, TaskContext, ProjectRequirements
)

# Use the decorator for easy agent creation
@cehub_agent(
    role=AgentRole.ENGINEER,
    model_name="claude-3-5-sonnet-20241022",
    validation_level="strict"
)
class MyCustomAgent(CEHubAgentBase):
    def get_system_prompt(self) -> str:
        return "You are a specialist agent for..."

    def get_tools(self) -> List[Tool]:
        return [
            # Define your tools here
        ]

# Create agent instance
agent = MyCustomAgent()
```

### 2. Initialize Dependencies

```python
import asyncio
from datetime import datetime

async def main():
    # Create project context
    project_context = ProjectContext(
        project_id="my-project-001",
        project_type="web_application",
        name="My Web Application",
        description="A modern web application",
        working_directory="/path/to/project",
        languages=["Python", "JavaScript", "TypeScript"],
        frameworks=["React", "FastAPI"]
    )

    # Create task context
    task_context = TaskContext(
        task_id="task-001",
        parent_task_id=None,
        dependencies=[],
        subtasks=[],
        current_attempt=0,
        max_attempts=3
    )

    # Create requirements (can be gathered automatically)
    requirements = ProjectRequirements(
        title="Implement user authentication",
        description="Add secure user authentication to the application",
        success_criteria=[
            "Users can register with email and password",
            "Users can login and logout",
            "Password reset functionality works"
        ],
        technical_constraints=[
            "Use JWT tokens",
            "Follow OWASP security guidelines"
        ]
    )

    # Initialize agent dependencies
    dependencies = await agent.initialize_dependencies(
        project_context=project_context,
        task_context=task_context,
        requirements=requirements,
        archon_client=archon_client,  # Your Archon client
        file_system=file_system,      # Your file system interface
        git_operations=git_ops,      # Your Git operations
        orchestrator_client=orchestrator,  # Your orchestrator client
        user_interface=ui,           # Your user interface
        config={},                   # Additional config
        environment={},              # Environment variables
        metrics_collector=metrics    # Metrics collector (optional)
    )

    # Execute task
    result = await agent.execute_task("Implement user authentication", dependencies)

    if result.success:
        print(f"Task completed successfully!")
        print(f"Content: {result.content}")
        if result.validation_result:
            print(f"Validation score: {result.validation_result.score}")
    else:
        print(f"Task failed: {result.error_message}")

# Run the main function
asyncio.run(main())
```

## Advanced Usage

### 1. Custom Validation Rules

```python
from core.agent_framework.validation_engine import BaseValidator, ValidationRule

class CustomSecurityValidator(BaseValidator):
    def __init__(self):
        super().__init__("custom_security", "Custom security validation")

    async def validate(self, content: str, ctx: CEHubRunContext, rule: ValidationRule) -> ValidationResult:
        result = ValidationResult(is_valid=True, score=1.0)

        # Custom validation logic
        if "password" in content.lower() and "hash" not in content.lower():
            result.add_warning("Password storage should use hashing")
            result.score -= 0.2

        return result

# Register custom validator
agent.validation_engine.register_validator("custom_security", CustomSecurityValidator())
```

### 2. Enhanced Requirement Gathering

```python
from core.agent_framework.communication_patterns import (
    RequirementGatherer, CommunicationMode, CommunicationContext
)

# Create requirement gatherer
req_gatherer = RequirementGatherer(dependencies)

# Create communication context
comm_context = CommunicationContext.create(
    user_id="user-123",
    session_id="session-456"
)
comm_context.communication_mode = CommunicationMode.PROGRESSIVE

# Gather comprehensive requirements
requirements = await req_gatherer.gather_comprehensive_requirements(
    "Build a user authentication system",
    comm_context,
    mode=CommunicationMode.PROGRESSIVE
)
```

### 3. Multi-Agent Coordination

```python
# Enhanced orchestrator usage
from core.agent_framework.cehub_agent import create_enhanced_orchestrator

orchestrator = create_enhanced_orchestrator()

# Initialize orchestrator
dependencies = await orchestrator.initialize_dependencies(
    project_context=project_context,
    task_context=task_context,
    requirements=requirements,
    # ... other dependencies
)

# Analyze request and get routing recommendations
analysis = await orchestrator.analyze_request_tool(
    "Build a complete e-commerce system with user auth, product catalog, and payment processing",
    ctx=RunContext(deps=dependencies, retry=0, result=None)
)

print(f"Required agents: {analysis['required_agents']}")
print(f"Complexity: {analysis['complexity']}")
print(f"Estimated duration: {analysis['estimated_duration']}")

# Route to specialist agents
for agent_name in analysis['required_agents']:
    routing_result = await orchestrator.route_to_specialist_tool(
        agent_name=agent_name,
        task_description="Build e-commerce components",
        context=analysis,
        ctx=RunContext(deps=dependencies, retry=0, result=None)
    )
    print(f"Routed to {agent_name}: {routing_result['success']}")
```

### 4. Custom Agent with Advanced Features

```python
from pydantic_ai.tools import Tool
from typing import Dict, Any

@cehub_agent(
    role=AgentRole.ENGINEER,
    capabilities_override={
        "name": "database-architect",
        "description": "Specialized database architecture and optimization",
        "primary_skills": ["database design", "SQL", "NoSQL", "performance optimization"],
        "frameworks_known": ["PostgreSQL", "MongoDB", "Redis", "Elasticsearch"]
    }
)
class DatabaseArchitectAgent(CEHubAgentBase):
    def get_system_prompt(self) -> str:
        return """You are a database architecture specialist with deep expertise in
        database design, optimization, and scalability. Focus on performance,
        data integrity, and future scalability in all your designs."""

    def get_tools(self) -> List[Tool]:
        return [
            self.design_schema_tool,
            self.optimize_queries_tool,
            self.migrate_database_tool,
            self.setup_replication_tool
        ]

    async def design_schema_tool(
        self,
        requirements: Dict[str, Any],
        ctx: RunContext[CEHubDependencies]
    ) -> Dict[str, Any]:
        """Design database schema based on requirements"""
        # Custom implementation
        return {
            "schema_design": "Detailed schema design...",
            "sql_ddl": "CREATE TABLE statements...",
            "relationships": "Entity relationships...",
            "indexes": "Recommended indexes..."
        }

    async def optimize_queries_tool(
        self,
        slow_queries: List[str],
        ctx: RunContext[CEHubDependencies]
    ) -> Dict[str, Any]:
        """Optimize slow database queries"""
        # Custom implementation
        return {
            "optimized_queries": [],
            "performance_improvements": [],
            "index_recommendations": []
        }

# Create and use the agent
db_agent = DatabaseArchitectAgent()
```

## Configuration

### 1. Validation Configuration

```python
from core.agent_framework.cehub_dependencies import ValidationConfig, ValidationLevel, ValidationRule

# Create custom validation config
validation_config = ValidationConfig(
    level=ValidationLevel.PRODUCTION,
    fail_fast=False,
    auto_fix=True,
    rules={
        "code_quality": ValidationRule(
            name="code_quality",
            description="Ensure code meets quality standards",
            enabled=True,
            severity="warning",
            parameters={
                "max_line_length": 100,
                "check_documentation": True,
                "check_complexity": True
            }
        ),
        "security": ValidationRule(
            name="security",
            description="Security validation",
            enabled=True,
            severity="error",
            parameters={
                "check_sql_injection": True,
                "check_xss": True,
                "check_hardcoded_secrets": True
            }
        )
    }
)
```

### 2. Agent Capabilities Configuration

```python
from core.agent_framework.cehub_dependencies import AgentCapabilities

# Define custom capabilities
custom_capabilities = AgentCapabilities(
    name="ai-specialist",
    role=AgentRole.ENGINEER,
    description="Specialist in AI/ML implementation",
    primary_skills=[
        "machine learning",
        "data processing",
        "model training",
        "AI integration"
    ],
    secondary_skills=[
        "data visualization",
        "model deployment",
        "performance optimization"
    ],
    tools_available=[
        "model_trainer",
        "data_processor",
        "api_integrator"
    ],
    frameworks_known=[
        "TensorFlow", "PyTorch", "scikit-learn", "pandas"
    ],
    scope_limitations=[
        "Cannot provide business strategy advice",
        "Limited to technical implementation"
    ],
    required_context=[
        "Clear data requirements",
        "Model specifications",
        "Performance targets"
    ],
    typical_task_duration="4-12 hours",
    success_rate=0.88
)
```

## Error Handling and Monitoring

### 1. Custom Error Handling

```python
@cehub_agent(role=AgentRole.ENGINEER)
class ResilientAgent(CEHubAgentBase):
    async def execute_task_with_recovery(
        self,
        task_input: str,
        dependencies: CEHubDependencies,
        requirements: Optional[ProjectRequirements] = None
    ) -> TaskResult:
        """Execute task with advanced error recovery"""

        try:
            # Standard execution
            return await super().execute_task(task_input, dependencies, requirements)

        except Exception as e:
            # Custom error handling
            await self._handle_critical_error(e, dependencies)

            # Attempt recovery
            if await self._can_recover_from_error(e, dependencies):
                return await self._attempt_recovery(e, task_input, dependencies, requirements)
            else:
                # Escalate to orchestrator
                await self._escalate_error(e, dependencies)
                raise

    async def _handle_critical_error(self, error: Exception, dependencies: CEHubDependencies):
        """Handle critical errors"""
        await dependencies.send_update(
            f"Critical error encountered: {str(error)}",
            level="error"
        )

        # Log detailed error information
        dependencies.logger.error(f"Critical error details: {error}", exc_info=True)

    async def _can_recover_from_error(self, error: Exception, dependencies: CEHubDependencies) -> bool:
        """Determine if error is recoverable"""
        recoverable_errors = [
            "TimeoutError",
            "ConnectionError",
            "TemporaryFailure"
        ]

        return any(error_type in str(type(error)) for error_type in recoverable_errors)

    async def _attempt_recovery(
        self,
        error: Exception,
        task_input: str,
        dependencies: CEHubDependencies,
        requirements: Optional[ProjectRequirements]
    ) -> TaskResult:
        """Attempt to recover from error"""
        await dependencies.send_update("Attempting error recovery...", level="info")

        # Wait and retry
        await asyncio.sleep(5)

        return await super().execute_task(task_input, dependencies, requirements)

    async def _escalate_error(self, error: Exception, dependencies: CEHubDependencies):
        """Escalate error to orchestrator"""
        escalation_message = {
            "error_type": str(type(error)),
            "error_message": str(error),
            "agent": self.capabilities.name,
            "timestamp": datetime.now().isoformat(),
            "context": dependencies.task_context.dict()
        }

        dependencies.set_shared_state("escalated_error", escalation_message)
```

### 2. Performance Monitoring

```python
class PerformanceMonitor:
    """Monitor agent performance metrics"""

    def __init__(self):
        self.metrics = {}

    async def track_agent_execution(
        self,
        agent_name: str,
        task_id: str,
        execution_func: Callable,
        *args, **kwargs
    ):
        """Track and log agent execution metrics"""
        start_time = datetime.now()

        try:
            result = await execution_func(*args, **kwargs)

            execution_time = (datetime.now() - start_time).total_seconds()

            # Record metrics
            self.metrics[f"{agent_name}_{task_id}"] = {
                "execution_time": execution_time,
                "success": True,
                "timestamp": start_time.isoformat()
            }

            # Log performance
            if execution_time > 60:  # Slow execution
                print(f"WARNING: {agent_name} took {execution_time:.2f} seconds")

            return result

        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()

            # Record failure metrics
            self.metrics[f"{agent_name}_{task_id}"] = {
                "execution_time": execution_time,
                "success": False,
                "error": str(e),
                "timestamp": start_time.isoformat()
            }

            raise

# Usage
monitor = PerformanceMonitor()

result = await monitor.track_agent_execution(
    "engineer-agent",
    "task-123",
    agent.execute_task,
    task_input="Implement feature X",
    dependencies=dependencies
)
```

## Testing

### 1. Unit Testing Agents

```python
import pytest
from unittest.mock import Mock, AsyncMock
from core.agent_framework.cehub_dependencies import CEHubDependencies, ProjectContext

@pytest.fixture
def mock_dependencies():
    """Create mock dependencies for testing"""
    return CEHubDependencies(
        project_context=ProjectContext(
            project_id="test-project",
            project_type="web_application",
            name="Test Project",
            description="Test project for unit testing",
            working_directory="/tmp/test"
        ),
        task_context=TaskContext(
            task_id="test-task",
            current_attempt=0,
            max_attempts=3
        ),
        requirements=ProjectRequirements(
            title="Test Task",
            description="A test task",
            success_criteria=["Task completes successfully"]
        ),
        agent_capabilities=Mock(),
        archon_client=AsyncMock(),
        file_system=Mock(),
        git_operations=Mock(),
        orchestrator_client=AsyncMock(),
        user_interface=AsyncMock(),
        validation_config=ValidationConfig()
    )

@pytest.mark.asyncio
async def test_agent_execution(mock_dependencies):
    """Test agent execution with mock dependencies"""
    # Create agent
    agent = TestAgent()

    # Mock the agent's methods
    agent.get_system_prompt = Mock(return_value="Test system prompt")
    agent.get_tools = Mock(return_value=[])

    # Execute task
    result = await agent.execute_task("Test input", mock_dependencies)

    # Assertions
    assert result.success is True
    assert len(result.content) > 0
    assert result.execution_time > 0

@pytest.mark.asyncio
async def test_requirement_gathering():
    """Test requirement gathering functionality"""
    from core.agent_framework.communication_patterns import RequirementGatherer, CommunicationContext

    # Setup
    mock_deps = Mock(spec=CEHubDependencies)
    mock_deps.ask_question = AsyncMock(return_value="Sample answer")
    mock_deps.send_update = AsyncMock()

    gatherer = RequirementGatherer(mock_deps)
    context = CommunicationContext.create("user-1", "session-1")

    # Test
    requirements = await gatherer.gather_comprehensive_requirements(
        "Build a simple API",
        context
    )

    # Assertions
    assert requirements.title is not None
    assert requirements.description == "Build a simple API"
    assert len(requirements.success_criteria) > 0
```

### 2. Integration Testing

```python
@pytest.mark.asyncio
async def test_multi_agent_workflow():
    """Test complete multi-agent workflow"""
    # Create orchestrator
    orchestrator = create_enhanced_orchestrator()

    # Setup mock dependencies
    mock_dependencies = create_test_dependencies()

    # Initialize
    dependencies = await orchestrator.initialize_dependencies(mock_dependencies)

    # Test request analysis
    analysis = await orchestrator.analyze_request_tool(
        "Build a complete web application with user authentication",
        RunContext(deps=dependencies, retry=0, result=None)
    )

    # Assertions
    assert analysis["success"] is True
    assert len(analysis["required_agents"]) > 0
    assert "ce-hub-engineer" in analysis["required_agents"]
    assert "ce-hub-gui-specialist" in analysis["required_agents"]
```

## Deployment

### 1. Production Configuration

```python
# production_config.py
from core.agent_framework.cehub_dependencies import ValidationConfig, ValidationLevel

PRODUCTION_VALIDATION_CONFIG = ValidationConfig(
    level=ValidationLevel.PRODUCTION,
    fail_fast=False,
    auto_fix=False,  # Don't auto-fix in production
    timeout=60,
    rules={
        "security": {"enabled": True, "severity": "error"},
        "performance": {"enabled": True, "severity": "warning"},
        "code_quality": {"enabled": True, "severity": "warning"}
    }
)

PRODUCTION_AGENT_CONFIG = {
    "model_name": "claude-3-5-sonnet-20241022",
    "validation_level": "production",
    "max_retry_attempts": 3,
    "timeout_seconds": 300,
    "enable_metrics": True,
    "enable_logging": True
}
```

### 2. Environment Setup

```python
# setup_production.py
import os
from core.agent_framework.cehub_agent import create_enhanced_orchestrator
from core.agent_framework.cehub_dependencies import CEHubDependencies

def setup_production_environment():
    """Setup production environment with all configurations"""

    # Environment variables
    os.environ.update({
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
        "ARCHON_ENDPOINT": os.getenv("ARCHON_ENDPOINT", "http://localhost:8051"),
        "LOG_LEVEL": "INFO",
        "VALIDATION_LEVEL": "production"
    })

    # Create orchestrator with production config
    orchestrator = create_enhanced_orchestrator()

    return orchestrator

# Usage in production
orchestrator = setup_production_environment()
```

## Best Practices

### 1. Agent Design Principles

1. **Single Responsibility**: Each agent should have a clear, focused purpose
2. **Clear Interfaces**: Define clear inputs and outputs for each agent
3. **Error Handling**: Implement comprehensive error handling and recovery
4. **Validation**: Always validate inputs and outputs
5. **Documentation**: Document agent capabilities and limitations
6. **Testing**: Write comprehensive tests for all agent functionality

### 2. Performance Considerations

1. **Async Operations**: Use async/await for all I/O operations
2. **Caching**: Cache frequently accessed data
3. **Rate Limiting**: Implement rate limiting for external API calls
4. **Resource Management**: Properly manage resources and connections
5. **Monitoring**: Monitor performance and set up alerts

### 3. Security Considerations

1. **Input Validation**: Validate all user inputs
2. **Secret Management**: Never hardcode secrets or API keys
3. **Least Privilege**: Use minimum required permissions
4. **Audit Logging**: Log all important operations
5. **Security Scanning**: Regular security scans and updates

## Troubleshooting

### Common Issues and Solutions

1. **Validation Failures**
   - Check validation rules configuration
   - Ensure input data format is correct
   - Review validation error messages

2. **Agent Communication Issues**
   - Verify network connectivity
   - Check agent availability
   - Review communication logs

3. **Performance Issues**
   - Monitor resource usage
   - Check for memory leaks
   - Profile slow operations

4. **Memory Issues**
   - Monitor memory usage
   - Implement proper cleanup
   - Use streaming for large data

### Debug Mode

```python
# Enable debug mode
import logging
logging.basicConfig(level=logging.DEBUG)

# Create agent with debug validation
debug_validation_config = ValidationConfig(
    level=ValidationLevel.PRODUCTION,
    fail_fast=True  # Fail immediately on validation errors
)

agent = MyAgent(validation_config=debug_validation_config)
```

This comprehensive guide provides everything needed to integrate and use the enhanced CE Hub agent framework effectively. The framework offers production-grade reliability, comprehensive validation, and intelligent communication patterns that significantly improve agent performance and user experience.