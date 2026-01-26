import { OpenRouter } from "@openrouter/sdk";

// Use environment variable for API key (secure approach)
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!API_KEY) {
  console.error("OpenRouter API key is not set. Please configure VITE_OPENROUTER_API_KEY in your environment variables.");
}

const openrouter = new OpenRouter({
  apiKey: API_KEY || ""  // Empty string fallback if env var is not set
});

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

      const stream = await openrouter.chat.send({
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
        stream: true
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
        }
      }
      
      return fullResponse;
    } catch (error) {
      console.error("Error in customer care AI:", error);
      return "I'm sorry, I'm having trouble connecting to the AI service. Please try again later.";
    }
  }
};