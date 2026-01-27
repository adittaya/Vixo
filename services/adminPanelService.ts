/**
 * Admin Panel Service for Customer Care AI
 * Provides actual admin functionality that the AI can use to solve user problems
 */

import { User, Transaction, Purchase } from '../types';
import { getStore, saveStore } from '../store';

interface AdminActionResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const adminPanelService = {
  /**
   * Reset user password (simulated)
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<AdminActionResponse> {
    try {
      const store = getStore();
      const userIndex = store.users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }
      
      // In a real system, this would hash the password
      store.users[userIndex].password = newPassword; // This is just simulated
      
      await saveStore(store);
      
      return { 
        success: true, 
        message: 'Password has been reset successfully' 
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, message: 'Failed to reset password' };
    }
  },

  /**
   * Update user account status
   */
  async updateUserStatus(userId: string, newStatus: string): Promise<AdminActionResponse> {
    try {
      const store = getStore();
      const userIndex = store.users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }
      
      const validStatuses = ['active', 'frozen', 'banned', 'inactive'];
      if (!validStatuses.includes(newStatus)) {
        return { success: false, message: 'Invalid status' };
      }
      
      store.users[userIndex].status = newStatus;
      await saveStore(store);
      
      return { 
        success: true, 
        message: `Account status updated to ${newStatus}` 
      };
    } catch (error) {
      console.error('Error updating user status:', error);
      return { success: false, message: 'Failed to update account status' };
    }
  },

  /**
   * Process withdrawal request
   */
  async processWithdrawal(transactionId: string, action: 'approve' | 'reject'): Promise<AdminActionResponse> {
    try {
      const store = getStore();
      const transactionIndex = store.transactions.findIndex(t => t.id === transactionId);
      
      if (transactionIndex === -1) {
        return { success: false, message: 'Transaction not found' };
      }
      
      const transaction = store.transactions[transactionIndex];
      if (transaction.type !== 'withdraw') {
        return { success: false, message: 'Not a withdrawal transaction' };
      }
      
      // Update transaction status
      store.transactions[transactionIndex].status = action === 'approve' ? 'approved' : 'rejected';
      
      if (action === 'approve') {
        // Deduct from withdrawable balance when approved
        const userIndex = store.users.findIndex(u => u.id === transaction.userId);
        if (userIndex !== -1) {
          store.users[userIndex].withdrawableBalance -= transaction.amount;
          store.users[userIndex].totalWithdrawn += transaction.amount;
        }
      }
      
      await saveStore(store);
      
      return { 
        success: true, 
        message: `Withdrawal request ${action === 'approve' ? 'approved' : 'rejected'} successfully` 
      };
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      return { success: false, message: 'Failed to process withdrawal' };
    }
  },

  /**
   * Update user balance
   */
  async updateUserBalance(userId: string, amount: number, type: 'credit' | 'debit'): Promise<AdminActionResponse> {
    try {
      const store = getStore();
      const userIndex = store.users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }
      
      if (type === 'credit') {
        store.users[userIndex].balance += amount;
        store.users[userIndex].totalInvested += amount;
      } else {
        if (store.users[userIndex].balance < amount) {
          return { success: false, message: 'Insufficient balance' };
        }
        store.users[userIndex].balance -= amount;
      }
      
      await saveStore(store);
      
      return { 
        success: true, 
        message: `Balance ${type === 'credit' ? 'credited' : 'debited'} successfully. New balance: ₹${store.users[userIndex].balance}` 
      };
    } catch (error) {
      console.error('Error updating user balance:', error);
      return { success: false, message: 'Failed to update balance' };
    }
  },

  /**
   * Update VIP level
   */
  async updateVIPLevel(userId: string, newLevel: number): Promise<AdminActionResponse> {
    try {
      const store = getStore();
      const userIndex = store.users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }
      
      if (newLevel < 0 || newLevel > 10) {
        return { success: false, message: 'Invalid VIP level' };
      }
      
      store.users[userIndex].vipLevel = newLevel;
      await saveStore(store);
      
      return { 
        success: true, 
        message: `VIP level updated to ${newLevel} successfully` 
      };
    } catch (error) {
      console.error('Error updating VIP level:', error);
      return { success: false, message: 'Failed to update VIP level' };
    }
  },

  /**
   * Process referral bonus
   */
  async processReferralBonus(referrerId: string, bonusAmount: number): Promise<AdminActionResponse> {
    try {
      const store = getStore();
      const userIndex = store.users.findIndex(u => u.id === referrerId);
      
      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }
      
      // Credit the referral bonus
      store.users[userIndex].balance += bonusAmount;
      store.users[userIndex].referralEarnings += bonusAmount;
      
      await saveStore(store);
      
      return { 
        success: true, 
        message: `Referral bonus of ₹${bonusAmount} credited successfully. New balance: ₹${store.users[userIndex].balance}` 
      };
    } catch (error) {
      console.error('Error processing referral bonus:', error);
      return { success: false, message: 'Failed to process referral bonus' };
    }
  },

  /**
   * Update investment/plan status
   */
  async updateInvestmentStatus(purchaseId: string, newStatus: string): Promise<AdminActionResponse> {
    try {
      const store = getStore();
      const purchaseIndex = store.purchases?.findIndex(p => p.id === purchaseId) ?? -1;
      
      if (purchaseIndex === -1) {
        return { success: false, message: 'Investment not found' };
      }
      
      const validStatuses = ['active', 'inactive', 'completed', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        return { success: false, message: 'Invalid status' };
      }
      
      store.purchases![purchaseIndex].status = newStatus;
      await saveStore(store);
      
      return { 
        success: true, 
        message: `Investment status updated to ${newStatus} successfully` 
      };
    } catch (error) {
      console.error('Error updating investment status:', error);
      return { success: false, message: 'Failed to update investment status' };
    }
  },

  /**
   * Get user details
   */
  async getUserDetails(userId: string): Promise<AdminActionResponse> {
    try {
      const store = getStore();
      const user = store.users.find(u => u.id === userId);
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      return { 
        success: true, 
        message: 'User details retrieved successfully',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          balance: user.balance,
          withdrawableBalance: user.withdrawableBalance,
          totalInvested: user.totalInvested,
          totalWithdrawn: user.totalWithdrawn,
          vipLevel: user.vipLevel,
          status: user.status,
          registrationDate: user.registrationDate
        }
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      return { success: false, message: 'Failed to retrieve user details' };
    }
  },

  /**
   * Get transaction history for user
   */
  async getUserTransactions(userId: string): Promise<AdminActionResponse> {
    try {
      const store = getStore();
      const transactions = store.transactions.filter(t => t.userId === userId);
      
      return { 
        success: true, 
        message: 'Transaction history retrieved successfully',
        data: transactions
      };
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return { success: false, message: 'Failed to retrieve transaction history' };
    }
  }
};