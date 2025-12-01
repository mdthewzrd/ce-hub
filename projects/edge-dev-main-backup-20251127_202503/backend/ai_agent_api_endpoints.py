# 🌐 AI-Agent API Endpoints
# FastAPI endpoints connecting frontend CopilotKit interface to backend AI systems
# Integration layer for Parameter Translation Engine + Backtest Validation System

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import asyncio
import json
from datetime import datetime

# Import our AI-Agent core systems
from core.parameter_translation_engine import (
    ParameterTranslationEngine,
    ConversationContext,
    ParameterModification
)
from core.backtest_validation_system import (
    BacktestValidationSystem,
    QuickValidationResult
)

# ═══════════════════════════════════════════════════════════════════════════════
# 📋 REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class ParameterTranslationRequest(BaseModel):
    user_request: str
    current_parameters: Dict[str, Any]
    session_history: Optional[List[Dict[str, str]]] = []
    market_conditions: Optional[str] = 'neutral'
    user_experience: Optional[str] = 'intermediate'
    risk_tolerance: Optional[str] = 'moderate'

class ParameterUpdateRequest(BaseModel):
    parameters: Dict[str, Any]

class QuickBacktestRequest(BaseModel):
    parameters: Dict[str, Any]
    test_symbols: Optional[List[str]] = None
    test_period_days: Optional[int] = 30

class ParameterTranslationResponse(BaseModel):
    changes: Dict[str, Any]
    confidence: float
    explanation: str
    requires_approval: bool
    estimated_impact: Dict[str, str]
    warnings: List[str]
    suggestions: List[str]
    processing_time_ms: int

class BacktestResponse(BaseModel):
    is_safe: bool
    estimated_signals_per_day: float
    quality_score: float
    risk_assessment: str
    recommendation: str
    key_concerns: List[str]
    approval_required: bool
    validation_confidence: float
    processing_time_ms: int

class SystemStatusResponse(BaseModel):
    status: str
    ai_engine_version: str
    backtest_engine_version: str
    last_update: str
    active_parameters: Dict[str, Any]

# ═══════════════════════════════════════════════════════════════════════════════
# 🏗️ APPLICATION SETUP
# ═══════════════════════════════════════════════════════════════════════════════

# FastAPI app instance
app = FastAPI(
    title="EdgeDev AI-Agent API",
    description="AI-powered trading scan parameter modification and validation system",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5657"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Global instances of our AI systems
translation_engine = ParameterTranslationEngine()
backtest_system = BacktestValidationSystem()

# Current active parameters (in production, this would be stored in database)
current_active_parameters = {
    'market_filters': {
        'price_min': 8.0,
        'price_max': 1000.0,
        'volume_min_usd': 30_000_000,
    },
    'momentum_triggers': {
        'atr_multiple': 1.0,
        'volume_multiple': 1.5,
        'gap_threshold_atr': 0.75,
        'ema_distance_9': 1.5,
        'ema_distance_20': 2.0,
    },
    'signal_scoring': {
        'signal_strength_min': 0.6,
        'target_multiplier': 1.08,
    },
    'entry_criteria': {
        'max_results_per_day': 50,
        'close_range_min': 0.7,
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# 🎯 CORE AI-AGENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/ai-agent/translate-parameters", response_model=ParameterTranslationResponse)
async def translate_parameters(request: ParameterTranslationRequest):
    """
    🧠 Main AI endpoint: Translate natural language requests into parameter changes

    This endpoint powers the conversational interface by converting user requests
    like "make this more aggressive" into specific parameter modifications.
    """
    start_time = datetime.now()

    try:
        # Create conversation context
        context = ConversationContext(
            user_request=request.user_request,
            current_parameters=request.current_parameters,
            session_history=request.session_history,
            market_conditions=request.market_conditions,
            user_experience=request.user_experience,
            risk_tolerance=request.risk_tolerance
        )

        # Translate using our AI engine
        modification = translation_engine.translate_request(context)

        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return ParameterTranslationResponse(
            changes=modification.changes,
            confidence=modification.confidence,
            explanation=modification.explanation,
            requires_approval=modification.requires_approval,
            estimated_impact=modification.estimated_impact,
            warnings=modification.warnings,
            suggestions=modification.suggestions,
            processing_time_ms=int(processing_time)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Parameter translation failed: {str(e)}"
        )

@app.post("/api/ai-agent/quick-backtest", response_model=BacktestResponse)
async def quick_backtest(request: QuickBacktestRequest):
    """
    📊 Quick validation endpoint: Rapid parameter validation for human-in-the-loop workflow

    Designed to complete in 30-60 seconds to provide fast feedback for approval decisions.
    """
    start_time = datetime.now()

    try:
        # Run quick validation
        result = await backtest_system.quick_validation(
            parameters=request.parameters,
            test_symbols=request.test_symbols,
            test_period_days=request.test_period_days
        )

        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return BacktestResponse(
            is_safe=result.is_safe,
            estimated_signals_per_day=result.estimated_signals_per_day,
            quality_score=result.quality_score,
            risk_assessment=result.risk_assessment,
            recommendation=result.recommendation,
            key_concerns=result.key_concerns,
            approval_required=result.approval_required,
            validation_confidence=result.validation_confidence,
            processing_time_ms=int(processing_time)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Quick backtest failed: {str(e)}"
        )

@app.post("/api/ai-agent/update-parameters")
async def update_parameters(request: ParameterUpdateRequest):
    """
    💾 Parameter persistence endpoint: Save new parameter configuration

    Updates the active parameter configuration after user approval.
    """
    try:
        global current_active_parameters

        # Validate parameter structure (basic validation)
        required_sections = ['market_filters', 'momentum_triggers', 'signal_scoring', 'entry_criteria']
        for section in required_sections:
            if section not in request.parameters:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required parameter section: {section}"
                )

        # Update active parameters
        current_active_parameters = request.parameters

        # In production, save to database here
        # await save_parameters_to_database(request.parameters)

        return {
            "success": True,
            "message": "Parameters updated successfully",
            "timestamp": datetime.now().isoformat(),
            "parameter_count": len(str(request.parameters))
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update parameters: {str(e)}"
        )

# ═══════════════════════════════════════════════════════════════════════════════
# 📊 SYSTEM STATUS & MONITORING ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/ai-agent/status", response_model=SystemStatusResponse)
async def get_system_status():
    """
    🔍 System status endpoint: Health check and configuration info
    """
    try:
        return SystemStatusResponse(
            status="operational",
            ai_engine_version="1.0.0",
            backtest_engine_version="1.0.0",
            last_update=datetime.now().isoformat(),
            active_parameters=current_active_parameters
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Status check failed: {str(e)}"
        )

@app.get("/api/ai-agent/parameters")
async def get_current_parameters():
    """
    📋 Get current active parameters
    """
    return {
        "parameters": current_active_parameters,
        "last_updated": datetime.now().isoformat(),
        "parameter_count": len(str(current_active_parameters))
    }

@app.post("/api/ai-agent/comprehensive-backtest")
async def run_comprehensive_backtest(request: QuickBacktestRequest):
    """
    🧮 Comprehensive backtest endpoint: Full validation with detailed analysis

    Longer-running (2-5 minutes) comprehensive backtest for final parameter validation.
    """
    try:
        # Run comprehensive backtest
        result = await backtest_system.comprehensive_backtest(
            parameters=request.parameters,
            symbols=request.test_symbols or None
        )

        return {
            "metrics": {
                "total_signals": result.metrics.total_signals,
                "win_rate": result.metrics.win_rate,
                "avg_return": result.metrics.avg_return,
                "max_drawdown": result.metrics.max_drawdown,
                "sharpe_ratio": result.metrics.sharpe_ratio,
                "profit_factor": result.metrics.profit_factor,
                "total_return": result.metrics.total_return,
            },
            "signal_count": len(result.signals),
            "recommendation": result.recommendation,
            "warning_flags": result.warning_flags,
            "confidence_score": result.confidence_score,
            "comparison_to_baseline": result.comparison_to_baseline
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Comprehensive backtest failed: {str(e)}"
        )

# ═══════════════════════════════════════════════════════════════════════════════
# 🛠️ UTILITY & DEVELOPMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/ai-agent/test-translation")
async def test_translation_engine():
    """
    🧪 Test endpoint for parameter translation engine
    """
    try:
        test_requests = [
            "Make this more aggressive",
            "I want to focus on small cap stocks",
            "This is finding too many signals",
            "Make it more conservative"
        ]

        results = []
        for request in test_requests:
            context = ConversationContext(
                user_request=request,
                current_parameters=current_active_parameters,
                session_history=[]
            )

            modification = translation_engine.translate_request(context)
            results.append({
                "request": request,
                "confidence": modification.confidence,
                "changes_count": len(modification.changes),
                "requires_approval": modification.requires_approval,
                "explanation": modification.explanation
            })

        return {
            "test_results": results,
            "engine_status": "operational"
        }

    except Exception as e:
        return {
            "error": str(e),
            "engine_status": "error"
        }

@app.post("/api/ai-agent/reset-to-defaults")
async def reset_to_defaults():
    """
    🔄 Reset parameters to default configuration
    """
    try:
        global current_active_parameters

        default_params = {
            'market_filters': {
                'price_min': 8.0,
                'price_max': 1000.0,
                'volume_min_usd': 30_000_000,
            },
            'momentum_triggers': {
                'atr_multiple': 1.0,
                'volume_multiple': 1.5,
                'gap_threshold_atr': 0.75,
                'ema_distance_9': 1.5,
                'ema_distance_20': 2.0,
            },
            'signal_scoring': {
                'signal_strength_min': 0.6,
                'target_multiplier': 1.08,
            },
            'entry_criteria': {
                'max_results_per_day': 50,
                'close_range_min': 0.7,
            }
        }

        current_active_parameters = default_params

        return {
            "success": True,
            "message": "Parameters reset to defaults",
            "parameters": default_params
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset parameters: {str(e)}"
        )

# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 APPLICATION STARTUP
# ═══════════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup_event():
    """Initialize AI-Agent systems on startup"""
    print("🤖 AI-Agent API starting up...")
    print("✅ Parameter Translation Engine initialized")
    print("✅ Backtest Validation System initialized")
    print("🌐 API endpoints ready")
    print("🚀 AI-Agent system operational!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("🛑 AI-Agent API shutting down...")
    print("💾 Saving current state...")
    print("✅ Shutdown complete")

# ═══════════════════════════════════════════════════════════════════════════════
# 🧪 DEVELOPMENT SERVER
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn

    print("🧪 Starting AI-Agent API in development mode...")
    print("📡 Server will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )