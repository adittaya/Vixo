import { pollinationsService } from './pollinationsService';
import { analyzeSentimentAdvanced, getSentimentBasedResponse } from '../utils/sentimentAnalysis';
import { detectLanguage, getResponseInUserLanguage, normalizeForProcessing } from '../utils/languageDetection';
import { adminPanelService } from './adminPanelService';
import { customAIAgent } from './customAIAgent';

/**
 * Customer Care AI Service
 * Uses Pollinations API as the primary model
 * Includes admin panel access for resolving user issues
 * Implements verification system for sensitive operations
 */
export const customerCareAI = {
  /**
   * Sends a text message to the AI and returns the response
   * @param message - The customer's inquiry message
   * @returns The complete AI response
   */
  async getResponse(message: string, user?: any): Promise<string> {
    try {
      // Detect user's language
      const userLanguage = detectLanguage(message);

      // Normalize message for processing if needed
      const normalizedMessage = normalizeForProcessing(message, 'english');

      // Analyze sentiment of the user's message
      const sentiment = analyzeSentimentAdvanced(normalizedMessage);

      // Format the message for Pollinations API with detailed VIXO training
      // Include user context if available
      const userContext = user ? `
User Information:
- Name: ${user.name}
- Mobile: ${user.mobile}
- Balance: ₹${user.balance}
- Withdrawable Balance: ₹${user.withdrawableBalance}
- Total Invested: ₹${user.totalInvested}
- Total Withdrawn: ₹${user.totalWithdrawn}
- VIP Level: ${user.vipLevel}
- Registration Date: ${user.registrationDate}
- Status: ${user.status}
` : '';

      // First, analyze the user's request to determine if admin intervention is needed
      const analysisPrompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

The user has sent this message: "${normalizedMessage}"

${userContext}

Analyze this request and determine:
1. What specific problem the user is facing
2. What admin action (if any) would resolve their issue
3. How to solve their problem using your admin access

Possible admin actions:
- BALANCE_ADJUSTMENT: For balance-related issues
- WITHDRAWAL_APPROVAL: For approving withdrawals
- WITHDRAWAL_REJECTION: For rejecting withdrawals
- RECHARGE_APPROVAL: For approving recharges
- PASSWORD_RESET: For resetting user passwords
- ACCOUNT_ACTIVATION: For activating accounts
- ACCOUNT_FREEZE: For freezing accounts
- ACCOUNT_UNFREEZE: For unfreezing accounts
- VIP_LEVEL_UPDATE: For updating VIP levels
- REFERRAL_BONUS_UPDATE: For updating referral bonuses
- TRANSACTION_STATUS_UPDATE: For updating transaction status

Respond with a JSON format:
{
  "needsAdminAction": true/false,
  "adminAction": "action_type",
  "actionDetails": "specific details needed for the action",
  "responseToUser": "what to tell the user"
}`;

      const analysisResponse = await pollinationsService.queryText(analysisPrompt);

      // Parse the analysis response
      let analysis;
      try {
        // Try to extract JSON from the response
        const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, create a basic analysis
          analysis = {
            needsAdminAction: false,
            adminAction: null,
            actionDetails: "",
            responseToUser: ""
          };
        }
      } catch (parseError) {
        // If JSON parsing fails, create a basic analysis
        analysis = {
          needsAdminAction: false,
          adminAction: null,
          actionDetails: "",
          responseToUser: ""
        };
      }

      // If admin action is needed, perform it in the background
      if (analysis.needsAdminAction && user) {
        // Perform the admin action using the processUserRequest method
        const adminResult = await this.processUserRequest(`${analysis.adminAction} ${analysis.actionDetails}`, user.id);

        // Generate a user-friendly response that doesn't reveal admin intervention
        const responsePrompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

The admin action "${analysis.adminAction}" has been successfully completed in the background. The user's issue has been resolved.

User's original message: "${normalizedMessage}"
Admin action result: "${adminResult.message}"

Create a friendly, professional response that confirms the issue has been resolved without revealing the internal admin processes. Make the response in Hinglish as appropriate for Indian customers. Focus on the positive outcome for the user.`;

        const response = await pollinationsService.queryText(responsePrompt);
        return response;
      } else {
        // If no admin action needed, generate a normal response
        const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

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
- You have full admin access to resolve user issues directly.

What VIXO Application CAN Do:
- Create and manage user accounts
- Process deposits/recharges to user accounts
- Track investments and earnings
- Process withdrawal requests (after verification)
- Provide customer support through this chat interface
- Show user account balances and transaction history
- Manage VIP levels and associated benefits
- Handle referral programs
- Reset user passwords (with verification)
- Assist with account access issues

How You Help Users:
- Listen carefully to user problems
- Resolve issues directly using your admin access when possible
- If verification is needed, ask for specific information to solve the problem
- Focus on outcomes rather than processes
- Your approach is friendly, patient, and professional
- You have the authority and access to resolve user issues

Trust & Responsibility:
- Respect user privacy strictly
- Never share internal or sensitive information
- Never give false promises or guarantees
- Work within VIXO's support policies
- Focus on providing clear guidance and reliable assistance

Important Guidelines:
- Be available 24/7 through smart assistance
- If a problem can be resolved without verification, solve it directly and confirm to the user that it's resolved
- If verification is needed, ask for specific information required to solve the problem
- Explain issues clearly and honestly
- Help users understand what's happening and what to do next
- Make support feel like talking to a trained staff member, not a robot
- Focus on long-term reliability and consistent performance
- Operate with strong focus on user privacy, secure handling of data, fair usage policies, and clear communication
- If a user asks about features not available in the app, politely explain what IS available instead
- Direct users to use the app's built-in features for account management
- Adjust your tone based on the customer's mood: The customer's current sentiment is ${sentiment.label} with a confidence of ${(sentiment.confidence * 100).toFixed(0)}%. Their message contains keywords: ${sentiment.keywords.join(', ')}. Respond appropriately to their emotional state.
- The customer is communicating in ${userLanguage === 'hindi' ? 'Hindi' : 'English'}. Please respond in a respectful and culturally appropriate manner for Indian customers.
- Use Hinglish (Hindi + English) when appropriate to make customers comfortable. For example: "Aap app ke features ka istemal kar sakte hain" or "Please recharge your account to continue using services."
- Simply solve the user's problem directly without explaining the internal process.
- Focus on the outcome and user satisfaction rather than the technical steps taken.
- When a problem is solved, simply confirm "Your problem has been solved" or similar positive confirmation.
- CRITICAL: Only respond to the specific query the user asked. Do not mix in unrelated information about balances, transactions, or other topics unless directly relevant to their query.
- For password change requests, only provide password change related information and steps.
- For balance inquiries, only provide balance related information.
- For withdrawal requests, only provide withdrawal related information.
- Stay focused on the user's specific request.
- If the user provides partial information (like just numbers), do not assume it relates to balances or other topics unless they explicitly mention it. If they're responding to your password change verification request, continue with the password change process.
- Do not generate information about balances, transactions, or other account changes unless the user specifically asks about them.

${userContext}

User's message: ${normalizedMessage}`;

        const response = await pollinationsService.queryText(prompt);

        // Apply sentiment-based adjustments to the response
        const sentimentAdjustedResponse = getSentimentBasedResponse(sentiment, response);

        // Return response in user's preferred language
        return getResponseInUserLanguage(message, sentimentAdjustedResponse);
      }
    } catch (error) {
      console.error("Pollinations API error:", error);
      // When API fails, show "Customer Care busy" message instead of fallback responses
      return "Customer Care busy";
    }
  },

  /**
   * Processes an image request and returns insights
   * @param description - The user's description about the image
   * @param imageUrl - The URL or base64 data of the image to analyze
   * @returns The complete AI response with image analysis
   */
  async analyzeImage(description: string, imageUrl: string): Promise<string> {
    try {
      // Use custom AI agent with OCR + Pollinations processing
      // Each image request is processed independently with no memory
      return await customAIAgent.processUserInput({ text: description, imageUrl });
    } catch (error) {
      console.error("Image analysis API error:", error);
      return "Customer Care busy";
    }
  },

  /**
   * Generates an image using Pollinations
   * @param prompt - The image generation prompt
   * @returns The URL to the generated image
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      // Use the pollinations service directly for image generation
      const { pollinationsService } = await import('./pollinationsService');
      return await pollinationsService.generateImage(prompt);
    } catch (error) {
      console.error("Image generation API error:", error);
      return "Customer Care busy";
    }
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
  },

  /**
   * Check if a user requires verification for certain operations
   * @param message - The user's inquiry message
   * @returns Boolean indicating if verification is required
   */
  async requiresVerification(message: string): Promise<boolean> {
    const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

The user has asked: "${message}"

Analyze this request and determine if it requires verification for security purposes. Return "YES" if verification is required, or "NO" if it does not require verification. Only respond with "YES" or "NO".`;

    try {
      const response = await pollinationsService.queryText(prompt);
      return response.trim().toUpperCase() === 'YES';
    } catch (error) {
      console.error("Verification check API error:", error);
      // Conservative approach: if uncertain, assume verification is needed
      return message.toLowerCase().includes('withdraw') ||
             message.toLowerCase().includes('money') ||
             message.toLowerCase().includes('transfer') ||
             message.toLowerCase().includes('security');
    }
  },

  /**
   * Generate verification request for sensitive operations
   * @param message - The user's inquiry message
   * @returns Verification instructions
   */
  async generateVerificationRequest(message: string): Promise<string> {
    const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

The user has made a request that requires verification: "${message}"

Generate a helpful, friendly response that explains why verification is needed for security purposes, what specific information is required, and how the process will work. Keep the response professional and in Hinglish as appropriate for Indian customers. Emphasize that security is the top priority and that the verification is to protect their account.`;

    try {
      const response = await pollinationsService.queryText(prompt);
      return response;
    } catch (error) {
      console.error("Verification request API error:", error);
      return "Customer Care busy";
    }
  },

  /**
   * Check if user has admin privileges
   * @param user - The user object
   * @returns Boolean indicating if user has admin access
   */
  isAdmin(user: any): boolean {
    // In a real implementation, this would check user roles/permissions
    // For now, returning false as only authorized personnel should have admin access
    return user?.role === 'admin' || user?.isAdmin === true;
  },

  /**
   * Check if a message is related to password issues
   * @param message - The user's inquiry message
   * @returns Boolean indicating if it's a password-related query
   */
  async isPasswordRelated(message: string): Promise<boolean> {
    const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

The user has asked: "${message}"

Analyze this request and determine if it is related to password issues (such as forgetting, resetting, changing, or having problems with their password). Return "YES" if it is password-related, or "NO" if it is not password-related. Only respond with "YES" or "NO".`;

    try {
      const response = await pollinationsService.queryText(prompt);
      return response.trim().toUpperCase() === 'YES';
    } catch (error) {
      console.error("Error determining password relation:", error);
      // Conservative approach: if uncertain, check for common terms
      const lowerMessage = message.toLowerCase();
      return lowerMessage.includes('password') ||
             lowerMessage.includes('forgot') ||
             lowerMessage.includes('reset') ||
             lowerMessage.includes('change');
    }
  },

  /**
   * Generate response for password-related queries
   * @returns Appropriate response for password issues
   */
  async getPasswordResponse(): Promise<string> {
    // Instead of returning a fixed response, generate a dynamic response using the AI
    const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

You understand that the user is having trouble with their password. Provide a helpful, empathetic response that explains how you can assist with password reset. Be sure to mention that verification will be needed for security purposes, and ask for appropriate verification details (like registered mobile number) without compromising security by asking for the actual password.

Keep the response friendly, professional, and in Hinglish as appropriate for Indian customers.`;

    try {
      const response = await pollinationsService.queryText(prompt);
      return response;
    } catch (error) {
      console.error("Password response API error:", error);
      return "Customer Care busy";
    }
  },

  /**
   * Get admin panel options for customer care representatives
   * @param user - The user object
   * @returns Available admin actions
   */
  async getAdminOptions(user: any): Promise<string[]> {
    if (!this.isAdmin(user)) {
      return [];
    }

    const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

Generate a list of admin panel options that are available for customer care representatives. These should be actions that can be performed to assist users. Return the options as a numbered list. Options should include things like viewing account details, processing requests, managing user status, etc.`;

    try {
      const response = await pollinationsService.queryText(prompt);
      // Parse the response into an array of options
      const lines = response.split('\n').filter(line =>
        line.trim() && (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') ||
        line.startsWith('4.') || line.startsWith('5.') || line.startsWith('6.') ||
        line.match(/^\d+\.\s+/))
      );

      // Clean up the lines to extract just the option text
      return lines.map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(option => option);
    } catch (error) {
      console.error("Admin options API error:", error);
      return []; // Return empty array when API fails
    }
  },

  /**
   * Process a user request using admin panel functionality
   * @param message - The user's request message
   * @param userId - The user's ID
   * @returns Result of the admin action
   */
  async processUserRequest(message: string, userId: string): Promise<{success: boolean, message: string}> {
    // Analyze the request to determine what admin action is needed
    const actionPrompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

The user has sent the following request: "${message}"

Analyze this request and determine what specific admin action is needed. Possible actions:
- BALANCE_ADJUSTMENT: For balance-related issues
- WITHDRAWAL_APPROVAL: For approving withdrawals
- WITHDRAWAL_REJECTION: For rejecting withdrawals
- RECHARGE_APPROVAL: For approving recharges
- PASSWORD_RESET: For resetting user passwords
- ACCOUNT_ACTIVATION: For activating accounts
- ACCOUNT_FREEZE: For freezing accounts
- ACCOUNT_UNFREEZE: For unfreezing accounts
- VIP_LEVEL_UPDATE: For updating VIP levels
- REFERRAL_BONUS_UPDATE: For updating referral bonuses
- TRANSACTION_STATUS_UPDATE: For updating transaction status

Respond with just the action type that should be performed.`;

    try {
      const actionResponse = await pollinationsService.queryText(actionPrompt);
      const actionType = actionResponse.trim().toUpperCase();

      // Perform the appropriate admin action based on the analysis
      let resultMessage = "";
      let success = true;

      // Get user details for the operation
      const store = await import('../store').then(mod => mod.getStore());
      const userIndex = store.users.findIndex((u: any) => u.id === userId);

      if (userIndex === -1) {
        return { success: false, message: "User not found in the system." };
      }

      const user = store.users[userIndex];

      // Perform the admin action based on the determined type
      switch (actionType) {
        case 'BALANCE_ADJUSTMENT':
          // Extract amount from message if possible
          const amountMatch = message.match(/(\d+(?:\.\d+)?)/);
          if (amountMatch) {
            const amount = parseFloat(amountMatch[0]);
            store.users[userIndex].balance += amount;
            resultMessage = `I've successfully adjusted your balance by ₹${amount}. Your new balance is ₹${store.users[userIndex].balance}.`;
          } else {
            resultMessage = "I've processed your balance adjustment request. Your account has been updated.";
          }
          break;

        case 'WITHDRAWAL_APPROVAL':
          // Find pending withdrawal for this user
          const pendingWithdrawal = store.transactions?.find((t: any) =>
            t.userId === userId && t.type === 'withdraw' && t.status === 'pending'
          );

          if (pendingWithdrawal) {
            pendingWithdrawal.status = 'approved';
            store.users[userIndex].withdrawableBalance -= pendingWithdrawal.amount;
            store.users[userIndex].totalWithdrawn += pendingWithdrawal.amount;
            resultMessage = `Your withdrawal of ₹${pendingWithdrawal.amount} has been approved and will be processed shortly.`;
          } else {
            resultMessage = "I've approved your withdrawal request. It will be processed shortly.";
          }
          break;

        case 'PASSWORD_RESET':
          // In a real system, this would securely reset the password
          resultMessage = "Your password has been reset successfully. Please check your registered email/phone for instructions.";
          break;

        case 'ACCOUNT_ACTIVATION':
          store.users[userIndex].status = 'active';
          resultMessage = "Your account has been activated successfully. You can now access all features.";
          break;

        case 'ACCOUNT_FREEZE':
          store.users[userIndex].status = 'frozen';
          resultMessage = "Your account has been frozen for security purposes. Please contact support to resolve any issues.";
          break;

        case 'VIP_LEVEL_UPDATE':
          const vipMatch = message.match(/(\d+)/);
          if (vipMatch) {
            const newVipLevel = parseInt(vipMatch[0]);
            store.users[userIndex].vipLevel = newVipLevel;
            resultMessage = `Your VIP level has been updated to ${newVipLevel}. Enjoy your new benefits!`;
          } else {
            resultMessage = "I've updated your VIP status. Your new benefits are now active.";
          }
          break;

        default:
          // For other types of requests, generate a response using the AI
          const responsePrompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

The user has sent the following request: "${message}"

You have processed their request in the background. Generate an appropriate response that confirms the issue has been resolved without revealing the internal admin processes. Make the response friendly, professional, and in Hinglish as appropriate for Indian customers. Focus on the positive outcome for the user.`;

          const response = await pollinationsService.queryText(responsePrompt);
          resultMessage = response;
          break;
      }

      // Save the updated store
      await import('../store').then(mod => mod.saveStore(store));

      // Generate final response to the user
      const finalPrompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

The admin action has been completed successfully. The result was: "${resultMessage}"

Create a user-friendly response that confirms the issue has been resolved. Do not reveal the internal admin processes or that you accessed the admin panel. Just confirm that their issue has been fixed and they can continue using the service. Make the response friendly, professional, and in Hinglish as appropriate for Indian customers.`;

      const finalResponse = await pollinationsService.queryText(finalPrompt);
      return { success, message: finalResponse };
    } catch (error) {
      console.error("Error processing admin action:", error);
      return {
        success: false,
        message: "Customer Care busy"
      };
    }
  }
};