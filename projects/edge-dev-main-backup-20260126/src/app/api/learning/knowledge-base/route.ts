/**
 * Learning Knowledge Base API
 * Handles knowledge storage, retrieval, and learning operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getArchonLearning, type LearningContext } from '@/services/archonLearningService';

// POST /api/learning/knowledge-base - Store learning context
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      action,
      chat_id,
      user_message,
      ai_response,
      code_generated,
      execution_result,
      user_feedback,
      metadata
    } = body;

    const archonLearning = getArchonLearning();
    await archonLearning.initialize();

    const context: LearningContext = {
      chat_id,
      user_message,
      ai_response,
      code_generated,
      execution_result,
      user_feedback,
      timestamp: new Date(),
      metadata
    };

    let result;

    switch (action) {
      case 'learn_from_generation':
        await archonLearning.learnFromCodeGeneration(context);
        result = { success: true, message: 'Learned from code generation' };
        break;

      case 'learn_from_execution':
        await archonLearning.learnFromExecution(context);
        result = { success: true, message: 'Learned from execution' };
        break;

      case 'learn_from_error':
        if (body.error) {
          await archonLearning.learnFromError(context, new Error(body.error));
          result = { success: true, message: 'Learned from error' };
        } else {
          result = { success: false, message: 'Error details required' };
        }
        break;

      default:
        result = { success: false, message: 'Unknown action' };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Learning API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/learning/knowledge-base - Retrieve knowledge
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '5');

    const archonLearning = getArchonLearning();
    await archonLearning.initialize();

    let result;

    if (type === 'solutions' && query) {
      const solutions = await archonLearning.recallSimilarProblems(query, limit);
      result = {
        success: true,
        data: solutions,
        count: solutions.length
      };
    } else if (type === 'patterns') {
      const scannerType = searchParams.get('scanner_type') || undefined;
      const patterns = await archonLearning.recallApplicablePatterns({
        scanner_type: scannerType || undefined,
        keywords: query ? [query] : undefined
      });
      result = {
        success: true,
        data: patterns,
        count: patterns.length
      };
    } else if (type === 'suggestions' && query) {
      const suggestions = await archonLearning.getSuggestions(query);
      result = {
        success: true,
        data: suggestions,
        count: suggestions.length
      };
    } else {
      // Get stats
      const stats = archonLearning.getStats();
      result = {
        success: true,
        data: stats
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Learning GET API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
