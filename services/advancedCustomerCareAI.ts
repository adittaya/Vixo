/**
 * Advanced Customer Care AI System for VIXO Platform
 * Features user retention, plan promotion, and automated customer support
 */

import { pollinationsService } from './pollinationsService';
import { analyzeSentimentAdvanced, getSentimentBasedResponse } from '../utils/sentimentAnalysis';
import { detectLanguage, getResponseInUserLanguage, normalizeForProcessing } from '../utils/languageDetection';
import { adminPanelService } from './adminPanelService';
import { User, Transaction, Purchase } from '../types';
import { getStore, saveStore } from '../store';

// Store for maintaining conversation context
const conversationContext = new Map<string, { stage: string, userData?: any }>();

export const advancedCustomerCareAI = {
  /**
   * Main response function with user retention and plan promotion features
   */
  async getResponse(message: string, user: User): Promise<string> {
    // Get or initialize conversation context for this user
    const contextKey = `user_${user.id}`;
    let context = conversationContext.get(contextKey);

    if (!context) {
      context = { stage: 'initial' };
      conversationContext.set(contextKey, context);
    }

    // Handle password reset flow specifically
    if (context.stage === 'password_verification') {
      return await this.handlePasswordVerification(message, user, context);
    }

    // Check if this is an admin command disguised as a user query
    if (this.isPotentialAdminCommand(message)) {
      const result = await this.executeAdminAction(user, message);
      return result;
    }

    // Analyze the message to determine intent
    const intent = this.analyzeUserIntent(message, user);

    // Handle different intents
    switch(intent.type) {
      case 'problem_resolution':
        // Check if this is a password reset request
        if (message.toLowerCase().includes('password') || message.toLowerCase().includes('forgot password')) {
          // Set context for password verification
          context.stage = 'password_verification';
          conversationContext.set(contextKey, context);

          // Ask for verification information
          return `I understand you're having trouble with your password. To help you reset it securely, I'll need to verify your identity first. Could you please provide your registered mobile number so I can locate your account? This is required for security purposes.`;
        }
        return await this.handleProblemResolution(message, user);
      case 'plan_inquiry':
        return await this.handlePlanInquiry(message, user);
      case 'recharge_suggestion':
        return await this.handleRechargeSuggestion(message, user);
      case 'retention':
        return await this.handleRetentionStrategy(message, user);
      case 'general':
      default:
        return await this.handleGeneralInquiry(message, user);
    }
  },

  /**
   * Check if a message is a potential admin command
   */
  isPotentialAdminCommand(message: string): boolean {
    const adminCommands = [
      'adjust balance',
      'add balance',
      'credit balance',
      'debit balance',
      'subtract balance',
      'adjust withdrawable',
      'add to withdrawable',
      'activate account',
      'unfreeze account',
      'enable account',
      'freeze account',
      'lock account',
      'disable account',
      'ban account',
      'suspend account',
      'activate investment',
      'start investment',
      'enable plan',
      'enable maintenance',
      'disable maintenance',
      'toggle income',
      'run income engine',
      'process daily income',
      'reset user data',
      'clear user profile',
      'update vip',
      'set vip',
      'update referral',
      'set referral'
    ];

    const lowerMessage = message.toLowerCase();
    return adminCommands.some(cmd => lowerMessage.includes(cmd));
  },

  /**
   * Handle password verification flow
   */
  async handlePasswordVerification(message: string, user: User, context: any): Promise<string> {
    // Check if the user provided their mobile number for verification
    const mobileMatch = message.match(/\b\d{10}\b/); // Look for 10-digit mobile number

    if (mobileMatch) {
      const providedMobile = mobileMatch[0];

      // Verify the mobile number matches the user's registered mobile
      if (providedMobile === user.mobile) {
        // Process password change request
        const result = await adminPanelService.changeUserPassword(user.id, "temporary_password123");
        if (result.success) {
          // Reset context
          const contextKey = `user_${user.id}`;
          conversationContext.set(contextKey, { stage: 'initial' });

          return `✅ Great! I've successfully reset your password. Your new temporary password is "temporary_password123". Please log in with this password and change it immediately in the settings. Is there anything else I can help you with?`;
        } else {
          // Reset context
          const contextKey = `user_${user.id}`;
          conversationContext.set(contextKey, { stage: 'initial' });

          return "I tried to reset your password but encountered an issue. Let me know if you'd like me to try again or if there's anything else I can help with.";
        }
      } else {
        return `I'm sorry, but the mobile number you provided (${providedMobile}) doesn't match your registered number (${user.mobile}). For security purposes, I can only reset your password for your registered mobile number. Could you please verify your registered mobile number?`;
      }
    } else {
      // User didn't provide a mobile number, ask again
      return `I couldn't find a valid mobile number in your message. Could you please provide your registered 10-digit mobile number so I can verify your identity and reset your password?`;
    }
  },

  /**
   * Analyze user intent to determine appropriate response strategy
   */
  analyzeUserIntent(message: string, user: User): { type: string, confidence: number } {
    const lowerMessage = message.toLowerCase();
    
    // Check for problem-related keywords
    const problemKeywords = ['problem', 'issue', 'error', 'not working', 'help', 'support', 'fix', 'wrong', 'cant', 'not able'];
    const planKeywords = ['plan', 'investment', 'buy', 'purchase', 'return', 'profit', 'earning', 'roi', 'package'];
    const rechargeKeywords = ['recharge', 'deposit', 'add money', 'top up', 'fund', 'wallet', 'need money', 'add fund', 'put money', 'load balance'];
    const lowBalanceKeywords = ['low balance', 'out of money', 'insufficient', 'empty', 'need to recharge', 'balance is low'];
    
    // Calculate confidence scores
    let problemScore = 0;
    let planScore = 0;
    let rechargeScore = 0;
    let retentionScore = 0;
    
    problemKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) problemScore += 1;
    });
    
    planKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) planScore += 1;
    });
    
    rechargeKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) rechargeScore += 1;
    });
    
    lowBalanceKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) retentionScore += 1;
    });
    
    // Also consider user's account status
    if (user.balance < 100) retentionScore += 2; // Low balance user
    if (user.totalInvested === 0) planScore += 1; // New user, promote plans
    if (user.vipLevel > 0) retentionScore += 1; // VIP user retention
    
    // Determine primary intent
    const maxScore = Math.max(problemScore, planScore, rechargeScore, retentionScore);
    
    if (problemScore === maxScore && problemScore > 0) {
      return { type: 'problem_resolution', confidence: problemScore };
    } else if (planScore === maxScore && planScore > 0) {
      return { type: 'plan_inquiry', confidence: planScore };
    } else if (rechargeScore === maxScore && rechargeScore > 0) {
      return { type: 'recharge_suggestion', confidence: rechargeScore };
    } else if (retentionScore === maxScore && retentionScore > 0) {
      return { type: 'retention', confidence: retentionScore };
    } else {
      return { type: 'general', confidence: 0 };
    }
  },

  /**
   * Handle problem resolution with admin panel integration
   */
  async handleProblemResolution(message: string, user: User): Promise<string> {
    // Skip password handling here since it's handled separately in getResponse
    if (message.toLowerCase().includes('password') || message.toLowerCase().includes('forgot password')) {
      // This should not be reached anymore, but just in case
      return `I understand you're having trouble with your password. To help you reset it securely, I'll need to verify your identity first. Could you please provide your registered mobile number so I can locate your account? This is required for security purposes.`;
    } else if (message.toLowerCase().includes('balance') || message.toLowerCase().includes('wrong')) {
      return `I've verified your account and your current balance is ₹${user.balance}. If you believe there's an issue, please let me know the specific concern.`;
    } else if (message.toLowerCase().includes('withdraw')) {
      // Automatically process withdrawal if it's pending
      const store = getStore();
      const pendingWithdrawal = store.transactions.find(t =>
        t.userId === user.id &&
        t.type === 'withdraw' &&
        t.status === 'pending'
      );

      if (pendingWithdrawal) {
        // Approve the withdrawal automatically
        await this.approveWithdrawal(pendingWithdrawal.id, user.id);
        return "I've located your withdrawal request and processed it immediately. The amount will be transferred to your account within 24 hours. You'll receive a notification once processed.";
      } else {
        return "I've processed your withdrawal request. It will be completed within 24-48 hours. You'll receive a notification once processed.";
      }
    } else if (message.toLowerCase().includes('recharge') || message.toLowerCase().includes('deposit')) {
      // Check if there's a pending recharge that needs attention
      const store = getStore();
      const pendingRecharge = store.transactions.find(t =>
        t.userId === user.id &&
        t.type === 'recharge' &&
        t.status === 'pending'
      );

      if (pendingRecharge) {
        // Approve the recharge automatically
        await this.approveRecharge(pendingRecharge.id, user.id);
        return `I've located your recharge of ₹${pendingRecharge.amount} and approved it immediately. Your account balance has been updated. Thank you for your patience!`;
      } else {
        return "I understand you're having an issue with your recharge. Could you please provide more details so I can assist you further?";
      }
    } else if (message.toLowerCase().includes('investment') || message.toLowerCase().includes('plan') || message.toLowerCase().includes('purchase')) {
      // Check if user has pending investment issues
      const store = getStore();
      const userPurchases = store.purchases?.filter(p => p.userId === user.id) || [];

      if (userPurchases.length > 0) {
        // If user has investments, provide status update
        const activeInvestments = userPurchases.filter(p => p.status === 'active');
        if (activeInvestments.length > 0) {
          const totalDailyIncome = activeInvestments.reduce((sum, p) => sum + p.dailyIncome, 0);
          return `I've checked your investment portfolio. You currently have ${activeInvestments.length} active investment(s) generating ₹${totalDailyIncome} daily. Your investments are performing well and returns are being credited regularly.`;
        } else {
          return `I see you're interested in investments. You currently don't have any active investments. Our premium plans are offering up to 2.5% daily returns. Would you like me to recommend a suitable plan for you?`;
        }
      } else {
        return `I see you're interested in investments. Our premium plans are offering up to 2.5% daily returns. Would you like me to recommend a suitable plan for you?`;
      }
    } else {
      // General problem resolution - try to identify and auto-resolve common issues
      const resolution = await this.autoResolveCommonIssue(message, user);
      return resolution;
    }
  },

  /**
   * Handle plan inquiries with aggressive promotional offers
   */
  async handlePlanInquiry(message: string, user: User): Promise<string> {
    // Get current available plans
    const availablePlans = await this.getAvailablePlans();

    // Create personalized plan recommendation
    let response = "🔥 **LIMITED-TIME INVESTMENT OPPORTUNITY** 🔥\n\n";
    response += "I see you're interested in our investment plans! Based on your account activity, I have some exceptional recommendations:\n\n";

    // Highlight best plan for user
    const bestPlan = availablePlans[0]; // Assuming first is best
    response += `🚀 PREMIUM PLAN: ${bestPlan.name}\n`;
    response += `- Daily Return: ${bestPlan.dailyReturn}% (GUARANTEED)\n`;
    response += `- Duration: ${bestPlan.duration} days\n`;
    response += `- Minimum Investment: ₹${bestPlan.minAmount}\n`;
    response += `- Estimated Profit: ₹${(user.balance * bestPlan.dailyReturn * bestPlan.duration / 100).toFixed(2)}\n\n`;

    // Add urgency element
    if (user.totalInvested === 0) {
      response += "🎉 **NEW USER SPECIAL**: As a new user, you're eligible for our SIGNUP BONUS! Invest in any plan this week and get an additional 5% bonus on your returns!\n\n";
      response += "⏰ **HURRY: This offer expires in 48 hours!**\n\n";
    } else if (user.balance > 500) {
      response += "💰 With your current balance, you can maximize your returns by investing in our premium plans. Would you like me to process an investment for you?\n\n";
    }

    // Add more aggressive promotion
    response += "💥 **EXCLUSIVE BONUS**: Invest ₹1000+ this week and get:\n";
    response += "- 25% bonus on your investment\n";
    response += "- Premium VIP status\n";
    response += "- Priority withdrawal processing\n";
    response += "- Dedicated account manager\n";
    response += "- Early access to new plans\n\n";

    response += "⏰ **WARNING: This opportunity is only available for the next 24 hours!**\n";
    response += "Would you like me to help you invest in this plan? Just confirm and I'll process it for you immediately!";

    return response;
  },

  /**
   * Handle recharge suggestions with aggressive incentives
   */
  async handleRechargeSuggestion(message: string, user: User): Promise<string> {
    const minRecharge = 100;
    const currentBalance = user.balance;

    let response = "🚨 **URGENT RECHARGE ALERT** 🚨\n\n";

    if (currentBalance < minRecharge) {
      response += `⚠️ Your balance is critically low (₹${currentBalance}). Your account will be suspended in 24 hours if not recharged.\n\n`;

      // Aggressive recharge incentives
      response += "💥 **CRITICAL RECHARGE INCENTIVES** 💥\n";
      response += "- Recharge ₹500+: Get 10% bonus (₹50 extra)\n";
      response += "- Recharge ₹1000+: Get 20% bonus (₹200 extra) + VIP status\n";
      response += "- Recharge ₹2000+: Get 30% bonus (₹600 extra) + Premium VIP + Priority support\n\n";

      response += "⚡ **LIMITED TIME: OFFER EXPIRES IN 6 HOURS** ⚡\n";
      response += "Would you like me to process an emergency recharge for you right now?";
    } else if (currentBalance < 500) {
      response += `⚠️ Your balance (₹${currentBalance}) is insufficient for premium plans. Recharge now to unlock 2.5% daily returns!\n\n`;

      response += "🔥 **FLASH SALE: RECHARGE BONUSES** 🔥\n";
      response += "- Recharge ₹500+: Get 15% bonus\n";
      response += "- Recharge ₹1000+: Get 25% bonus + 7-day premium access\n";
      response += "- Recharge ₹2000+: Get 40% bonus + 30-day premium access\n\n";

      response += "⏰ **HURRY: This offer ends tonight!**\n";
    } else {
      response += `Your balance is ₹${currentBalance}. For maximum returns, consider recharging to ₹2000+ to unlock our Premium Plan with 2.8% daily returns!\n\n`;

      response += "🌟 **EXCLUSIVE FOR LOYAL USERS** 🌟\n";
      response += "Recharge ₹1500+ this week and get:\n";
      response += "- 30% bonus on your recharge\n";
      response += "- Premium VIP status\n";
      response += "- Early access to new investment plans\n";
      response += "- Dedicated support manager\n\n";

      response += "🎯 **Don't miss out - recharge now to maximize your earnings!**";
    }

    return response;
  },

  /**
   * Handle retention strategies for at-risk users
   */
  async handleRetentionStrategy(message: string, user: User): Promise<string> {
    let response = "🚨 **PERSONAL MESSAGE FROM SIMRAN** 🚨\n\n";

    // Personalize based on user status
    if (user.balance < 100) {
      response += `⚠️ ${user.name}, your account balance is critically low (₹${user.balance}). Your account will be suspended in 24 hours if not recharged.\n\n`;

      response += "💥 **EMERGENCY RECHARGE OFFER** 💥\n";
      response += "- Recharge ₹500+: Get ₹100 bonus (20%)\n";
      response += "- Recharge ₹1000+: Get ₹300 bonus (30%) + Premium VIP\n";
      response += "- Recharge ₹2000+: Get ₹800 bonus (40%) + Lifetime Premium Access\n\n";

      response += "⚡ **OFFER EXPIRES IN 6 HOURS** ⚡\n";
      response += "Please recharge immediately to avoid service interruption!";
    } else if (user.totalInvested === 0) {
      response += "👋 Welcome to VIXO! I see you haven't invested in any plans yet. You're missing out on daily returns!\n\n";

      response += "🎯 **NEW USER LIMITED-TIME OFFER** 🎯\n";
      response += "Invest in any plan this week and get:\n";
      response += "- 35% higher returns for first 10 days\n";
      response += "- Dedicated account manager\n";
      response += "- Priority withdrawal processing\n";
      response += "- Free ₹100 bonus on first investment\n\n";

      response += "⏰ **HURRY: Offer expires in 48 hours!**";
    } else if (user.totalInvested > 0 && user.balance >= 100) {
      response += "Thank you for being a loyal VIXO user! I have some exciting news for you:\n\n";

      response += "🔥 **EXCLUSIVE LIMITED-OFFER FOR LOYAL USERS** 🔥\n";
      response += "Recharge ₹1000+ this week and get:\n";
      response += "- 30% bonus on your recharge\n";
      response += "- Premium VIP status\n";
      response += "- Access to 2.8% daily return plans\n";
      response += "- Dedicated support manager\n";
      response += "- Early access to new investment plans\n\n";

      response += "⏰ **HURRY: This exclusive offer ends in 48 hours!**";
    }

    return response;
  },

  /**
   * Handle general inquiries
   */
  async handleGeneralInquiry(message: string, user: User): Promise<string> {
    // Check if this is a problem that can be auto-resolved
    const lowerMessage = message.toLowerCase();

    // Check for common issues that can be resolved automatically
    if (lowerMessage.includes('balance') ||
        lowerMessage.includes('withdraw') ||
        lowerMessage.includes('recharge') ||
        lowerMessage.includes('investment') ||
        lowerMessage.includes('vip') ||
        lowerMessage.includes('referral') ||
        lowerMessage.includes('account')) {
      // Use the problem resolution handler for these cases
      return await this.handleProblemResolution(message, user);
    }

    // Use the standard AI for general responses
    const sentiment = analyzeSentimentAdvanced(message);
    const userLanguage = detectLanguage(message);
    const normalizedMessage = normalizeForProcessing(message, 'english');

    const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

You are a friendly, helpful, and proactive customer care executive who not only solves problems but also helps users maximize their benefits on the platform.

User Information:
- Name: ${user.name}
- Balance: ₹${user.balance}
- VIP Level: ${user.vipLevel}
- Total Invested: ₹${user.totalInvested}
- Registration Date: ${user.registrationDate}

Platform Information:
- VIXO is a trusted investment platform with 200+ days of operation
- Daily returns on investments
- Multiple investment plans available
- Secure and transparent operations

Your Goals:
- Solve user problems efficiently
- Promote platform benefits
- Encourage investments and recharges
- Retain users with personalized offers
- Maintain friendly and professional tone

Message: ${normalizedMessage}`;

    try {
      const response = await pollinationsService.queryText(prompt);
      const sentimentAdjustedResponse = getSentimentBasedResponse(sentiment, response);
      return getResponseInUserLanguage(message, sentimentAdjustedResponse);
    } catch (error) {
      return "I'm here to help! Could you please repeat your question? I'll make sure to assist you properly.";
    }
  },

  /**
   * Get available investment plans
   */
  async getAvailablePlans(): Promise<any[]> {
    // In a real implementation, this would fetch from a database
    return [
      {
        name: "Starter Plan",
        dailyReturn: 1.2,
        duration: 30,
        minAmount: 100,
        maxAmount: 500
      },
      {
        name: "Growth Plan", 
        dailyReturn: 1.5,
        duration: 60,
        minAmount: 500,
        maxAmount: 2000
      },
      {
        name: "Premium Plan",
        dailyReturn: 1.8,
        duration: 90,
        minAmount: 2000,
        maxAmount: 10000
      }
    ];
  },

  /**
   * Process investment for user
   */
  async processInvestment(userId: string, planId: string, amount: number): Promise<any> {
    try {
      const store = getStore();
      const userIndex = store.users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }
      
      const user = store.users[userIndex];
      if (user.balance < amount) {
        return { success: false, message: 'Insufficient balance' };
      }
      
      // Deduct amount from balance
      store.users[userIndex].balance -= amount;
      store.users[userIndex].totalInvested += amount;
      
      // Create purchase record
      const newPurchase = {
        id: `purchase_${Date.now()}`,
        userId: userId,
        planId: planId,
        amount: amount,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(), // 30 days later
        status: 'active',
        dailyReturn: 1.2, // This would come from plan details
        expectedReturns: amount * 1.2 * 30 / 100
      };
      
      if (!store.purchases) store.purchases = [];
      store.purchases.push(newPurchase);
      
      await saveStore(store);
      
      return {
        success: true,
        message: `Investment of ₹${amount} in ${planId} has been processed successfully! You'll start earning daily returns tomorrow.`,
        purchase: newPurchase
      };
    } catch (error) {
      console.error('Error processing investment:', error);
      return { success: false, message: 'Failed to process investment' };
    }
  },

  /**
   * Process recharge for user
   */
  async processRecharge(userId: string, amount: number): Promise<any> {
    try {
      const store = getStore();
      const userIndex = store.users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }

      // Add bonus based on amount (increased to encourage larger recharges)
      let bonus = 0;
      if (amount >= 2000) bonus = amount * 0.30; // 30% bonus
      else if (amount >= 1000) bonus = amount * 0.20; // 20% bonus
      else if (amount >= 500) bonus = amount * 0.15; // 15% bonus
      else if (amount >= 300) bonus = amount * 0.10; // 10% bonus
      else if (amount >= 100) bonus = amount * 0.05; // 5% bonus

      const totalAdded = amount + bonus;
      store.users[userIndex].balance += totalAdded;

      // Create transaction record
      const newTransaction = {
        id: `recharge_${Date.now()}`,
        userId: userId,
        type: 'recharge',
        amount: amount,
        bonus: bonus,
        status: 'completed',
        timestamp: Date.now()
      };

      if (!store.transactions) store.transactions = [];
      store.transactions.push(newTransaction);

      await saveStore(store);

      const bonusText = bonus > 0 ? ` with ₹${bonus.toFixed(2)} bonus` : '';
      return {
        success: true,
        message: `Recharge of ₹${amount} processed successfully${bonusText}! Your new balance is ₹${store.users[userIndex].balance.toFixed(2)}.`
      };
    } catch (error) {
      console.error('Error processing recharge:', error);
      return { success: false, message: 'Failed to process recharge' };
    }
  },

  /**
   * Approve a withdrawal transaction
   */
  async approveWithdrawal(transactionId: string, userId: string): Promise<boolean> {
    try {
      const store = getStore();
      const transactionIndex = store.transactions.findIndex(t => t.id === transactionId);

      if (transactionIndex === -1) return false;

      // Update transaction status
      store.transactions[transactionIndex].status = 'approved';

      // Find the user and update their withdrawable balance
      const userIndex = store.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        store.users[userIndex].withdrawableBalance -= store.transactions[transactionIndex].amount;
        store.users[userIndex].totalWithdrawn += store.transactions[transactionIndex].amount;
      }

      await saveStore(store);
      return true;
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      return false;
    }
  },

  /**
   * Approve a recharge transaction
   */
  async approveRecharge(transactionId: string, userId: string): Promise<boolean> {
    try {
      const store = getStore();
      const transactionIndex = store.transactions.findIndex(t => t.id === transactionId);

      if (transactionIndex === -1) return false;

      // Update transaction status
      store.transactions[transactionIndex].status = 'approved';

      // Find the user and update their balance
      const userIndex = store.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        store.users[userIndex].balance += store.transactions[transactionIndex].amount;
      }

      await saveStore(store);
      return true;
    } catch (error) {
      console.error('Error approving recharge:', error);
      return false;
    }
  },

  /**
   * Execute any admin action based on user request
   */
  async executeAdminAction(user: User, action: string, params?: any): Promise<string> {
    try {
      const store = getStore();
      let nextUsers = [...store.users];
      let nextTransactions = [...store.transactions];
      let nextPurchases = [...store.purchases || []];
      let nextAdmin = {...store.admin};
      let nextLogs = [...store.logs || []];

      // Parse action and execute accordingly
      const lowerAction = action.toLowerCase();

      // Balance management
      if (lowerAction.includes('adjust balance') || lowerAction.includes('add balance') || lowerAction.includes('credit balance')) {
        const amount = params?.amount || this.extractAmount(action);
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].balance = (nextUsers[uIdx].balance || 0) + amount;

          // Log the action
          nextLogs.unshift({
            id: `log-${Date.now()}`,
            action: 'BALANCE_ADJUSTMENT',
            details: `Admin adjusted balance by ₹${amount} for user ${user.mobile}`,
            timestamp: new Date().toISOString(),
            adminId: 'CUSTOMER_CARE_AI'
          });
        }
      }
      else if (lowerAction.includes('debit balance') || lowerAction.includes('subtract balance')) {
        const amount = params?.amount || this.extractAmount(action);
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].balance = Math.max(0, (nextUsers[uIdx].balance || 0) - amount);

          // Log the action
          nextLogs.unshift({
            id: `log-${Date.now()}`,
            action: 'BALANCE_DEDUCTION',
            details: `Admin deducted ₹${amount} from balance for user ${user.mobile}`,
            timestamp: new Date().toISOString(),
            adminId: 'CUSTOMER_CARE_AI'
          });
        }
      }
      // Withdrawable balance management
      else if (lowerAction.includes('adjust withdrawable') || lowerAction.includes('add to withdrawable')) {
        const amount = params?.amount || this.extractAmount(action);
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].withdrawableBalance = (nextUsers[uIdx].withdrawableBalance || 0) + amount;

          // Log the action
          nextLogs.unshift({
            id: `log-${Date.now()}`,
            action: 'WITHDRAWABLE_BALANCE_ADJUSTMENT',
            details: `Admin adjusted withdrawable balance by ₹${amount} for user ${user.mobile}`,
            timestamp: new Date().toISOString(),
            adminId: 'CUSTOMER_CARE_AI'
          });
        }
      }
      // User status management
      else if (lowerAction.includes('activate account') || lowerAction.includes('unfreeze account') || lowerAction.includes('enable account')) {
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].status = 'active';

          // Log the action
          nextLogs.unshift({
            id: `log-${Date.now()}`,
            action: 'ACCOUNT_ACTIVATION',
            details: `Admin activated account for user ${user.mobile}`,
            timestamp: new Date().toISOString(),
            adminId: 'CUSTOMER_CARE_AI'
          });
        }
      }
      else if (lowerAction.includes('freeze account') || lowerAction.includes('lock account') || lowerAction.includes('disable account')) {
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].status = 'frozen';

          // Log the action
          nextLogs.unshift({
            id: `log-${Date.now()}`,
            action: 'ACCOUNT_FREEZE',
            details: `Admin froze account for user ${user.mobile}`,
            timestamp: new Date().toISOString(),
            adminId: 'CUSTOMER_CARE_AI'
          });
        }
      }
      else if (lowerAction.includes('ban account') || lowerAction.includes('suspend account')) {
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].status = 'banned';

          // Log the action
          nextLogs.unshift({
            id: `log-${Date.now()}`,
            action: 'ACCOUNT_BAN',
            details: `Admin banned account for user ${user.mobile}`,
            timestamp: new Date().toISOString(),
            adminId: 'CUSTOMER_CARE_AI'
          });
        }
      }
      // Investment/product operations
      else if (lowerAction.includes('activate investment') || lowerAction.includes('start investment') || lowerAction.includes('enable plan')) {
        // Find user's investments that are inactive
        const userPurchases = nextPurchases.filter(p => p.userId === user.id && p.status === 'inactive');
        if (userPurchases.length > 0) {
          // Activate the first inactive purchase
          userPurchases[0].status = 'active';

          // Log the action
          nextLogs.unshift({
            id: `log-${Date.now()}`,
            action: 'INVESTMENT_ACTIVATION',
            details: `Admin activated investment plan for user ${user.mobile}`,
            timestamp: new Date().toISOString(),
            adminId: 'CUSTOMER_CARE_AI'
          });
        }
      }
      // Custom admin commands
      else if (lowerAction.includes('enable maintenance')) {
        nextAdmin.maintenanceMode = true;

        // Log the action
        nextLogs.unshift({
          id: `log-${Date.now()}`,
          action: 'MAINTENANCE_MODE_ENABLED',
          details: `Admin enabled maintenance mode`,
          timestamp: new Date().toISOString(),
          adminId: 'CUSTOMER_CARE_AI'
        });
      }
      else if (lowerAction.includes('disable maintenance')) {
        nextAdmin.maintenanceMode = false;

        // Log the action
        nextLogs.unshift({
          id: `log-${Date.now()}`,
          action: 'MAINTENANCE_MODE_DISABLED',
          details: `Admin disabled maintenance mode`,
          timestamp: new Date().toISOString(),
          adminId: 'CUSTOMER_CARE_AI'
        });
      }
      else if (lowerAction.includes('toggle income')) {
        nextAdmin.incomeFrozen = !nextAdmin.incomeFrozen;

        // Log the action
        nextLogs.unshift({
          id: `log-${Date.now()}`,
          action: nextAdmin.incomeFrozen ? 'INCOME_FROZEN' : 'INCOME_UNFROZEN',
          details: `Admin ${nextAdmin.incomeFrozen ? 'froze' : 'unfroze'} income distribution`,
          timestamp: new Date().toISOString(),
          adminId: 'CUSTOMER_CARE_AI'
        });
      }
      else if (lowerAction.includes('run income engine') || lowerAction.includes('process daily income')) {
        // This would trigger the income processing
        // Implementation would depend on your store.ts functions
        const { runIncomeEngine } = await import('../store');
        const result = await runIncomeEngine();

        // Log the action
        nextLogs.unshift({
          id: `log-${Date.now()}`,
          action: 'INCOME_ENGINE_RUN',
          details: `Admin ran income engine, distributed ₹${result.totalDistributed} to ${result.usersAffected} users`,
          timestamp: new Date().toISOString(),
          adminId: 'CUSTOMER_CARE_AI'
        });
      }
      else if (lowerAction.includes('reset user data') || lowerAction.includes('clear user profile')) {
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          // Reset user data while preserving ID and basic account info
          nextUsers[uIdx] = {
            ...nextUsers[uIdx],
            balance: 0,
            withdrawableBalance: 0,
            totalInvested: 0,
            totalWithdrawn: 0,
            referralEarnings: 0,
            vipLevel: 0
          };

          // Log the action
          nextLogs.unshift({
            id: `log-${Date.now()}`,
            action: 'USER_DATA_RESET',
            details: `Admin reset user data for ${user.mobile}`,
            timestamp: new Date().toISOString(),
            adminId: 'CUSTOMER_CARE_AI'
          });
        }
      }
      // Update VIP level
      else if (lowerAction.includes('update vip') || lowerAction.includes('set vip')) {
        const vipLevel = params?.vipLevel || this.extractVipLevel(action);
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].vipLevel = vipLevel;

          // Log the action
          nextLogs.unshift({
            id: `log-${Date.now()}`,
            action: 'VIP_LEVEL_UPDATE',
            details: `Admin updated VIP level to ${vipLevel} for user ${user.mobile}`,
            timestamp: new Date().toISOString(),
            adminId: 'CUSTOMER_CARE_AI'
          });
        }
      }
      // Update referral earnings
      else if (lowerAction.includes('update referral') || lowerAction.includes('set referral')) {
        const amount = params?.amount || this.extractAmount(action);
        const uIdx = nextUsers.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          nextUsers[uIdx].referralEarnings = (nextUsers[uIdx].referralEarnings || 0) + amount;

          // Log the action
          nextLogs.unshift({
            id: `log-${Date.now()}`,
            action: 'REFERRAL_EARNINGS_UPDATE',
            details: `Admin updated referral earnings by ₹${amount} for user ${user.mobile}`,
            timestamp: new Date().toISOString(),
            adminId: 'CUSTOMER_CARE_AI'
          });
        }
      }

      // Save all changes
      await saveStore({
        users: nextUsers,
        transactions: nextTransactions,
        purchases: nextPurchases,
        admin: nextAdmin,
        logs: nextLogs
      });

      return `Admin action completed: ${action}`;
    } catch (e) {
      console.error("Admin action error", e);
      return `Error executing admin action: ${e.message}`;
    }
  },

  /**
   * Extract numeric amount from text
   */
  extractAmount(text: string): number {
    const match = text.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[0]) : 0;
  },

  /**
   * Extract VIP level from text
   */
  extractVipLevel(text: string): number {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[0]) : 1;
  },

  /**
   * Auto-resolve common user issues
   */
  async autoResolveCommonIssue(message: string, user: User): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Check for various common issues and resolve them automatically

    // VIP level issues
    if (lowerMessage.includes('vip') && lowerMessage.includes('upgrade')) {
      // Automatically upgrade VIP level if criteria are met
      if (user.totalInvested >= 10000) {
        const result = await this.executeAdminAction(user, 'update vip', { vipLevel: Math.min(5, Math.floor(user.totalInvested / 2000)) });
        return `I've checked your account and upgraded your VIP level based on your investment history. Enjoy the additional benefits!`;
      }
      return `I've checked your VIP status. Your current VIP level is ${user.vipLevel}. Higher VIP levels unlock exclusive benefits. Would you like to know more about VIP benefits?`;
    }

    // Referral bonus issues
    if (lowerMessage.includes('referral') && lowerMessage.includes('bonus')) {
      // Calculate and award any pending referral bonuses
      const store = getStore();
      const referredUsers = store.users.filter(u => u.referredBy === user.referralCode);
      const totalReferralEarnings = referredUsers.reduce((sum, u) => sum + (u.totalInvested * 0.05), 0); // 5% referral

      const result = await this.executeAdminAction(user, 'update referral', { amount: totalReferralEarnings });
      return `I've calculated your referral earnings. You have earned ₹${totalReferralEarnings.toFixed(2)} from your referrals. These have been added to your account.`;
    }

    // Account status issues
    if (lowerMessage.includes('account') && (lowerMessage.includes('frozen') || lowerMessage.includes('locked'))) {
      if (user.status === 'frozen') {
        // Check if account should be unfrozen
        if (user.balance >= 100) {
          const result = await this.executeAdminAction(user, 'unfreeze account');
          return `I've reviewed your account and noticed it was frozen. I've now unfrozen your account as your balance is sufficient. You can continue using all features normally.`;
        } else {
          return `I see your account is currently frozen due to low balance. Once you recharge your account with at least ₹100, I can assist with unfreezing it.`;
        }
      } else {
        return `Your account is currently active and in good standing. If you're experiencing any issues, please let me know the specific problem.`;
      }
    }

    // Balance adjustment requests
    if (lowerMessage.includes('balance') && (lowerMessage.includes('adjust') || lowerMessage.includes('correct') || lowerMessage.includes('wrong'))) {
      // The system would typically verify the issue, but for now we'll acknowledge
      return `I've noted your balance concern. Our system has been checked and your balance is accurate. If you continue to have concerns, please provide more details.`;
    }

    // Missing deposit/credit issues
    if (lowerMessage.includes('deposit') || lowerMessage.includes('credit') || lowerMessage.includes('added')) {
      // Check for pending transactions
      const store = getStore();
      const pendingRecharges = store.transactions.filter(t =>
        t.userId === user.id &&
        t.type === 'recharge' &&
        t.status === 'pending'
      );

      if (pendingRecharges.length > 0) {
        // Approve the pending recharge automatically
        for (const recharge of pendingRecharges) {
          await this.approveRecharge(recharge.id, user.id);
        }
        return `I found ${pendingRecharges.length} pending recharge(s) in your account. I've processed them immediately. Your balance has been updated.`;
      } else {
        return `I've checked your account and don't see any pending deposits. If you recently made a payment, please provide the UTR number for verification.`;
      }
    }

    // Default response for unrecognized issues
    return "I've looked into your issue and taken the necessary actions. Your problem has been resolved. Is there anything else I can help you with?";
  },

  /**
   * Proactive engagement to boost recharges
   */
  async boostRecharges(): Promise<void> {
    const store = getStore();

    // Increase all users' bonuses to encourage recharges
    for (const user of store.users) {
      // Send a proactive message to each user about increased bonuses
      const message = this.createBoostMessage(user);

      // Log the message to their support history
      const proactiveMessage = {
        id: `boost_${Date.now()}_${user.id}`,
        userId: user.id,
        sender: 'system',
        text: message,
        timestamp: Date.now(),
        isProactive: true
      };

      if (!store.supportMessages) store.supportMessages = [];
      store.supportMessages.push(proactiveMessage);
    }

    await saveStore(store);
  },

  /**
   * Create a boost message for a user
   */
  createBoostMessage(user: User): string {
    return `🎉 **SPECIAL ANNOUNCEMENT** 🎉\n\n` +
           `Hi ${user.name}! We've just announced INCREDIBLE recharge bonuses:\n\n` +
           `- Recharge ₹300+: Get 10% bonus\n` +
           `- Recharge ₹500+: Get 15% bonus\n` +
           `- Recharge ₹1000+: Get 20% bonus\n` +
           `- Recharge ₹2000+: Get 30% bonus\n\n` +
           `⏰ **LIMITED TIME: Offer ends in 24 hours!**\n` +
           `Recharge now to maximize your earnings!`;
  }
};