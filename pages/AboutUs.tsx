
import React from 'react';
// @ts-ignore - Fixing react-router-dom export error by using a dynamic import and casting to any
import * as ReactRouterDOM from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { HERO_IMAGE } from '../constants';

const { useNavigate } = ReactRouterDOM as any;

const AboutUs: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-[#333] text-white p-4 flex items-center sticky top-0 z-50">
        <button onClick={() => navigate(-1)}><ChevronLeft /></button>
        <span className="flex-1 text-center font-bold uppercase tracking-widest text-sm">Note</span>
      </div>
      <img src={HERO_IMAGE} alt="About" className="w-full h-48 object-cover" />
      <div className="p-8 space-y-6 text-gray-800">
        <h2 className="text-2xl font-black text-center border-b pb-4">ABOUT US</h2>
        <p className="text-sm leading-relaxed font-medium">
          Mahindra & Mahindra (M&M) initially manufactured tractors and light commercial vehicles. Over the years, the company expanded its business to include automobile manufacturing, parts manufacturing, construction, information technology and financial services, and trade.
        </p>
        <p className="text-sm leading-relaxed font-medium">
          In 1996, the company obtained ISO 9001 quality management system certification. With annual revenue exceeding US$1 billion, it has become one of India's top ten companies and ranks second among domestic automobile manufacturers in India. Its SUVs hold the No. 1 sales position in the Indian market.
        </p>
        <p className="text-sm leading-relaxed font-medium">
          Mahindra tractors were the company's earliest product and continue to be a cornerstone of our excellence in engineering and reliability.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
