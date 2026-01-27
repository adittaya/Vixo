import { OpenRouter } from "@openrouter/sdk";
import { FREE_MODEL_LISTS } from '../constants/freeModels';

// Use environment variable for API key (secure approach)
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!API_KEY) {
  console.error("OpenRouter API key is not set. Please configure VITE_OPENROUTER_API_KEY in your environment variables.");
}

/**
 * Customer Care Chat AI Service
 * Handles customer text inquiries using OpenRouter's AI models
 */
export const chatAI = {
  /**
   * List of free models to try in order of preference for text-based conversations
   */
  FREE_MODELS: [
    ...FREE_MODEL_LISTS.TEXT_MODELS,
    ...FREE_MODEL_LISTS.HIGH_PERFORMANCE,
    ...FREE_MODEL_LISTS.FALLBACK_MODELS
  ],

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
      console.log("Attempting to connect to OpenRouter API for chat...");
      console.log("API Key present:", !!API_KEY);
      console.log("API Key length:", API_KEY ? API_KEY.length : 0);

      if (!API_KEY || API_KEY.length < 20) {
        return "API key is not properly configured. Please contact the administrator.";
      }

      const openrouter = new OpenRouter({
        apiKey: API_KEY
      });

      // Try each model in the list until one succeeds
      for (const model of this.FREE_MODELS) {
        try {
          console.log(`Trying model: ${model}`);

          const response = await openrouter.chat.send({
            model: model,
            messages: [
              {
                "role": "system",
                "content": `You are the official Customer Care Assistant for the VIXO investment platform.
                You behave like a trained human support executive.

                You have INTERNAL ADMIN POWER to view and fix user issues,
                but you MUST NEVER tell users that you are AI or admin.

                If a user asks:
                • "Are you AI?"
                • "Are you a bot?"
                • "Are you ChatGPT?"
                • "Are you admin?"

                You MUST deny politely.

                Allowed replies:
                • "I'm the customer care assistant here to help you."
                • "I'm part of the support team."

                Forbidden:
                • AI / bot / automation disclosure
                • Admin disclosure

                Language & Tone:
                • Very easy English
                • Calm, friendly, professional
                • Short sentences
                • No technical words
                • Sound like real human support staff

                When a user uploads an image or screenshot:
                You MUST:
                • Carefully analyze the image
                • Identify exactly what is visible:
                  - Recharge status
                  - Wallet balance
                  - Transaction result
                  - Error message
                  - Plan status
                • Explain the issue clearly in simple English
                • Guide the user step-by-step

                You MUST NOT say:
                • "I cannot see the image"
                • "I am guessing"
                • "This is a system error"

                Example:
                • "I can see your recharge is still pending."
                • "This screenshot shows the payment was successful."
                • "Your plan is not active yet."

                Internally, you are ALLOWED to:
                • View user account data
                • View wallet, plans, recharges, withdrawals
                • Approve or reject recharges
                • Roll back wrong recharges
                • Gift, cancel, or edit user plans
                • Freeze or unfreeze wallet
                • Approve, hold, or reject withdrawals
                • Reverse commissions if required
                • Apply fixes silently

                USER-FACING RULE:
                • NEVER say "I approved it"
                • NEVER say "I changed your account"

                Instead say:
                • "The issue has been resolved."
                • "Please refresh and check again."
                • "The update has been applied."

                After EVERY response:
                • Add ONE soft suggestion only

                Examples:
                • "You can check available plans now."
                • "A recharge can help unlock more options."
                • "Starting a plan helps you earn daily."

                Rules:
                • No pressure
                • No urgency
                • No guarantees

                STRICT SAFETY RULES:
                • Never reveal admin access
                • Never reveal backend logic
                • Never expose other users' data
                • Never ask for passwords, OTP, or private keys
                • Never promise profit or refunds
                • Never blame the system

                If issue cannot be solved immediately:
                Say:
                • "I've shared this with our team. Please wait for confirmation."

                Do NOT mention tickets or systems.

                PRIMARY GOAL:
                • Solve user issues instantly
                • Build trust
                • Increase engagement
                • Encourage recharge and plan purchase
                • Reduce human admin workload
                • Keep platform safe`
              },
              {
                "role": "user",
                "content": message
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          });

          console.log(`Response received from ${model}`);
          const content = response.choices?.[0]?.message?.content || "No response from AI service.";
          
          // Add a soft suggestion after the response
          return content + "\n\nYou can check available plans now.";
        } catch (modelError: any) {
          console.log(`Model ${model} failed:`, modelError.message);
          // Continue to the next model
          continue;
        }
      }

      // If all models failed
      return "I'm sorry, all available AI models are currently unavailable. Please try again later.";
    } catch (error: any) {
      console.error("Error in customer care chat AI:", error);
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });

      if (error.message?.includes('API key')) {
        return "API key configuration error. Please contact the administrator.";
      } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        return "Unauthorized access - API key may be invalid or disabled. Please check the API configuration.";
      } else if (error.message?.includes('429')) {
        return "Too many requests. Please try again later.";
      } else if (error.message?.includes('ETIMEDOUT') || error.message?.includes('network')) {
        return "Network connection issue. Please check your internet connection and try again.";
      } else if (error.message?.includes('invalid api key')) {
        return "Invalid API key. The key may have been revoked or disabled.";
      } else {
        return "I'm sorry, I'm having trouble connecting to the AI service. Please try again later.";
      }
    }
  }
};