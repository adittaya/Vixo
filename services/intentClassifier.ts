/**
 * Intent Classifier for Customer Care AI
 * Helps identify the user's specific intent to provide focused responses
 */

export interface IntentResult {
  intent: 'password_change' | 'balance_inquiry' | 'withdrawal' | 'investment' | 'general_support' | 'unknown';
  confidence: number;
  entities: Record<string, any>;
}

export class IntentClassifier {
  private passwordKeywords = [
    'password', 'change', 'forgot', 'reset', 'bhool', 'bhool gaya', 'bhool gya', 'bhool gai',
    'new password', 'update password', 'recover password', 'forgot password', 'password recovery',
    'change password', 'update', 'set new', 'create new', 'set password', 'create password'
  ];

  private balanceKeywords = [
    'balance', 'kitna', 'hai', 'kitne', 'paise', 'paisa', 'raashi', 'amount', 'current',
    'check balance', 'show balance', 'balance kitna hai', 'kitna balance', 'raashi kitni hai',
    'account balance', 'wallet balance', 'available', 'remaining', 'left', 'baaki'
  ];

  private withdrawalKeywords = [
    'withdraw', 'nikalna', 'nikale', 'withdrawal', 'paisa nikalna', 'nikasi', 'withdraw money',
    'cash out', 'take out', 'paisa bahar', 'paisa le', 'withdraw cash', 'withdraw funds'
  ];

  private investmentKeywords = [
    'investment', 'nivesh', 'buy', 'purchase', 'plan', 'node', 'package', 'invest',
    'nivesh karna', 'kharidna', 'buy plan', 'investment plan', 'earning', 'daily income',
    'return', 'profit', 'roi', 'yield', 'investment package'
  ];

  public classifyIntent(message: string): IntentResult {
    const lowerMessage = message.toLowerCase();
    const tokens = lowerMessage.split(/\s+/);
    
    // Count keyword matches for each intent
    let passwordScore = 0;
    let balanceScore = 0;
    let withdrawalScore = 0;
    let investmentScore = 0;
    
    // Check for password-related keywords
    for (const keyword of this.passwordKeywords) {
      if (lowerMessage.includes(keyword)) {
        passwordScore += 2; // Higher weight for exact matches
      }
      // Check individual tokens
      for (const token of tokens) {
        if (token.includes(keyword.split(' ')[0])) { // Match first word of multi-word phrases
          passwordScore += 1;
        }
      }
    }
    
    // Check for balance-related keywords
    for (const keyword of this.balanceKeywords) {
      if (lowerMessage.includes(keyword)) {
        balanceScore += 2;
      }
      for (const token of tokens) {
        if (token.includes(keyword.split(' ')[0])) {
          balanceScore += 1;
        }
      }
    }
    
    // Check for withdrawal-related keywords
    for (const keyword of this.withdrawalKeywords) {
      if (lowerMessage.includes(keyword)) {
        withdrawalScore += 2;
      }
      for (const token of tokens) {
        if (token.includes(keyword.split(' ')[0])) {
          withdrawalScore += 1;
        }
      }
    }
    
    // Check for investment-related keywords
    for (const keyword of this.investmentKeywords) {
      if (lowerMessage.includes(keyword)) {
        investmentScore += 2;
      }
      for (const token of tokens) {
        if (token.includes(keyword.split(' ')[0])) {
          investmentScore += 1;
        }
      }
    }
    
    // Determine the highest scoring intent
    const scores = [
      { intent: 'password_change', score: passwordScore },
      { intent: 'balance_inquiry', score: balanceScore },
      { intent: 'withdrawal', score: withdrawalScore },
      { intent: 'investment', score: investmentScore },
      { intent: 'general_support', score: 0 } // Default if no specific intent dominates
    ];
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    
    const topIntent = scores[0];
    const totalScore = passwordScore + balanceScore + withdrawalScore + investmentScore;
    
    // Calculate confidence as percentage of total relevant keywords
    const confidence = totalScore > 0 ? Math.min(1, topIntent.score / totalScore) : 0;
    
    // If no specific intent has high confidence, return general support
    if (topIntent.score === 0 || confidence < 0.3) {
      return {
        intent: 'general_support',
        confidence: 0,
        entities: {}
      };
    }
    
    return {
      intent: topIntent.intent as any,
      confidence,
      entities: this.extractEntities(message, topIntent.intent as any)
    };
  }
  
  private extractEntities(message: string, intent: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    if (intent === 'password_change') {
      // Extract any references to account details mentioned in context
      const mobileMatches = message.match(/\b\d{4}\b/g); // 4-digit sequences that might be last digits
      if (mobileMatches) {
        entities.mobileLast4 = mobileMatches;
      }
    } else if (intent === 'balance_inquiry') {
      // Extract amount references
      const amountMatches = message.match(/\b\d+[,.]?\d*\b/g);
      if (amountMatches) {
        entities.amounts = amountMatches;
      }
    }
    
    return entities;
  }
}

// Export singleton instance
export const intentClassifier = new IntentClassifier();