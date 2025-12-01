import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';
import OpenAI from 'openai';
import { NextRequest } from 'next/server';

// Create OpenAI client configured to use OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || 'your-api-key-here',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
});

// Create the runtime with OpenAI adapter
const copilotKit = new CopilotRuntime({});

const serviceAdapter = new OpenAIAdapter({
  openai,
  model: "qwen/qwen-2.5-72b-instruct", // OpenRouter model format - cost-effective, high-quality
});

// Export the handlers for the API route
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: copilotKit,
    serviceAdapter: serviceAdapter,
    endpoint: req.url || '',
  });

  return handleRequest(req);
};