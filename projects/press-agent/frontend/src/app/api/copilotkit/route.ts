/**
 * CopilotKit Runtime API Route
 * Integrates with OpenRouter for LLM backend
 */

import { CopilotRuntime, OpenAIAdapter } from "@copilotkit/runtime";
import { NextRequest } from "next/server";

// OpenRouter adapter configuration
const openRouterAdapter = new OpenAIAdapter({
  url: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "Press Agent",
  },
});

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { handleRequest } = new CopilotRuntime();

  // Use OpenRouter adapter for all LLM calls
  return handleRequest(req, openRouterAdapter);
}
