'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isEncrypted: boolean;
}

export default function AiConfiguration() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Connection Test Form
  const [testProvider, setTestProvider] = useState('openai');
  const [testModel, setTestModel] = useState('gpt-4o');
  const [testKey, setTestKey] = useState('');
  const [testPrompt, setTestPrompt] = useState('Verify connection: say hello!');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Edit settings
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const fetchSettings = async () => {
    try {
      const data = await api.request<AppSetting[]>('/admin/settings');
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    try {
      await api.request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ key, value }),
      });
      setEditingKey(null);
      await fetchSettings();
      alert('Setting updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update setting');
    }
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    try {
      const result = await api.request('/admin/settings/test-ai', {
        method: 'POST',
        body: JSON.stringify({
          provider: testProvider,
          model: testModel,
          apiKey: testKey,
          prompt: testPrompt,
        }),
      });
      setTestResult({
        success: true,
        response: result.text,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
        timeMs: result.timeMs,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        response: err.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getSetting = (key: string) => settings.find((s) => s.key === key);

  return (
    <div className="space-y-8 max-w-5xl">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Global AI Switch */}
      <div className="bg-primary/25 border border-primary-light/40 rounded-xl p-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-white font-bold text-base mb-4">Global AI Settings</h3>
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-slate-200 text-sm font-semibold">Enable AI Grading & Feedback</p>
            <p className="text-slate-500 text-xs mt-1">If disabled, students will not be able to use AI writing and speaking features.</p>
          </div>
          <div>
            {getSetting('ai_enabled') && (
              <button
                onClick={() =>
                  handleUpdate('ai_enabled', getSetting('ai_enabled')?.value === 'true' ? 'false' : 'true')
                }
                className={`px-6 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all duration-200 cursor-pointer ${
                  getSetting('ai_enabled')?.value === 'true'
                    ? 'bg-emerald text-primary shadow-emerald/10'
                    : 'bg-red-500 text-white'
                }`}
              >
                {getSetting('ai_enabled')?.value === 'true' ? 'AI Enabled' : 'AI Disabled'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* API Credentials Settings */}
        <div className="bg-primary/25 border border-primary-light/40 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6">
          <h3 className="text-white font-bold text-base">Active Credentials & Model Selection</h3>
          
          <div className="space-y-4">
            {/* Active Provider */}
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Active AI Provider</label>
              {getSetting('active_ai_provider') && (
                <select
                  value={getSetting('active_ai_provider')?.value}
                  onChange={(e) => handleUpdate('active_ai_provider', e.target.value)}
                  className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-4 py-2.5 text-white focus:outline-none text-sm transition-colors duration-200"
                >
                  <option value="openai">OpenAI (GPT Models)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="ollama">Local LLM (Ollama)</option>
                </select>
              )}
            </div>

            {/* List keys and models */}
            {settings
              .filter((s) => s.key.startsWith('ai_') && s.key !== 'ai_enabled')
              .map((s) => (
                <div key={s.key} className="border-t border-primary-light/20 pt-4 first:border-0 first:pt-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-slate-300 text-xs font-semibold">{s.key.replace('ai_', '').toUpperCase()}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{s.description}</p>
                    </div>
                    {editingKey === s.key ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(s.key, editingValue)}
                          className="text-[10px] font-bold text-emerald hover:underline cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="text-[10px] font-bold text-red-400 hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingKey(s.key);
                          setEditingValue('');
                        }}
                        className="text-[10px] font-bold text-gold hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingKey === s.key ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      placeholder={s.isEncrypted ? 'Enter new API key...' : 'Enter new value...'}
                      className="w-full bg-navy/60 border border-gold rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"
                    />
                  ) : (
                    <p className="text-white text-xs font-mono bg-navy/40 px-3 py-1.5 rounded border border-primary-light/20 truncate">
                      {s.value || '(Empty)'}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* AI Playground Connection Test */}
        <div className="bg-primary/25 border border-primary-light/40 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6">
          <h3 className="text-white font-bold text-base">AI Connection Test Playground</h3>
          
          <form onSubmit={handleTestConnection} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Test Provider</label>
                <select
                  value={testProvider}
                  onChange={(e) => setTestProvider(e.target.value)}
                  className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                >
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="ollama">Ollama</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Test Model</label>
                <input
                  type="text"
                  value={testModel}
                  onChange={(e) => setTestModel(e.target.value)}
                  placeholder="e.g. gpt-4o"
                  className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Custom API Key (Optional)</label>
              <input
                type="password"
                placeholder="Leave blank to use saved key"
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Test Prompt</label>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={2}
                className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={testing}
              className="w-full bg-gold hover:bg-gold-dark text-primary font-bold py-2 rounded-lg text-xs transition-colors duration-200 cursor-pointer disabled:opacity-50"
            >
              {testing ? 'Testing Connection...' : 'Test Connection'}
            </button>
          </form>

          {/* Test results display */}
          {testResult && (
            <div className={`mt-6 p-4 rounded-lg border text-xs ${
              testResult.success 
                ? 'bg-emerald/10 border-emerald/30 text-slate-300' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <div className="flex justify-between font-bold border-b border-primary-light/20 pb-2 mb-2">
                <span>Result: {testResult.success ? 'SUCCESS' : 'FAILED'}</span>
                {testResult.success && <span>{testResult.timeMs}ms</span>}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto mb-2 font-mono bg-navy/40 p-2 rounded">
                {testResult.response}
              </p>
              {testResult.success && (
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold pt-1">
                  <span>Tokens used: {testResult.tokensUsed}</span>
                  <span>Est. Cost: ${testResult.cost.toFixed(5)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prompts Management Section */}
      <div className="bg-primary/25 border border-primary-light/40 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        <h3 className="text-white font-bold text-base">Prompts System Templates</h3>
        <div className="space-y-6">
          {settings
            .filter((s) => s.key.startsWith('prompt_'))
            .map((s) => (
              <div key={s.key} className="border-t border-primary-light/20 pt-6 first:border-0 first:pt-0">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-white text-sm font-bold capitalize">{s.key.replace('prompt_', '').replace('_', ' ')} Prompt</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{s.description}</p>
                  </div>
                  {editingKey === s.key ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(s.key, editingValue)}
                        className="text-xs font-bold text-emerald hover:underline cursor-pointer"
                      >
                        Save Prompt
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="text-xs font-bold text-red-400 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingKey(s.key);
                        setEditingValue(s.value);
                      }}
                      className="text-xs font-bold text-gold hover:underline cursor-pointer"
                    >
                      Edit Prompt Template
                    </button>
                  )}
                </div>
                {editingKey === s.key ? (
                  <textarea
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    rows={8}
                    className="w-full bg-navy/60 border border-gold rounded-lg p-3 text-white text-xs focus:outline-none leading-relaxed font-mono"
                  />
                ) : (
                  <pre className="text-slate-300 text-xs font-mono bg-navy/40 p-4 rounded-lg border border-primary-light/20 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {s.value}
                  </pre>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
