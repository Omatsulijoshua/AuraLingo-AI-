'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface MockTest {
  id: string;
  title: string;
  examType: 'ACADEMIC' | 'GENERAL';
  duration: number;
  sections: { id: string; title: string; order: number }[];
}

export default function MockExamsBuilder() {
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [passages, setPassages] = useState<any[]>([]);
  const [audios, setAudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating a new test
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState<'ACADEMIC' | 'GENERAL'>('ACADEMIC');
  const [duration, setDuration] = useState(160);
  const [sections, setSections] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // New section inputs
  const [secTitle, setSecTitle] = useState('');
  const [secInstructions, setSecInstructions] = useState('');
  const [secModuleType, setSecModuleType] = useState('LISTENING');
  const [selectedPassageId, setSelectedPassageId] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState('');

  const loadData = async () => {
    try {
      const [tests, mods, rPassages, lAudios] = await Promise.all([
        api.request<MockTest[]>('/mock-tests'),
        api.request<any[]>('/content/modules'),
        api.request<any[]>('/content/passages'),
        api.request<any[]>('/content/audios'),
      ]);
      setMockTests(Array.isArray(tests) ? tests : []);
      setModules(Array.isArray(mods) ? mods : []);
      setPassages(Array.isArray(rPassages) ? rPassages : []);
      setAudios(Array.isArray(lAudios) ? lAudios : []);
    } catch (err) {
      console.error('Failed to load mock exam data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSection = () => {
    if (!secTitle) {
      alert('Section title is required');
      return;
    }

    const matchedModule = modules.find((m) => m.name.toUpperCase() === secModuleType.toUpperCase());
    if (!matchedModule) {
      alert(`Module ${secModuleType} not found in database. Please run auto-spin first!`);
      return;
    }

    const newSec = {
      moduleId: matchedModule.id,
      moduleName: matchedModule.name,
      title: secTitle,
      instructions: secInstructions,
      readingPassageId: secModuleType === 'READING' ? selectedPassageId || null : null,
      listeningAudioId: secModuleType === 'LISTENING' ? selectedAudioId || null : null,
      order: sections.length + 1,
    };

    setSections([...sections, newSec]);
    
    // Clear inputs
    setSecTitle('');
    setSecInstructions('');
    setSelectedPassageId('');
    setSelectedAudioId('');
  };

  const handleRemoveSection = (idx: number) => {
    const updated = sections.filter((_, i) => i !== idx).map((sec, i) => ({
      ...sec,
      order: i + 1,
    }));
    setSections(updated);
  };

  const handleSubmitMockTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Mock test title is required');
      return;
    }
    if (sections.length === 0) {
      alert('At least one section is required to build a mock test');
      return;
    }

    setSubmitting(true);
    try {
      await api.request('/mock-tests', {
        method: 'POST',
        body: JSON.stringify({
          title,
          examType,
          duration,
          sections,
        }),
      });

      alert('Mock test created successfully!');
      setShowCreateForm(false);
      setTitle('');
      setSections([]);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create mock test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMockTest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mock test? This action cannot be undone.')) return;
    try {
      await api.request(`/mock-tests/${id}`, {
        method: 'DELETE',
      });
      alert('Mock test deleted successfully!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete mock test');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex justify-between items-center bg-primary/20 border border-primary-light/25 rounded-2xl p-6 shadow-xl">
        <div>
          <h2 className="text-white font-extrabold text-lg">Mock Exam Builder</h2>
          <p className="text-slate-400 text-xs mt-0.5">Manage handcrafted timed complete mock tests and sections</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gold hover:bg-gold-dark text-primary font-black px-4 py-2 rounded-lg text-xs cursor-pointer transition-colors shadow-lg shadow-gold/15"
        >
          {showCreateForm ? 'View Published Mocks' : 'Create New Mock Test'}
        </button>
      </div>

      {showCreateForm ? (
        <form onSubmit={handleSubmitMockTest} className="bg-primary/20 border border-primary-light/25 rounded-2xl p-8 shadow-xl space-y-6">
          <h3 className="text-white font-bold text-base border-b border-primary-light/10 pb-3">New Mock Test Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-bold">Test Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. IELTS Academic Full Mock Test #2"
                className="w-full bg-navy/40 border border-primary-light/35 focus:border-gold rounded-lg px-4 py-2.5 text-white text-xs focus:outline-none"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-bold">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as any)}
                className="w-full bg-navy/40 border border-primary-light/35 focus:border-gold rounded-lg px-4 py-2.5 text-white text-xs focus:outline-none"
              >
                <option value="ACADEMIC">Academic Format</option>
                <option value="GENERAL">General Training</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-bold">Duration (Minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 160)}
                className="w-full bg-navy/40 border border-primary-light/35 focus:border-gold rounded-lg px-4 py-2.5 text-white text-xs focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Section Builder Sub-Form */}
          <div className="bg-navy/35 border border-primary-light/15 rounded-xl p-6 space-y-4">
            <h4 className="text-gold font-bold text-xs">🛠️ Add Section to Test</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-slate-400 text-[10px] font-bold">Section Title</label>
                <input
                  type="text"
                  value={secTitle}
                  onChange={(e) => setSecTitle(e.target.value)}
                  placeholder="e.g. Reading Section 1: History of Science"
                  className="w-full bg-navy/55 border border-primary-light/30 focus:border-gold rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px] font-bold">Module Type</label>
                <select
                  value={secModuleType}
                  onChange={(e) => setSecModuleType(e.target.value)}
                  className="w-full bg-navy/55 border border-primary-light/30 focus:border-gold rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                >
                  <option value="LISTENING">Listening Module</option>
                  <option value="READING">Reading Module</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 text-[10px] font-bold">Instructions</label>
              <textarea
                rows={2}
                value={secInstructions}
                onChange={(e) => setSecInstructions(e.target.value)}
                placeholder="e.g. Read the passage and answer questions 1 to 10..."
                className="w-full bg-navy/55 border border-primary-light/30 focus:border-gold rounded-lg p-3 text-white text-xs focus:outline-none"
              />
            </div>

            {/* Reference resource dropdown list */}
            {secModuleType === 'READING' ? (
              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px] font-bold">Associate Reading Passage</label>
                <select
                  value={selectedPassageId}
                  onChange={(e) => setSelectedPassageId(e.target.value)}
                  className="w-full bg-navy/55 border border-primary-light/30 focus:border-gold rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                >
                  <option value="">-- Choose Reading Passage reference from database --</option>
                  {passages.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px] font-bold">Associate Listening Audio Track</label>
                <select
                  value={selectedAudioId}
                  onChange={(e) => setSelectedAudioId(e.target.value)}
                  className="w-full bg-navy/55 border border-primary-light/30 focus:border-gold rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                >
                  <option value="">-- Choose Listening Audio reference from database --</option>
                  {audios.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleAddSection}
              className="bg-emerald/10 border border-emerald/30 hover:bg-emerald/20 text-emerald font-bold px-4 py-2 rounded text-xs transition-colors cursor-pointer"
            >
              + Append Section to List
            </button>
          </div>

          {/* Current Sections List */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs">Section Sequence ({sections.length} sections added)</h4>
            {sections.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No sections added yet. Use the tool above to add sections.</p>
            ) : (
              <div className="space-y-2">
                {sections.map((sec, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-navy/40 border border-primary-light/10 rounded-lg text-xs">
                    <div>
                      <p className="font-bold text-white">Order {sec.order}: {sec.title}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Module: {sec.moduleName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(idx)}
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-primary-light/10 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-gold hover:bg-gold-dark text-primary font-black px-6 py-2.5 rounded-lg text-xs cursor-pointer transition-colors shadow-lg shadow-gold/15"
            >
              {submitting ? 'Creating Test...' : 'Publish Mock Test'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mockTests.map((test) => (
            <div key={test.id} className="bg-primary/20 border border-primary-light/25 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-bold text-sm">{test.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="bg-primary-light/40 border border-primary-light/50 px-2 py-0.5 rounded text-[9px] font-bold text-slate-300">
                      {test.examType}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">⏱️ {test.duration} Minutes</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMockTest(test.id)}
                  className="text-red-400 hover:text-red-300 font-bold text-xs"
                >
                  Delete
                </button>
              </div>

              <div className="border-t border-primary-light/10 pt-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Sections Configured</p>
                {test.sections.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No sections configured under this test.</p>
                ) : (
                  <div className="space-y-1">
                    {test.sections.map((sec) => (
                      <p key={sec.id} className="text-xs text-slate-300">
                        • {sec.title} (Order {sec.order})
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
