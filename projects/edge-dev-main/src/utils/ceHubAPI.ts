/**
 * CE Hub API Service
 * Handles communication with CE Hub workflow system
 */

interface CEHubResponse {
  message: string;
  type: string;
  phase?: string;
  nextSteps?: string[];
  sessionData?: any;
  context?: any;
  timestamp: string;
  ai_engine: string;
}

interface APIContext {
  page?: string;
  workflowSessionId?: string;
  workflowPhase?: string;
  [key: string]: any;
}

class CEHubAPIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5656';
  }

  /**
   * Send request to CE Hub workflow system
   */
  async processRequest(
    message: string,
    context: APIContext = {}
  ): Promise<CEHubResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/renata/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          personality: 'cehub_workflow',
          systemPrompt: 'CE Hub workflow system - Research → Plan → Iterate → Validate',
          context: {
            page: 'RenataChat',
            ...context
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as CEHubResponse;

    } catch (error) {
      console.error('CE Hub API error:', error);

      // Return a fallback response
      return {
        message: `🏢 **CE Hub System**\n\nI encountered a connection issue. Let me help you directly:\n\n**Available Options:**\n• Upload your scanner code for analysis\n• Ask about building specific strategies\n• Request optimization advice\n\nWhat would you like to work on?`,
        type: 'api_error',
        timestamp: new Date().toISOString(),
        ai_engine: 'Fallback System'
      };
    }
  }

  /**
   * Get workflow session status
   */
  async getWorkflowStatus(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/renata/workflow/status/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Status check error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Workflow status check error:', error);
      return null;
    }
  }

  /**
   * Start new workflow session
   */
  async startWorkflow(projectType: string, userRequest: string): Promise<CEHubResponse> {
    return this.processRequest(userRequest, {
      workflowAction: 'start',
      projectType,
      timestamp: new Date().toISOString()
    });
  }
}

const ceHubAPIServiceInstance = new CEHubAPIService();
export default ceHubAPIServiceInstance;
export type { CEHubResponse, APIContext };