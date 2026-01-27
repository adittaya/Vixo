import { OpenRouter } from "@openrouter/sdk";
import { FREE_MODEL_LISTS } from '../constants/freeModels';

// Use environment variable for API key (secure approach)
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!API_KEY) {
  console.error("OpenRouter API key is not set. Please configure VITE_OPENROUTER_API_KEY in your environment variables.");
}

/**
 * Image Analysis AI Service
 * Handles image analysis using OpenRouter's AI models with vision capabilities
 */
export const imageAnalysisAI = {
  /**
   * List of free models to try in order of preference (with multimodal support for image analysis)
   */
  FREE_MODELS: [
    ...FREE_MODEL_LISTS.VISION_MODELS,
    ...FREE_MODEL_LISTS.HIGH_PERFORMANCE,
    ...FREE_MODEL_LISTS.TEXT_MODELS
  ],

  /**
   * Analyzes an image and returns insights
   * @param message - The user's query about the image
   * @param imageUrl - The URL or base64 data of the image to analyze
   * @returns The complete AI response with image analysis
   */
  async analyzeImage(message: string, imageUrl: string): Promise<string> {
    // Check if API key is available
    if (!API_KEY) {
      console.error("OpenRouter API key is not configured");
      return "Support is busy right now. Please try again in a moment.";
    }

    if (!API_KEY || API_KEY.length < 20) {
      return "Support is busy right now. Please try again in a moment.";
    }

    const openrouter = new OpenRouter({
      apiKey: API_KEY
    });

    // Try models one by one, in order (as per free model fallback handler)
    // Use only ONE model at a time
    // If a model fails, move to the next model
    // Do NOT retry the same model again in the same request
    // Do NOT try all models at once
    // Stop as soon as one model gives a valid response
    const multimodalModels = this.FREE_MODELS.filter(model =>
      model.includes('gemini') ||
      model.includes('vl') ||
      model.includes('vision') ||
      model.includes('qwen-2.5-vl') ||
      model.includes('phi-3.5-vision')
    );

    // First try multimodal models one by one
    for (const model of multimodalModels) {
      try {
        console.log(`Trying multimodal model: ${model}`);

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
              "content": [
                {
                  "type": "text",
                  "text": message
                },
                {
                  "type": "image_url",
                  "image_url": {
                    "url": imageUrl
                  }
                }
              ]
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
        console.log(`Multimodal model ${model} failed:`, modelError.message);
        // Move to the next model (continue the loop)
        continue;
      }
    }

    // FAILURE HANDLING: If all free models fail,
    // return a simple fallback message
    console.log("All vision models exhausted, returning fallback response");
    return "Support is busy right now. Please try again in a moment.";
  }
};