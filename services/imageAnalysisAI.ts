import { pollinationsService } from './pollinationsService';
import { extractTextFromImage } from '../utils/ocrUtils';
import { requestManager, generateRequestId } from '../utils/requestManager';

/**
 * Image Analysis AI Service
 * Handles image analysis using OCR + Pollinations text processing
 */
export const imageAnalysisAI = {
  /**
   * Analyzes an image and returns insights
   * @param message - The user's query about the image
   * @param imageUrl - The URL or base64 data of the image to analyze
   * @returns The complete AI response with image analysis
   */
  async analyzeImage(message: string, imageUrl: string): Promise<string> {
    // Generate a unique request ID for this message
    const requestId = generateRequestId();

    // HARD KILL SWITCH: Cancel all pending requests
    requestManager.cancelAllRequests();

    // Add this request to the pending list
    const controller = requestManager.addRequest(requestId);

    try {
      // STEP 1: Extract text from image using OCR
      const ocrText = await this.runWithTimeoutAndAbort(
        extractTextFromImage(imageUrl),
        5000, // 5 seconds for OCR
        "Unable to extract text from image. Please try again.",
        controller.signal
      );

      // STEP 2: Send to Pollinations with context
      const prompt = this.formatImageAnalysisPrompt(message, ocrText);

      const response = await this.runWithTimeoutAndAbort(
        pollinationsService.queryText(prompt),
        3000, // 3 seconds timeout
        "Image analysis is taking longer than usual. Please try again.",
        controller.signal
      );

      // Add a soft suggestion after the response
      return response + "\n\nYou can check available plans now.";
    } catch (error) {
      console.error("Error in imageAnalysisAI analyzeImage:", error);
      return "I'm here, but things are a bit busy right now. Please try again in a moment.";
    } finally {
      // Remove the request from pending list
      requestManager.removeRequest(requestId);
    }
  },

  /**
   * Format the image analysis prompt for Pollinations
   */
  formatImageAnalysisPrompt(userMessage: string, ocrText: string): string {
    return `You are the official Customer Care Assistant for the VIXO investment platform.
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
    • Keep platform safe

    Now analyze this image based on the user's question: ${userMessage}
    Here is the text extracted from the image: ${ocrText}

    Explain what is shown in the image to the user in simple language.`;
  },

  /**
   * Helper function to run a promise with a timeout and abort signal
   */
  async runWithTimeoutAndAbort<T>(
    promise: Promise<T>,
    timeoutMs: number,
    fallbackValue: T,
    signal?: AbortSignal
  ): Promise<T> {
    // Create a timeout promise
    const timeoutPromise = new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Operation timed out'));
      }, timeoutMs);

      // If the signal is aborted, reject the promise
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Operation was aborted'));
        });
      }
    }) as Promise<T>;

    try {
      // Race the actual promise against the timeout and abort signal
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } catch (error) {
      // If the operation timed out or was aborted, return the fallback value
      console.warn("Request timed out or was aborted:", error);
      return fallbackValue;
    }
  }
};