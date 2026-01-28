/**
 * CUSTOM AI AGENT BACKBONE
 * Pollinations-only implementation for image analysis and customer care
 *
 * Implements the exact flow:
 * - OCR for image analysis
 * - Pollinations for text processing
 * - Stateless processing
 * - Always reply guarantee
 */

import { pollinationsService } from '../services/pollinationsService';
import { extractTextFromImage } from '../utils/ocrUtils';
import { requestManager, generateRequestId } from '../utils/requestManager';

interface UserInput {
  text: string;
  imageUrl?: string;
}

export const customAIAgent = {
  /**
   * Process user input according to the specified flow
   * @param input - User input with optional image
   * @returns AI response
   */
  async processUserInput(input: UserInput): Promise<string> {
    // Generate a unique request ID for this message
    const requestId = generateRequestId();

    // HARD KILL SWITCH: Cancel all pending requests
    requestManager.cancelAllRequests();

    // Add this request to the pending list
    const controller = requestManager.addRequest(requestId);

    try {
      // Abort previous request (stateless processing)
      // This is handled by cancelAllRequests() above

      if (input.imageUrl) {
        // IMAGE ANALYSIS FLOW
        return await this.handleImageAnalysis(input.imageUrl, input.text, controller);
      } else {
        // TEXT CHAT FLOW
        return await this.handleTextChat(input.text, controller);
      }
    } catch (error) {
      console.error("Error in customAIAgent processUserInput:", error);
      return "Customer Care busy";
    } finally {
      // Remove the request from pending list
      requestManager.removeRequest(requestId);
    }
  },

  /**
   * Handle image analysis flow: OCR -> Text -> Pollinations
   */
  async handleImageAnalysis(imageUrl: string, description: string, controller: AbortController): Promise<string> {
    try {
      // STEP 1: Extract text from image using OCR
      const ocrText = await this.runWithTimeoutAndAbort(
        extractTextFromImage(imageUrl),
        5000, // 5 seconds for OCR
        "Unable to extract text from image. Please try again.",
        controller.signal
      );

      // STEP 2: Send to Pollinations with context
      const prompt = `Explain this screenshot to the user in simple language: ${ocrText}`;

      const response = await this.runWithTimeoutAndAbort(
        pollinationsService.queryText(prompt), // Using queryText for text responses
        3000, // 3 seconds timeout
        "Image analysis is taking longer than usual. Please try again.",
        controller.signal
      );

      // STEP 3: Return response
      return response;
    } catch (error) {
      console.error("Image analysis failed:", error);
      return "Customer Care busy";
    }
  },

  /**
   * Handle text chat flow with Pollinations
   */
  async handleTextChat(text: string, controller: AbortController): Promise<string> {
    try {
      // Check if this is a customer care request and enhance the prompt accordingly
      if (text.toLowerCase().includes('customer care') ||
          text.toLowerCase().includes('support') ||
          text.toLowerCase().includes('vixo') ||
          text.toLowerCase().includes('account') ||
          text.toLowerCase().includes('balance') ||
          text.toLowerCase().includes('withdraw') ||
          text.toLowerCase().includes('investment') ||
          text.toLowerCase().includes('refund') ||
          text.toLowerCase().includes('problem') ||
          text.toLowerCase().includes('issue') ||
          text.toLowerCase().includes('help')) {
        // Enhance the prompt for customer care scenarios with detailed VIXO training
        const enhancedPrompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

About VIXO:
- VIXO is a modern automation-powered digital platform designed to simplify earning, engagement, and user experience through smart systems and transparent processes.
- The platform has been actively running for over 200 days, serving users consistently with stable operations, reliable support, and continuously improving features.
- VIXO provides users with a structured environment where they can create and manage accounts, recharge, participate in plans, track progress, and receive timely guidance.
- The company focuses on automation working quietly in the background, transparent processes, and fast, solution-oriented support.

Your Role (Simran):
- Name: Simran
- Role: Senior Customer Care Executive
- Department: User Support & Operations
- Company: VIXO Platform
- Location: Delhi, India
- You come from a support and operations background with experience in handling user queries and guiding users through issues.

How You Help Users:
- Listen carefully to user problems
- Explain VIXO platform rules in simple language
- Guide users step by step toward solutions
- Resolve normal account-related issues
- Ensure users always know the next correct action
- Your approach is friendly, patient, and professional
- You have secure internal access to review account and transaction status when necessary

Trust & Responsibility:
- Respect user privacy strictly
- Never share internal or sensitive information
- Never give false promises or guarantees
- Work within VIXO's support policies
- Focus on providing clear guidance and reliable assistance

Important Guidelines:
- Be available 24/7 through smart assistance
- Guide users step-by-step instead of giving generic replies
- Explain issues clearly and honestly
- Help users understand what's happening and what to do next
- Make support feel like talking to a trained staff member, not a robot
- Focus on long-term reliability and consistent performance
- Operate with strong focus on user privacy, secure handling of data, fair usage policies, and clear communication

User's request: ${text}`;

        // Use Pollinations service for customer care queries
        const response = await this.runWithTimeoutAndAbort(
          pollinationsService.queryText(enhancedPrompt),
          10000, // Increased timeout for more complex queries
          "I'm here, but things are a bit busy right now. Please try again in a moment.",
          controller.signal
        );

        return response;
      } else {
        // Use Pollinations service for general queries with VIXO context
        const generalPrompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform. Even for general queries, maintain the helpful, friendly, and professional demeanor described in the VIXO guidelines.

About VIXO:
- VIXO is a modern automation-powered digital platform designed to simplify earning, engagement, and user experience through smart systems and transparent processes.
- The platform has been actively running for over 200 days, serving users consistently with stable operations, reliable support, and continuously improving features.

${text}`;

        const response = await this.runWithTimeoutAndAbort(
          pollinationsService.queryText(generalPrompt),
          7000, // Increased timeout for general queries
          "I'm here, but things are a bit busy right now. Please try again in a moment.",
          controller.signal
        );

        return response;
      }
    } catch (error) {
      console.error("Text chat failed:", error);
      // When API fails, show "Customer Care busy" message instead of fallback responses
      return "Customer Care busy";
    }
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
      // If the operation timed out or was aborted, return "Customer Care busy"
      console.warn("Request timed out or was aborted:", error);
      return "Customer Care busy";
    }
  }
};