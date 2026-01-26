import { OpenRouter } from "@openrouter/sdk";

// Use environment variable for API key (secure approach)
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!API_KEY) {
  console.error("OpenRouter API key is not set. Please configure VITE_OPENROUTER_API_KEY in your environment variables.");
}

/**
 * Minimal Customer Care AI Service
 * Handles customer inquiries using OpenRouter's AI models
 */
export const customerCareAI = {
  /**
   * Sends a message to the Customer Care AI and returns the complete response
   * @param message - The customer's inquiry message
   * @returns The complete AI response
   */
  async getResponse(message: string): Promise<string> {
    try {
      // Check if API key is available
      if (!API_KEY) {
        console.error("OpenRouter API key is not configured");
        return "API key is not configured. Please contact the administrator.";
      }

      // Create a new instance of OpenRouter with the API key
      const openrouter = new OpenRouter({
        apiKey: API_KEY
      });

      const response = await openrouter.chat.send({
        model: "qwen/qwen3-coder:free",
        messages: [
          {
            "role": "system",
            "content": `You are a customer care representative for VIXO investment platform.
            Your role is to assist users with their queries about investments, withdrawals,
            account management, and platform features. Be helpful, friendly, and professional.`
          },
          {
            "role": "user",
            "content": message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices?.[0]?.message?.content || "No response from AI service.";
      return content;
    } catch (error: any) {
      console.error("Error in customer care AI:", error);

      if (error.message?.includes('API key')) {
        return "API key configuration error. Please contact the administrator.";
      } else if (error.message?.includes('401')) {
        return "Unauthorized access. Please check the API configuration.";
      } else if (error.message?.includes('429')) {
        return "Too many requests. Please try again later.";
      } else if (error.message?.includes('ETIMEDOUT') || error.message?.includes('network')) {
        return "Network connection issue. Please check your internet connection and try again.";
      } else {
        return "I'm sorry, I'm having trouble connecting to the AI service. Please try again later.";
      }
    }
  }
};