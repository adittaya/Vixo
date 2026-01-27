import { customAIAgent } from './customAIAgent';

/**
 * Customer Care AI Service
 * Uses custom AI agent backbone with OpenRouter API
 */
export const customerCareAI = {
  /**
   * Sends a text message to the AI and returns the response
   * @param message - The customer's inquiry message
   * @returns The complete AI response
   */
  async getResponse(message: string): Promise<string> {
    // Try using OpenRouter API directly with the provided key
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sk_aRMDlzZq5H1go5NrbWA7rD0c1l95W0Gr`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openchat/openchat-7b',
          messages: [
            {
              role: 'system',
              content: `You are a helpful customer care assistant for VIXO investment platform.
              Provide personalized support based on the user's information and needs.
              Be professional, empathetic, and solution-oriented.
              If the user has a problem, try to understand it and suggest appropriate solutions.
              If the user needs help with their account, investments, withdrawals, or anything else, provide clear guidance.`
            },
            {
              role: 'user',
              content: message
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "I'm here, but things are a bit busy right now. Please try again in a moment.";
    } catch (error) {
      console.error("OpenRouter API error:", error);
      // Fallback to custom agent if OpenRouter fails
      // Enhance the message with customer care context
      const enhancedMessage = `You are a helpful customer care assistant for VIXO investment platform.
      Provide personalized support based on the user's information and needs.
      Be professional, empathetic, and solution-oriented.
      If the user has a problem, try to understand it and suggest appropriate solutions.
      If the user needs help with their account, investments, withdrawals, or anything else, provide clear guidance.

      Context: ${message}`;

      return await customAIAgent.processUserInput({ text: enhancedMessage });
    }
  },

  /**
   * Processes an image request and returns insights
   * @param description - The user's description about the image
   * @param imageUrl - The URL or base64 data of the image to analyze
   * @returns The complete AI response with image analysis
   */
  async analyzeImage(description: string, imageUrl: string): Promise<string> {
    // Use custom AI agent with OCR + Pollinations processing
    // Each image request is processed independently with no memory
    return await customAIAgent.processUserInput({ text: description, imageUrl });
  },

  /**
   * Generates an image using Pollinations
   * @param prompt - The image generation prompt
   * @returns The URL to the generated image
   */
  async generateImage(prompt: string): Promise<string> {
    // Use the pollinations service directly for image generation
    const { pollinationsService } = await import('./pollinationsService');
    return await pollinationsService.generateImage(prompt);
  },

  /**
   * Reset the router state to default
   */
  resetState(): void {
    // Reset functionality if needed
    // Currently not implemented in customAIAgent
  },

  /**
   * Get the number of pending requests (for monitoring)
   */
  getPendingRequestCount(): number {
    // Currently not implemented in customAIAgent
    return 0;
  }
};