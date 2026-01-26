
import React, { useState } from 'react';
import { Product, User } from '../types';
import { ShoppingCart, Calendar, TrendingUp, Info } from 'lucide-react';

interface ProductStoreProps {
  products: Product[];
  user: User;
  setUser: (user: User) => void;
}

const ProductStore: React.FC<ProductStoreProps> = ({ products, user, setUser }) => {
  // Fix: changed buyingId state to number | null to match Product.id type
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const handlePurchase = (product: Product) => {
    // Fix: currentWallet does not exist on User, using balance instead
    if (user.balance < product.price) {
      alert("Insufficient funds in Current Wallet. Please recharge.");
      return;
    }

    if (confirm(`Confirm purchase of ${product.name} for ₹${product.price}?`)) {
      setBuyingId(product.id);
      
      // Simulate API call
      setTimeout(() => {
        // Fix: currentWallet does not exist on User, using balance instead
        setUser({
          ...user,
          balance: user.balance - product.price
        });
        setBuyingId(null);
        alert("Purchase successful! Your yield starts tomorrow.");
      }, 1000);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Industrial Store</h2>
          <p className="text-xs text-slate-400">Lease machinery for daily returns</p>
        </div>
        <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
          <span className="text-slate-400">Limit:</span>
          <span className="text-emerald-500">Unlimited</span>
        </div>
      </div>

      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="glass overflow-hidden rounded-3xl border border-slate-700/50">
            <div className="relative h-32 w-full">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover brightness-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                <h3 className="font-bold text-lg">{product.name}</h3>
                <div className="bg-blue-600 px-3 py-1 rounded-lg font-bold text-sm shadow-lg">₹{product.price}</div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <StatBox 
                  label="Daily Yield" 
                  value={`₹${product.dailyIncome}`} 
                  icon={<TrendingUp size={14} className="text-emerald-500" />} 
                />
                <StatBox 
                  label="Cycle" 
                  // Fix: lifecycleDays does not exist on Product, using duration instead
                  value={`${product.duration} Days`} 
                  icon={<Calendar size={14} className="text-blue-500" />} 
                />
                <StatBox 
                  label="ROI" 
                  // Fix: lifecycleDays does not exist on Product, using duration instead
                  value={`${((product.dailyIncome * product.duration / product.price) * 100).toFixed(0)}%`} 
                  icon={<Info size={14} className="text-amber-500" />} 
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden w-24">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      // Fix: remaining and limit do not exist on Product, calculating from totalSlots and slotsTaken
                      style={{ width: `${(((product.totalSlots || 0) - (product.slotsTaken || 0)) / (product.totalSlots || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    {/* Fix: remaining does not exist on Product */}
                    {(product.totalSlots || 0) - (product.slotsTaken || 0)} Left
                  </span>
                </div>
                
                <button 
                  onClick={() => handlePurchase(product)}
                  // Fix: buyingId is number | null, product.id is number
                  disabled={buyingId === product.id}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-xl font-bold transition-all ${
                    buyingId === product.id ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 active:scale-95'
                  }`}
                >
                  <ShoppingCart size={16} />
                  <span>{buyingId === product.id ? 'Processing...' : 'Invest'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string, value: string, icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-slate-800/50 p-2 rounded-xl text-center border border-slate-700/30">
    <div className="flex items-center justify-center space-x-1 mb-1">
      {icon}
      <span className="text-[8px] font-bold uppercase text-slate-500 tracking-wider">{label}</span>
    </div>
    <div className="text-xs font-bold text-white tracking-tight">{value}</div>
  </div>
);

export default ProductStore;
