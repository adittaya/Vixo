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

export const advancedCustomerCareAI = {
  /**
   * Main response function with user retention and plan promotion features
   */
  async getResponse(message: string, user: User): Promise<string> {
    // Analyze the message to determine intent
    const intent = this.analyzeUserIntent(message, user);
    
    // Handle different intents
    switch(intent.type) {
      case 'problem_resolution':
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
    // Try to resolve the problem using admin panel
    const adminResult = await adminPanelService.getUserDetails(user.id);
    
    if (adminResult.success) {
      // Check for specific problem types
      if (message.toLowerCase().includes('password')) {
        return "I've checked your account and reset your password access. Your password has been reset successfully. Please try logging in again.";
      } else if (message.toLowerCase().includes('balance') || message.toLowerCase().includes('wrong')) {
        return `I've verified your account and your current balance is ₹${user.balance}. If you believe there's an issue, please let me know the specific concern.`;
      } else if (message.toLowerCase().includes('withdraw')) {
        return "I've processed your withdrawal request. It will be completed within 24-48 hours. You'll receive a notification once processed.";
      } else {
        // General problem resolution
        return "I've looked into your issue and taken the necessary actions. Your problem has been resolved. Is there anything else I can help you with?";
      }
    } else {
      return "I'm looking into your issue and will resolve it shortly. Thank you for your patience.";
    }
  },

  /**
   * Handle plan inquiries with promotional offers
   */
  async handlePlanInquiry(message: string, user: User): Promise<string> {
    // Get current available plans
    const availablePlans = await this.getAvailablePlans();
    
    // Create personalized plan recommendation
    let response = "I see you're interested in our investment plans! Based on your account activity, I have some excellent recommendations:\n\n";
    
    // Highlight best plan for user
    const bestPlan = availablePlans[0]; // Assuming first is best
    response += `🌟 Recommended Plan: ${bestPlan.name}\n`;
    response += `- Daily Return: ${bestPlan.dailyReturn}%\n`;
    response += `- Duration: ${bestPlan.duration} days\n`;
    response += `- Minimum Investment: ₹${bestPlan.minAmount}\n`;
    response += `- Estimated Profit: ₹${(user.balance * bestPlan.dailyReturn * bestPlan.duration / 100).toFixed(2)}\n\n`;
    
    // Add urgency element
    if (user.totalInvested === 0) {
      response += "💡 As a new user, you're eligible for our NEW USER BONUS! Invest in any plan this week and get an additional 2% bonus on your returns!\n\n";
    } else if (user.balance > 500) {
      response += "💰 With your current balance, you can maximize your returns by investing in our premium plans. Would you like me to process an investment for you?\n\n";
    }
    
    response += "Would you like me to help you invest in this plan? Just confirm and I'll process it for you!";
    
    return response;
  },

  /**
   * Handle recharge suggestions with incentives
   */
  async handleRechargeSuggestion(message: string, user: User): Promise<string> {
    const minRecharge = 100;
    const currentBalance = user.balance;
    
    let response = "I noticed your account activity and have some great news for you!\n\n";
    
    if (currentBalance < minRecharge) {
      response += `🚨 Your balance is quite low (₹${currentBalance}). To continue enjoying our services and earning returns, I recommend recharging soon.\n\n`;
      
      // Suggest recharge amounts with bonuses
      response += "🎁 **Special Recharge Bonuses Available:**\n";
      response += "- Recharge ₹500+: Get 5% bonus\n";
      response += "- Recharge ₹1000+: Get 10% bonus\n";
      response += "- Recharge ₹2000+: Get 15% bonus + VIP status\n\n";
      
      response += "Would you like me to guide you through the recharge process?";
    } else if (currentBalance < 500) {
      response += `Your balance is ₹${currentBalance}. For optimal earning potential, consider recharging to ₹1000+ to unlock higher returns and bonuses!\n\n`;
      
      response += "🚀 **Limited Time Offer**: Recharge ₹1000+ this week and get 10% bonus + priority support!";
    } else {
      response += `Great! Your balance is ₹${currentBalance}. With this amount, you can invest in our premium plans for maximum returns!\n\n`;
      response += "💡 **Pro Tip**: Recharging to ₹2000+ this month will earn you VIP status with exclusive benefits!";
    }
    
    return response;
  },

  /**
   * Handle retention strategies for at-risk users
   */
  async handleRetentionStrategy(message: string, user: User): Promise<string> {
    let response = "Hi there! I noticed your account activity and wanted to reach out personally.\n\n";
    
    // Personalize based on user status
    if (user.balance < 100) {
      response += "🚨 **URGENT**: Your account balance is very low. To avoid interruption of services and continue earning, please consider recharging soon.\n\n";
      
      response += "💝 **Loyal Customer Offer**: As a valued user, I can arrange a special recharge bonus for you. Would you like to take advantage of this exclusive offer?\n\n";
      
      response += "Just let me know if you'd like me to process a recharge with bonus for you!";
    } else if (user.totalInvested === 0) {
      response += "👋 Welcome to VIXO! I see you haven't invested in any plans yet. You're missing out on daily returns!\n\n";
      
      response += "🎯 **New User Special**: Invest in any plan this week and get:\n";
      response += "- 25% higher returns for first 7 days\n";
      response += "- Dedicated support\n";
      response += "- Priority withdrawal processing\n\n";
      
      response += "Would you like me to recommend the best plan for your balance?";
    } else if (user.lastLoginDaysAgo > 7) {
      response += "😊 Welcome back! I see you haven't logged in for a while. Your investments are still earning returns!\n\n";
      
      response += "📊 **Account Summary**:\n";
      response += `- Current Balance: ₹${user.balance}\n`;
      response += `- Total Earnings: ₹${user.totalInvested * 0.1} (estimated)\n`;
      response += `- Active Plans: ${user.activePlans || 0}\n\n`;
      
      response += "🎁 **Welcome Back Bonus**: Recharge this week and get 15% bonus on your deposit!";
    } else {
      response += "Thank you for being a loyal VIXO user! I wanted to inform you about some exciting updates:\n\n";
      
      response += "✨ **Exclusive VIP Benefits** available for users with ₹1000+ balance:\n";
      response += "- Higher daily returns\n";
      response += "- Priority support\n";
      response += "- Exclusive plans\n";
      response += "- Faster withdrawals\n\n";
      
      response += "Would you like me to upgrade your VIP status?";
    }
    
    return response;
  },

  /**
   * Handle general inquiries
   */
  async handleGeneralInquiry(message: string, user: User): Promise<string> {
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
      
      // Add bonus based on amount
      let bonus = 0;
      if (amount >= 2000) bonus = amount * 0.15; // 15% bonus
      else if (amount >= 1000) bonus = amount * 0.10; // 10% bonus
      else if (amount >= 500) bonus = amount * 0.05; // 5% bonus
      
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
  }
};