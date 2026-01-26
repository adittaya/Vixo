
import React from 'react';
// Added ShieldCheck and Zap for trust badges
import { ShoppingCart, Timer, TrendingUp, Info, ShieldCheck, Zap } from 'lucide-react';

const products = [
  {
    id: 'p1',
    name: 'Industrial Carbonator X-1',
    description: 'High-speed CO2 injection unit for premium soft drinks. Reliable 24/7 output.',
    price: 1500,
    dailyYield: 60,
    durationDays: 45,
    remaining: 12,
    image: 'https://picsum.photos/seed/p1/400/300'
  },
  {
    id: 'p2',
    name: 'Auto-Filter Station 400',
    description: 'Triple-stage nano filtration system for luxury bottled water production.',
    price: 5000,
    dailyYield: 215,
    durationDays: 60,
    remaining: 8,
    image: 'https://picsum.photos/seed/p2/400/300'
  },
  {
    id: 'p3',
    name: 'Batch Mixer (Heavy Duty)',
    description: 'Commercial grade mixer for concentrate blending with smart sensors.',
    price: 12000,
    dailyYield: 560,
    durationDays: 90,
    remaining: 3,
    image: 'https://picsum.photos/seed/p3/400/300'
  },
  {
    id: 'p4',
    name: 'Rotary Bottling Line v2',
    description: 'All-in-one rinse, fill, and cap machine for massive production capacity.',
    price: 35000,
    dailyYield: 1850,
    durationDays: 120,
    remaining: 1,
    image: 'https://picsum.photos/seed/p4/400/300'
  }
];

const MarketView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Leasing Marketplace</h1>
          <p className="text-slate-400">Invest in machinery. Secure passive industrial yields.</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Bottling', 'Filtration', 'Blending'].map((cat) => (
            <button key={cat} className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-medium hover:border-indigo-500 transition-colors">
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <div key={product.id} className="glass-effect rounded-3xl overflow-hidden flex flex-col hover:border-indigo-500/50 transition-all group">
            <div className="relative h-48">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-amber-400 uppercase tracking-widest border border-amber-500/30">
                Only {product.remaining} Left
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
              <p className="text-slate-400 text-sm mb-6 line-clamp-2">{product.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900/50 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Price</p>
                  <p className="text-lg font-bold text-white">₹{product.price.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl">
                  <p className="text-[10px] text-indigo-400 uppercase font-bold mb-1">Daily Yield</p>
                  <p className="text-lg font-bold text-indigo-400">₹{product.dailyYield}</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Timer className="w-4 h-4 text-slate-500" />
                  <span>Cycle Duration: <strong>{product.durationDays} Days</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  <span>Total Income: <strong>₹{(product.dailyYield * product.durationDays).toLocaleString()}</strong></span>
                </div>
              </div>

              <button className="w-full mt-auto bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95">
                <ShoppingCart className="w-5 h-5" />
                Lease Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-slate-900">
        {[
          { title: 'Asset Backed', desc: 'Real industrial machinery insurance.', icon: ShieldCheck },
          { title: 'Instant Settlement', desc: 'Yields credited every 24 hours.', icon: Zap },
          { title: 'Liquidity Control', desc: 'Fixed term contracts with yield lock.', icon: TrendingUp }
        ].map((badge, i) => (
          <div key={i} className="flex items-start gap-4 p-4">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <badge.icon className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h4 className="font-bold text-white">{badge.title}</h4>
              <p className="text-sm text-slate-500">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketView;
