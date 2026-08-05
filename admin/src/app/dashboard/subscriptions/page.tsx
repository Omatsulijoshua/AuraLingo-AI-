'use client';

import React, { useState } from 'react';

interface TierPlan {
  id: string;
  name: string;
  price: string;
  voiceQuota: string;
  llmModels: string;
  status: 'ACTIVE' | 'FEATURED';
}

const TIER_PLANS: TierPlan[] = [
  {
    id: 'tier-1',
    name: 'AuraLingo Starter',
    price: '$9.99 / mo',
    voiceQuota: '150 Mins Voice Roleplay / mo',
    llmModels: 'Gemini 2.0 Flash & Llama 3.3',
    status: 'ACTIVE'
  },
  {
    id: 'tier-2',
    name: 'AuraLingo Pro AI (Recommended)',
    price: '$19.99 / mo',
    voiceQuota: 'Unlimited Live Voice & Scenario Drills',
    llmModels: 'Gemini 2.0 Flash, Llama 3.3 70B & OpenAI GPT-4o',
    status: 'FEATURED'
  },
  {
    id: 'tier-3',
    name: 'AuraLingo Enterprise Immersion',
    price: '$49.99 / mo',
    voiceQuota: 'Unlimited Voice + Dedicated Human Coach Audits',
    llmModels: 'All Premium Models + Custom Accent Models',
    status: 'ACTIVE'
  }
];

export default function AuraLingoSubscriptionsPage() {
  const [plans, setPlans] = useState<TierPlan[]>(TIER_PLANS);

  return (
    <div className="space-y-6 text-purple-50">
      {/* Header */}
      <div className="bg-primary/80 border border-primary-light/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black bg-coral/10 text-coral border border-coral/30 px-3 py-1 rounded-full uppercase tracking-wider">
              AuraLingo Monetization Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Subscription Tier Plans & AI Model Quotas</h1>
          <p className="text-purple-300/70 text-xs mt-1">Configure student membership tiers, voice practice quotas, and model access limits.</p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`p-6 rounded-3xl border space-y-5 transition-all shadow-2xl flex flex-col justify-between ${
              p.status === 'FEATURED'
                ? 'bg-gradient-to-b from-primary-light to-primary border-amethyst shadow-amethyst/30 scale-102'
                : 'bg-primary/80 border-primary-light/60 hover:border-amethyst/50'
            }`}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                  p.status === 'FEATURED' ? 'bg-coral text-white border-coral' : 'bg-amethyst/20 text-amethyst-light border-amethyst/30'
                }`}>
                  {p.status}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{p.name}</h3>
              <p className="text-3xl font-black text-amethyst-light">{p.price}</p>

              <div className="space-y-2 pt-3 border-t border-purple-900/60 text-xs text-purple-200">
                <div className="flex items-center gap-2">
                  <span>🎙️</span>
                  <span className="font-semibold">{p.voiceQuota}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🤖</span>
                  <span className="font-semibold">{p.llmModels}</span>
                </div>
              </div>
            </div>

            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-amethyst to-coral text-white font-black text-xs shadow-lg shadow-amethyst/20 hover:scale-102 transition-all cursor-pointer">
              Edit Tier Configuration →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
