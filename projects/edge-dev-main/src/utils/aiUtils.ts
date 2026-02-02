/**
 * AI Utility Functions
 * Helper functions for AI-related operations
 */

/**
 * Generate a unique ID
 * @returns A unique identifier string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
