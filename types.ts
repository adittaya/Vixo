
export interface Product {
  id: number;
  name: string;
  price: number;
  dailyIncome: number;
  duration: number;
  totalReturn: number;
  profit: number;
  image: string;
  category: 'leasing' | 'high_tech';
  tag?: 'Popular' | 'Hot' | 'Limited';
  totalSlots?: number;
  slotsTaken?: number;
  userLimit?: number;
  systemStatus?: 'live' | 'soon' | 'hidden';
}

export interface User {
  id: string;
  name: string;
  username: string;
  mobile: string;
  password?: string;
  withdrawalPassword?: string;
  balance: number;
  withdrawableBalance: number;
  totalInvested: number;
  totalWithdrawn: number;
  referralCode: string;
  referredBy?: string;
  registrationDate: string;
  lastWithdrawalDate?: string;
  vipLevel: number;
  isBlogger?: boolean;
  status: 'active' | 'banned' | 'frozen';
  bankName?: string;
  ifsc?: string;
  accountNumber?: string;
  securityCheckRequired?: boolean;
  mustChangePassword?: boolean;
  mustChangeWithdrawalPin?: boolean;
  lastSecurityActionDate?: string;
  referralEarnings?: number;
  lastProfitUpdate?: number;
  role?: 'user' | 'customer_care' | 'admin';
  isCustomerCareAgent?: boolean;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userPhone: string;
  title: string;
  image: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface SupportMessage {
  id: string;
  userId: string;
  sender: 'user' | 'admin';
  text: string;
  image?: string;
  timestamp: number;
}

export interface Purchase {
  id: string;
  userId: string;
  productId: number;
  productName: string;
  purchaseDate: string;
  dailyIncome: number;
  daysRemaining: number;
  totalDays: number;
  status: 'active' | 'completed' | 'cancelled';
  fundedByTxnId?: string; // Tracks which specific recharge funded this node
}

export type TransactionType = 'recharge' | 'withdraw' | 'commission' | 'profit' | 'purchase';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  date: string;
  amount: number;
  utr?: string;
  method?: 'bank' | 'upi';
  level?: number;
  timestamp: number;
  details?: string;
  sourcePurchaseId?: string; // Links income/commissions to a specific node instance
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  adminId: string;
}

export interface UserProduct {
  id: string;
  userId: string;
  productId: number;
  purchaseDate: number;
  daysLeft: number;
  status: 'ACTIVE' | 'EXPIRED';
  lastCollectionDate: number;
}

export interface AppState {
  users: User[];
  currentUser: User | null;
  userProducts: UserProduct[];
  transactions: Transaction[];
  lastWithdrawalTime: Record<string, number>;
}

export interface AdminSettings {
  popupEnabled: boolean;
  popupSubject: string;
  popupText: string;
  popupAwardLine1: string;
  popupAwardLine2: string;
  popupMinRecharge: string;
  popupMinWithdrawal: string;
  popupReferralL1: string;
  popupReferralL2: string;
  popupReferralL3: string;
  popupChannelBtnText: string;
  commissionL1: number;
  commissionL2: number;
  commissionL3: number;
  incomeFrozen: boolean;
  withdrawalFrozen: boolean;
  purchasesLocked: boolean;
  maintenanceMode: boolean;
  automaticIncomeEnabled: boolean;
  automaticIncomeTime: string;
  lastIncomeRun: string;
  preApprovedEnabled: boolean; // Auto-Credit System Toggle
  customProducts: Product[];
  rechargeUpiId: string;
  rechargeQrCode: string;
  branding: {
    logo: string;
    hero: string;
    primaryColor: string;
    secondaryColor: string;
    siteName: string;
    supportUrl: string;
    telegramUrl: string;
    popupBtnLink: string;
  };
  ui: {
    buttonRadius: string;
    cardShadow: boolean;
    animations: boolean;
  };
}

// Fixed: Added missing types for AI components as required by component imports
export enum View {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  VOICE = 'VOICE',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// Fixed: Added Message interface for SearchGen.tsx compatibility
export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: { uri: string; title: string }[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}

// Added ImageResult for ImageView.tsx
export interface ImageResult {
  id: string;
  url: string;
  prompt: string;
}

// Added VideoResult for VideoView.tsx
export interface VideoResult {
  id: string;
  url: string;
  prompt: string;
}
