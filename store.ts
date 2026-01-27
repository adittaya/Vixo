
import { User, Transaction, Purchase, AdminSettings, AuditLog, CommunityPost, SupportMessage } from './types';
import { PRODUCTS, LOGO_IMAGE, HERO_IMAGE, UPI_ID, QR_CODE_IMAGE } from './constants';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'vixo_v1_active_user_id',
  LOCAL_STATE_BACKUP: 'vixo_v1_state_backup'
};

const PLATFORM_ROW_ID = "VIXO_PLATFORM_STATE";

let cloudState: {
  users: User[],
  purchases: Purchase[],
  transactions: Transaction[],
  admin: AdminSettings,
  logs: AuditLog[],
  communityPosts: CommunityPost[],
  supportMessages: SupportMessage[]
} | null = null;

let isCloudAvailable = true;

const defaultAdmin: AdminSettings = {
  popupEnabled: true,
  popupSubject: 'Announcement',
  popupText: 'Welcome to join us!',
  popupAwardLine1: 'Purchase 2 Plan C packages bonus: 300rs',
  popupAwardLine2: 'Purchase 4 Plan C packages bonus: 600rs',
  popupMinRecharge: '680RS',
  popupMinWithdrawal: '130RS',
  popupReferralL1: '28%',
  popupReferralL2: '1%',
  popupReferralL3: '1%',
  popupChannelBtnText: 'Join Channel',
  commissionL1: 25,
  commissionL2: 3,
  commissionL3: 2,
  incomeFrozen: false,
  withdrawalFrozen: false,
  purchasesLocked: false,
  maintenanceMode: false,
  automaticIncomeEnabled: true,
  automaticIncomeTime: "00:00",
  lastIncomeRun: "",
  preApprovedEnabled: false,
  aiAutomationEnabled: true, // AI Automation enabled by default
  customProducts: PRODUCTS,
  rechargeUpiId: UPI_ID,
  rechargeQrCode: QR_CODE_IMAGE,
  branding: {
    logo: LOGO_IMAGE,
    hero: HERO_IMAGE,
    primaryColor: '#00D094',
    secondaryColor: '#FFFFFF',
    siteName: 'VIXO',
    supportUrl: '/support',
    telegramUrl: 'https://t.me/',
    popupBtnLink: 'https://t.me/'
  },
  ui: {
    buttonRadius: '16px',
    cardShadow: true,
    animations: true
  }
};

const loadLocalBackup = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_STATE_BACKUP);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Helper function to create a timeout promise
function timeout(ms: number) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms));
}

export const initCloudStore = async () => {
  try {
    // Create a race between the Supabase call and a timeout
    const supabaseCall = supabase
      .from('platform_data')
      .select('state')
      .eq('id', PLATFORM_ROW_ID)
      .maybeSingle();

    // Race the Supabase call with a 10-second timeout
    const result = await Promise.race([
      supabaseCall,
      timeout(10000)
    ]) as any;

    // If we reach here, the timeout didn't happen
    const { data, error } = result;

    if (error) {
      console.warn("Supabase fetch error:", error);
      isCloudAvailable = false;
      cloudState = loadLocalBackup() || { users: [], purchases: [], transactions: [], admin: defaultAdmin, logs: [], communityPosts: [], supportMessages: [] };
      return true;
    }

    if (data && data.state) {
      cloudState = data.state;
      if (!cloudState!.communityPosts) cloudState!.communityPosts = [];
      if (!cloudState!.supportMessages) cloudState!.supportMessages = [];
      localStorage.setItem(STORAGE_KEYS.LOCAL_STATE_BACKUP, JSON.stringify(cloudState));
    } else {
      cloudState = loadLocalBackup() || { users: [], purchases: [], transactions: [], admin: defaultAdmin, logs: [], communityPosts: [], supportMessages: [] };
      if (isCloudAvailable) {
        try {
          await supabase.from('platform_data').upsert({ id: PLATFORM_ROW_ID, state: cloudState });
        } catch (upsertError) {
          console.warn("Failed to upsert platform data:", upsertError);
          isCloudAvailable = false;
        }
      }
    }
    window.dispatchEvent(new Event('store-update'));
    return true;
  } catch (err) {
    console.error("Critical error in initCloudStore:", err);
    // If there's a timeout or other error, use local backup
    isCloudAvailable = false;
    cloudState = loadLocalBackup() || { users: [], purchases: [], transactions: [], admin: defaultAdmin, logs: [], communityPosts: [], supportMessages: [] };
    window.dispatchEvent(new Event('store-update'));
    return true;
  }
};

export const getStore = () => {
  if (!cloudState) {
    const backup = loadLocalBackup();
    return backup || { users: [], currentUser: null, purchases: [], transactions: [], admin: defaultAdmin, logs: [], communityPosts: [], supportMessages: [] };
  }
  const currentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
  const currentUser = cloudState.users.find(u => u.id === currentUserId) || null;
  return { ...cloudState, currentUser };
};

export const saveStore = async (data: Partial<{ users: User[], currentUser: User | null, purchases: Purchase[], transactions: Transaction[], admin: AdminSettings, logs: AuditLog[], communityPosts: CommunityPost[], supportMessages: SupportMessage[] }>) => {
  if (!cloudState) return;

  if (data.users) cloudState.users = data.users;
  if (data.purchases) cloudState.purchases = data.purchases;
  if (data.transactions) cloudState.transactions = data.transactions;
  if (data.admin) cloudState.admin = data.admin;
  if (data.logs) cloudState.logs = data.logs;
  if (data.communityPosts) cloudState.communityPosts = data.communityPosts;
  if (data.supportMessages) cloudState.supportMessages = data.supportMessages;

  if (data.currentUser !== undefined) {
    if (data.currentUser) localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, data.currentUser.id);
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }

  localStorage.setItem(STORAGE_KEYS.LOCAL_STATE_BACKUP, JSON.stringify(cloudState));

  if (isCloudAvailable) {
    const { error } = await supabase
      .from('platform_data')
      .upsert({ id: PLATFORM_ROW_ID, state: cloudState });
    
    if (error) {
      console.warn("Cloud save failed, data kept locally.");
      if (error.code === '42P01') isCloudAvailable = false;
    }
  }

  window.dispatchEvent(new Event('store-update'));
};

/**
 * Audit Tool: Calculate the impact of reversing a transaction
 */
export const getReversalImpact = (rechargeTxnId: string) => {
  const store = getStore();
  const recharge = store.transactions.find(t => t.id === rechargeTxnId);
  if (!recharge) return null;

  const linkedPurchases = store.purchases.filter(p => p.fundedByTxnId === rechargeTxnId);
  const purchaseIds = linkedPurchases.map(p => p.id);
  
  const linkedProfits = store.transactions.filter(t => t.type === 'profit' && purchaseIds.includes(t.sourcePurchaseId || ''));
  const linkedComms = store.transactions.filter(t => t.type === 'commission' && purchaseIds.includes(t.sourcePurchaseId || ''));

  const totalDeduction = recharge.amount + 
                        linkedProfits.reduce((s, t) => s + t.amount, 0) + 
                        linkedComms.reduce((s, t) => s + t.amount, 0);

  return {
    rechargeAmount: recharge.amount,
    nodesCount: linkedPurchases.length,
    profitsTotal: linkedProfits.reduce((s, t) => s + t.amount, 0),
    commsTotal: linkedComms.reduce((s, t) => s + t.amount, 0),
    totalDeduction
  };
};

/**
 * REVERSAL LOGIC: Pre-Approved Recharge Hard Reversal
 * Triggered when admin rejects an already approved recharge.
 */
export const performHardReversal = async (rechargeTxnId: string, adminName: string) => {
  const store = getStore();
  const recharge = store.transactions.find(t => t.id === rechargeTxnId);
  if (!recharge || recharge.type !== 'recharge') return;

  let nextUsers = [...store.users];
  let nextPurchases = [...store.purchases];
  let nextTransactions = [...store.transactions];

  const targetUserIdx = nextUsers.findIndex(u => u.id === recharge.userId);
  if (targetUserIdx === -1) return;
  const user = nextUsers[targetUserIdx];

  // 1. Deduct original recharge amount from balance
  user.balance -= recharge.amount;

  // 2. Identify and cancel nodes purchased using these specific funds
  const linkedPurchases = nextPurchases.filter(p => p.fundedByTxnId === rechargeTxnId && p.status === 'active');
  linkedPurchases.forEach(p => {
    p.status = 'cancelled';
    
    // 3. Reverse daily yield profits generated by these nodes
    const linkedProfits = nextTransactions.filter(t => t.userId === user.id && t.type === 'profit' && t.sourcePurchaseId === p.id);
    linkedProfits.forEach(lp => {
      user.withdrawableBalance -= lp.amount;
      lp.status = 'rejected';
      lp.details = 'Hard Reversal: Plan Cancelled';
    });

    // 4. Reverse referral commissions sent to uplines (L1, L2, L3)
    const linkedComms = nextTransactions.filter(t => t.type === 'commission' && t.sourcePurchaseId === p.id);
    linkedComms.forEach(lc => {
      const uplineIdx = nextUsers.findIndex(u => u.id === lc.userId);
      if (uplineIdx !== -1) {
        nextUsers[uplineIdx].withdrawableBalance -= lc.amount;
      }
      lc.status = 'rejected';
      lc.details = `Hard Reversal: Downline (${user.mobile}) fake recharge`;
    });
  });

  // 5. Update recharge transaction status
  const rIdx = nextTransactions.findIndex(t => t.id === rechargeTxnId);
  if (rIdx !== -1) {
    nextTransactions[rIdx].status = 'rejected';
    nextTransactions[rIdx].details = 'Fraudulent UTR: Post-Approval Reversal';
  }

  // 6. Security Check: If the reversal results in negative balance, freeze the account for review
  if (user.balance < 0 || user.withdrawableBalance < 0) {
    user.status = 'frozen';
  }

  // 7. Log the audit event
  const log: AuditLog = {
    id: `audit-${Date.now()}`,
    action: 'HARD_REVERSAL',
    details: `Admin ${adminName} reversed ₹${recharge.amount} for user ${user.mobile}. Plans/Yields/Comms cancelled.`,
    timestamp: new Date().toISOString(),
    adminId: adminName
  };

  await saveStore({ 
    users: nextUsers, 
    purchases: nextPurchases, 
    transactions: nextTransactions,
    logs: [log, ...store.logs].slice(0, 100)
  });
};

export interface DistributionStats {
  success: boolean;
  totalDistributed: number;
  usersAffected: number;
  plansProcessed: number;
}

export const runIncomeEngine = async (): Promise<DistributionStats> => {
  const store = getStore();
  const { users, purchases, transactions, admin } = store;
  if (admin.incomeFrozen) return { success: false, totalDistributed: 0, usersAffected: 0, plansProcessed: 0 };

  let nextUsers = JSON.parse(JSON.stringify(users)) as User[];
  let nextPurchases = JSON.parse(JSON.stringify(purchases)) as Purchase[];
  let nextTransactions = [...transactions];
  let stats = { totalDistributed: 0, userIds: new Set<string>(), plansCount: 0 };
  let hasChanged = false;

  nextPurchases.forEach((p) => {
    if (p.status === 'active' && p.daysRemaining > 0) {
      const uIdx = nextUsers.findIndex((u) => u.id === p.userId);
      if (uIdx !== -1 && nextUsers[uIdx].status === 'active') {
        nextUsers[uIdx].withdrawableBalance = (nextUsers[uIdx].withdrawableBalance || 0) + p.dailyIncome;
        nextTransactions.push({
           id: `payout-${p.id}-${Date.now()}`,
           userId: p.userId,
           type: 'profit',
           amount: p.dailyIncome,
           status: 'approved',
           date: new Date().toISOString(),
           timestamp: Date.now(),
           sourcePurchaseId: p.id // Tag profit for reversal tracing
        });
        p.daysRemaining -= 1;
        if (p.daysRemaining <= 0) p.status = 'completed';
        stats.totalDistributed += p.dailyIncome;
        stats.userIds.add(p.userId);
        stats.plansCount++;
        hasChanged = true;
      }
    }
  });

  if (hasChanged) await saveStore({ users: nextUsers, purchases: nextPurchases, transactions: nextTransactions });
  return { success: hasChanged, totalDistributed: stats.totalDistributed, usersAffected: stats.userIds.size, plansProcessed: stats.plansCount };
};

export const manualProcessIncome = async (): Promise<DistributionStats> => {
  const stats = await runIncomeEngine();
  const todayDateStr = new Date().toLocaleDateString('en-CA');
  const store = getStore();
  await saveStore({ admin: { ...store.admin, lastIncomeRun: `${todayDateStr} ${new Date().toLocaleTimeString()}` } });
  const log: AuditLog = {
    id: `log-${Date.now()}`,
    action: 'MANUAL_INCOME',
    details: `Distributed ₹${stats.totalDistributed} to ${stats.usersAffected} users.`,
    timestamp: new Date().toISOString(),
    adminId: 'SYSTEM'
  };
  await saveStore({ logs: [log, ...store.logs].slice(0, 100) });
  return stats;
};

export const processDailyIncome = async () => {
  const store = getStore();
  const { admin } = store;
  if (!admin || admin.incomeFrozen || !admin.automaticIncomeEnabled) return;
  const todayDateStr = new Date().toLocaleDateString('en-CA');
  if (admin.lastIncomeRun && admin.lastIncomeRun.startsWith(todayDateStr)) return;
  const [targetH, targetM] = (admin.automaticIncomeTime || "00:00").split(':').map(Number);
  const now = new Date();
  if (now.getHours() > targetH || (now.getHours() === targetH && now.getMinutes() >= targetM)) {
    await runIncomeEngine();
    const freshAdmin = getStore().admin;
    await saveStore({ admin: { ...freshAdmin, lastIncomeRun: `${todayDateStr} ${new Date().toLocaleTimeString()}` } });
  }
};
