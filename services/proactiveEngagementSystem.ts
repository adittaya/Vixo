/**
 * Proactive User Engagement System
 * Identifies and reaches out to inactive users to encourage recharges
 */

import { getStore, saveStore } from '../store';
import { User } from '../types';

export const proactiveEngagementSystem = {
  /**
   * Identify inactive users and send recharge reminders
   */
  async identifyInactiveUsers(): Promise<User[]> {
    const store = getStore();
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
    
    // Find users who haven't recharged in 7 days and have low balance
    const inactiveUsers = store.users.filter(user => {
      // Check if user has low balance and hasn't recharged recently
      const lastRecharge = store.transactions
        .filter(t => t.userId === user.id && t.type === 'recharge')
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      const hasLowBalance = user.balance < 200;
      const noRecentRecharge = !lastRecharge || lastRecharge.timestamp < sevenDaysAgo;
      const isActive = user.status === 'active';
      
      return hasLowBalance && noRecentRecharge && isActive;
    });
    
    return inactiveUsers;
  },

  /**
   * Send proactive recharge notifications to inactive users
   */
  async sendRechargeNotifications(): Promise<void> {
    const inactiveUsers = await this.identifyInactiveUsers();
    
    for (const user of inactiveUsers) {
      // Create a proactive message encouraging recharge
      const message = this.createProactiveRechargeMessage(user);
      
      // Log the message to the user's message history
      await this.logProactiveMessage(user.id, message);
      
      console.log(`Proactive recharge message sent to user ${user.name} (${user.id})`);
    }
  },

  /**
   * Create a personalized recharge message for a user
   */
  createProactiveRechargeMessage(user: User): string {
    const urgentThreshold = 50; // Balance below which it's urgent
    const lowThreshold = 200;   // Balance below which it's low
    
    let message = "";
    
    if (user.balance <= urgentThreshold) {
      message = `🚨 **URGENT ACTION REQUIRED** 🚨\n\n`;
      message += `Dear ${user.name}, your account balance is critically low (₹${user.balance}). \n\n`;
      message += `⚠️ Your account will be suspended in 24 hours if not recharged.\n\n`;
      message += `💥 **EMERGENCY RECHARGE OFFER** 💥\n`;
      message += `- Recharge ₹500+: Get ₹100 bonus (20%)\n`;
      message += `- Recharge ₹1000+: Get ₹300 bonus (30%) + Premium VIP\n`;
      message += `- Recharge ₹2000+: Get ₹800 bonus (40%) + Lifetime Premium Access\n\n`;
      message += `⚡ **OFFER EXPIRES IN 6 HOURS** ⚡\n`;
      message += `Please recharge immediately to avoid service interruption.`;
    } else if (user.balance <= lowThreshold) {
      message = `🔔 **RECHARGE REMINDER** 🔔\n\n`;
      message += `Hi ${user.name}, noticed your balance is getting low (₹${user.balance}).\n\n`;
      message += `🔥 **FLASH RECHARGE BONUSES** 🔥\n`;
      message += `- Recharge ₹300+: Get 15% bonus\n`;
      message += `- Recharge ₹800+: Get 25% bonus + 7-day premium access\n`;
      message += `- Recharge ₹1500+: Get 35% bonus + Premium VIP status\n\n`;
      message += `⏰ **LIMITED TIME: Offer expires in 12 hours!**\n`;
      message += `Recharge now to continue earning daily returns!`;
    } else {
      message = `💡 **MAXIMIZE YOUR EARNINGS** 💡\n\n`;
      message += `Hello ${user.name}, with your current balance of ₹${user.balance}, you can earn even more!\n\n`;
      message += `🎯 **BEST OPPORTUNITY THIS WEEK** 🎯\n`;
      message += `Recharge ₹1000+ and get:\n`;
      message += `- 30% bonus on your recharge\n`;
      message += `- Access to premium 2.8% daily return plans\n`;
      message += `- Priority withdrawal processing\n`;
      message += `- Dedicated support\n\n`;
      message += `⏰ **Hurry: This exclusive offer ends in 24 hours!**`;
    }
    
    return message;
  },

  /**
   * Log proactive message to user's history
   */
  async logProactiveMessage(userId: string, message: string): Promise<void> {
    const store = getStore();
    
    // Create a support message from the system
    const proactiveMessage = {
      id: `proactive_${Date.now()}_${userId}`,
      userId: userId,
      sender: 'system',
      text: message,
      timestamp: Date.now(),
      isProactive: true
    };
    
    if (!store.supportMessages) store.supportMessages = [];
    store.supportMessages.push(proactiveMessage);
    
    await saveStore(store);
  },

  /**
   * Schedule periodic checks for inactive users
   */
  schedulePeriodicChecks(): void {
    // Check every 6 hours
    setInterval(async () => {
      console.log('Running proactive engagement check...');
      await this.sendRechargeNotifications();
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
    
    console.log('Proactive engagement system scheduled to run every 6 hours');
  }
};