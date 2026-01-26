
import { Product } from './types';

// Encoded new VIXO logo (Stylized V Lightning Arrow)
export const LOGO_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300D094;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2300a878;stop-opacity:1' /%3E%3C/linearGradient%3E%3Cfilter id='s' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeGaussianBlur in='SourceAlpha' stdDeviation='10' /%3E%3CfeOffset dx='0' dy='5' result='offsetblur' /%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.2' /%3E%3C/feComponentTransfer%3E%3CfeMerge%3E%3CfeMergeNode /%3E%3CfeMergeNode in='SourceGraphic' /%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M80 180l60 180 80-140 60 120 150-240-50 20-80 140-60-120-100 160-20-80z' fill='url(%23g)' filter='url(%23s)' /%3E%3C/svg%3E";

export const HERO_IMAGE = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1470&auto=format&fit=crop";
export const PRODUCT_PLACEHOLDER = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&auto=format&fit=crop";
export const PRIME_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&auto=format&fit=crop";
export const QR_CODE_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg";
export const UPI_ID = "vixo.earn@upi";

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};

export const TRUST_BADGES = [
  { icon: '🛡️', label: 'SECURE' },
  { icon: '⚡', label: 'INSTANT' },
  { icon: '💎', label: 'PREMIUM' },
];

export const PRODUCTS: Product[] = [
  { 
    id: 1, 
    name: "VIXO Node Alpha", 
    price: 600, 
    dailyIncome: 90, 
    duration: 100, 
    totalReturn: 9000, 
    profit: 8400, 
    category: 'leasing', 
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&auto=format&fit=crop", 
    userLimit: 1, 
    systemStatus: 'live', 
    totalSlots: 500, 
    slotsTaken: 120 
  },
  { 
    id: 2, 
    name: "VIXO Node Beta", 
    price: 1500, 
    dailyIncome: 240, 
    duration: 100, 
    totalReturn: 24000, 
    profit: 22500, 
    category: 'leasing', 
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc4b?q=80&w=400&auto=format&fit=crop", 
    userLimit: 3, 
    systemStatus: 'live', 
    totalSlots: 300, 
    slotsTaken: 45 
  },
  { 
    id: 3, 
    name: "VIXO Cloud Core", 
    price: 3500, 
    dailyIncome: 620, 
    duration: 100, 
    totalReturn: 62000, 
    profit: 58500, 
    category: 'high_tech', 
    image: "https://images.unsplash.com/photo-1597733336794-12d05021d510?q=80&w=400&auto=format&fit=crop", 
    userLimit: 3, 
    systemStatus: 'live', 
    totalSlots: 100, 
    slotsTaken: 88 
  },
  { 
    id: 4, 
    name: "VIXO Prime Mainframe", 
    price: 8000, 
    dailyIncome: 1550, 
    duration: 100, 
    totalReturn: 155000, 
    profit: 147000, 
    category: 'high_tech', 
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop", 
    userLimit: 3, 
    systemStatus: 'live', 
    totalSlots: 50, 
    slotsTaken: 12 
  },
  { 
    id: 5, 
    name: "VIXO Quantum Hub", 
    price: 18000, 
    dailyIncome: 3800, 
    duration: 100, 
    totalReturn: 380000, 
    profit: 362000, 
    category: 'high_tech', 
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=400&auto=format&fit=crop", 
    userLimit: 3, 
    systemStatus: 'soon', 
    totalSlots: 20, 
    slotsTaken: 0 
  },
];
