import { OpenRouter } from "@openrouter/sdk";

// Use environment variable for API key
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!API_KEY) {
  console.error("OpenRouter API key is not set. Please configure VITE_OPENROUTER_API_KEY in your environment variables.");
}

const openrouter = new OpenRouter({
  apiKey: API_KEY || ""
});

/**
 * Customer Care AI Service
 * Handles customer inquiries using OpenRouter's AI models
 */
export const customerCareAI = {
  /**
   * Sends a message to the Customer Care AI and returns a streaming response
   * @param message - The customer's inquiry message
   * @returns Async generator yielding response chunks
   */
  async *getResponseStream(message: string) {
    try {
      const stream = await openrouter.chat.send({
        model: "qwen/qwen3-coder:free",
        messages: [
          {
            "role": "system",
            "content": `You are a customer care representative for VIXO investment platform. 
            Your role is to assist users with their queries about investments, withdrawals, 
            account management, and platform features. Be helpful, friendly, and professional. 
            If a user asks about technical issues, guide them step-by-step. 
            If they ask about investments, explain the benefits and risks clearly. 
            If they need help with withdrawals, walk them through the process. 
            Always prioritize user security and platform policies.`
          },
          {
            "role": "user",
            "content": message
          }
        ],
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error("Error in customer care AI:", error);
      yield "I'm sorry, I'm having trouble connecting to the AI service. Please try again later.";
    }
  },

  /**
   * Sends a message to the Customer Care AI and returns the complete response
   * @param message - The customer's inquiry message
   * @returns The complete AI response
   */
  async getResponse(message: string): Promise<string> {
    let fullResponse = '';
    
    try {
      for await (const chunk of this.getResponseStream(message)) {
        fullResponse += chunk;
      }
      
      return fullResponse;
    } catch (error) {
      console.error("Error getting customer care response:", error);
      return "I'm sorry, I encountered an error processing your request. Please try again later.";
    }
  }
};

// Example usage:
/*
(async () => {
  const message = "What is the meaning of life?";
  
  // Streaming response
  console.log("Streaming response:");
  for await (const chunk of customerCareAI.getResponseStream(message)) {
    process.stdout.write(chunk);
  }
  
  // Or get complete response
  console.log("\n\nComplete response:");
  const response = await customerCareAI.getResponse(message);
  console.log(response);
})();
*/