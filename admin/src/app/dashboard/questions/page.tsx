'use client';

import React, { useState } from 'react';

interface ScenarioPrompt {
  id: string;
  category: string;
  title: string;
  cefrLevel: string;
  tutorRole: string;
  grammarFocus: string;
  status: 'ACTIVE' | 'DRAFT';
}

const INITIAL_PROMPTS: ScenarioPrompt[] = [
  {
    id: 'sc-1',
    category: 'BUSINESS',
    title: 'Tech Job Interview Simulation',
    cefrLevel: 'B2',
    tutorRole: 'Senior HR Hiring Director',
    grammarFocus: 'Past Perfect & Past Simple Contrast',
    status: 'ACTIVE'
  },
  {
    id: 'sc-2',
    category: 'TRAVEL',
    title: 'Tapas Bar Order & Small Talk',
    cefrLevel: 'A2',
    tutorRole: 'Local Bistro Host',
    grammarFocus: 'Polite Requests & Ordering Vocabulary',
    status: 'ACTIVE'
  },
  {
    id: 'sc-3',
    category: 'REAL_ESTATE',
    title: 'Apartment Lease Negotiation',
    cefrLevel: 'B1',
    tutorRole: 'Property Manager',
    grammarFocus: 'Conditional Sentences & Lease Terms',
    status: 'ACTIVE'
  },
  {
    id: 'sc-4',
    category: 'ACADEMIC',
    title: 'University Research Defense',
    cefrLevel: 'C1',
    tutorRole: 'Department Professor',
    grammarFocus: 'Formal Academic Register & Hypotheses',
    status: 'ACTIVE'
  }
];

export default function AuraLingoQuestionsBuilder() {
  const [prompts, setPrompts] = useState<ScenarioPrompt[]>(INITIAL_PROMPTS);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'grammar' | 'phonetics'>('scenarios');
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('BUSINESS');
  const [newCefr, setNewCefr] = useState('B1');
  const [newTutorRole, setNewTutorRole] = useState('');
  const [newGrammar, setNewGrammar] = useState('');

  const handleCreatePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created: ScenarioPrompt = {
      id: `sc-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      cefrLevel: newCefr,
      tutorRole: newTutorRole.trim() || 'AI Conversation Partner',
      grammarFocus: newGrammar.trim() || 'General Conversation',
      status: 'ACTIVE'
    };
    setPrompts([created, ...prompts]);
    setShowModal(false);
    setNewTitle('');
    setNewTutorRole('');
    setNewGrammar('');
  };

  return (
    <div className="space-y-6 text-purple-50">
      {/* Header */}
      <div className="bg-primary/80 border border-primary-light/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black bg-coral/10 text-coral border border-coral/30 px-3 py-1 rounded-full uppercase tracking-wider">
              AuraLingo AI Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">AI Conversational Prompt & Scenario Builder</h1>
          <p className="text-purple-300/70 text-xs mt-1">Manage 24/7 AI tutor personas, roleplay scenarios, and grammar focus rules.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-amethyst to-coral hover:from-coral hover:to-amethyst text-white font-black px-5 py-3 rounded-2xl text-xs shadow-xl shadow-amethyst/30 transition-all hover:scale-105 cursor-pointer shrink-0"
        >
          ✨ Synthesize New AI Scenario
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-purple-900/60 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`pb-3 text-xs font-black transition-all border-b-2 cursor-pointer ${
            activeTab === 'scenarios' ? 'border-amethyst text-amethyst-light' : 'border-transparent text-purple-300/60 hover:text-white'
          }`}
        >
          Conversational Scenarios ({prompts.length})
        </button>
        <button
          onClick={() => setActiveTab('grammar')}
          className={`pb-3 text-xs font-black transition-all border-b-2 cursor-pointer ${
            activeTab === 'grammar' ? 'border-amethyst text-amethyst-light' : 'border-transparent text-purple-300/60 hover:text-white'
          }`}
        >
          Grammar Micro-Rule Bank (48)
        </button>
        <button
          onClick={() => setActiveTab('phonetics')}
          className={`pb-3 text-xs font-black transition-all border-b-2 cursor-pointer ${
            activeTab === 'phonetics' ? 'border-amethyst text-amethyst-light' : 'border-transparent text-purple-300/60 hover:text-white'
          }`}
        >
          Phonetic Accent Engines (12)
        </button>
      </div>

      {/* Content Table */}
      {activeTab === 'scenarios' && (
        <div className="bg-primary/80 border border-primary-light/60 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-purple-200">
              <thead className="text-xs uppercase text-purple-300/70 bg-navy/80 border-b border-primary-light/60 font-black">
                <tr>
                  <th className="px-6 py-4">Scenario Title</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">CEFR Level</th>
                  <th className="px-6 py-4">AI Tutor Persona</th>
                  <th className="px-6 py-4">Grammar Focus</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/40">
                {prompts.map((sc) => (
                  <tr key={sc.id} className="hover:bg-primary-light/30 transition-all duration-200">
                    <td className="px-6 py-4 font-bold text-white text-sm">{sc.title}</td>
                    <td className="px-6 py-4">
                      <span className="bg-coral/10 text-coral border border-coral/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                        {sc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-amethyst/20 text-amethyst-light border border-amethyst/30 text-[10px] font-black px-2.5 py-1 rounded-full">
                        {sc.cefrLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-purple-100">{sc.tutorRole}</td>
                    <td className="px-6 py-4 text-xs text-purple-300/80">{sc.grammarFocus}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setPrompts(prompts.filter(p => p.id !== sc.id))}
                        className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreatePrompt} className="bg-primary border border-primary-light/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Synthesize AI Scenario</h3>
              <p className="text-xs text-purple-300/70">Create a new conversational prompt for AuraLingo AI.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-purple-200 font-bold mb-1">Scenario Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Airport Immigration Clearance"
                  className="w-full bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl px-4 py-2.5 text-white placeholder-purple-400/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-200 font-bold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="BUSINESS">Business</option>
                    <option value="TRAVEL">Travel</option>
                    <option value="REAL_ESTATE">Real Estate</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="DATING">Dating</option>
                    <option value="CASUAL">Casual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-purple-200 font-bold mb-1">CEFR Level</label>
                  <select
                    value={newCefr}
                    onChange={(e) => setNewCefr(e.target.value)}
                    className="w-full bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-purple-200 font-bold mb-1">AI Tutor Persona Role</label>
                <input
                  type="text"
                  value={newTutorRole}
                  onChange={(e) => setNewTutorRole(e.target.value)}
                  placeholder="e.g. Senior Airport Border Officer"
                  className="w-full bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl px-4 py-2.5 text-white placeholder-purple-400/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-purple-200 font-bold mb-1">Grammar Focus</label>
                <input
                  type="text"
                  value={newGrammar}
                  onChange={(e) => setNewGrammar(e.target.value)}
                  placeholder="e.g. Present Perfect vs Simple Past"
                  className="w-full bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl px-4 py-2.5 text-white placeholder-purple-400/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-purple-900/60">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="bg-primary-light/40 text-purple-300 font-bold px-4 py-2 rounded-xl text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-amethyst to-coral text-white font-black px-5 py-2 rounded-xl text-xs shadow-lg shadow-amethyst/30"
              >
                Create Scenario ✨
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
