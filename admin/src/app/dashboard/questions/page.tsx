'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface OptionInput {
  optionText: string;
  optionLetter: string;
  isCorrect: boolean;
}

interface AnswerInput {
  correctText: string;
}

export default function QuestionsBuilder() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [writing, setWriting] = useState<any[]>([]);
  const [speaking, setSpeaking] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'listening' | 'reading' | 'essays' | 'reports' | 'letters' | 'speaking'>('listening');

  // Selected item IDs for batch delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Clear selections when tab changes
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  // AutoSpin state and hook
  const [spinProgress, setSpinProgress] = useState<any>(null);
  const [showProSpinModal, setShowProSpinModal] = useState(false);
  const [spinDifficulty, setSpinDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [spinListeningCount, setSpinListeningCount] = useState(3);
  const [spinReadingCount, setSpinReadingCount] = useState(3);
  const [spinEssaysCount, setSpinEssaysCount] = useState(4);
  const [spinReportsCount, setSpinReportsCount] = useState(3);
  const [spinLettersCount, setSpinLettersCount] = useState(3);
  const [spinSpeakingCount, setSpinSpeakingCount] = useState(4);

  const startAutoSpin = async () => {
    if (spinProgress?.status === 'RUNNING') return;
    try {
      await api.request('/admin/ai/auto-spin', {
        method: 'POST',
        body: JSON.stringify({
          difficulty: spinDifficulty,
          listeningCount: spinListeningCount,
          readingCount: spinReadingCount,
          essaysCount: spinEssaysCount,
          reportsCount: spinReportsCount,
          lettersCount: spinLettersCount,
          speakingCount: spinSpeakingCount,
        }),
      });
      setSpinProgress({
        status: 'RUNNING',
        percent: 0,
        currentStep: 'Starting pro batch generation...',
        error: null,
      });
      setShowProSpinModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to start AutoSpin');
    }
  };

  useEffect(() => {
    let interval: any;
    if (spinProgress?.status === 'RUNNING') {
      interval = setInterval(async () => {
        try {
          const res = await api.request<any>('/admin/ai/auto-spin/progress');
          setSpinProgress(res);
          if (res.status === 'COMPLETED' || res.status === 'FAILED') {
            clearInterval(interval);
            loadQuestionsData();
          }
        } catch (err) {
          console.error('Error polling spin progress:', err);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [spinProgress?.status]);

  // Modals state
  const [showManualModal, setShowManualModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // AI Generation form states
  const [aiType, setAiType] = useState<'listening' | 'reading' | 'writing_report' | 'writing_letter' | 'writing_essay' | 'speaking'>('listening');
  const [aiTheme, setAiTheme] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Manual Question form states
  const [manualModuleId, setManualModuleId] = useState('');
  const [manualQuestionType, setManualQuestionType] = useState<'MULTIPLE_CHOICE' | 'FILL_IN_THE_BLANK'>('MULTIPLE_CHOICE');
  const [manualInstruction, setManualInstruction] = useState('');
  const [manualQuestionText, setManualQuestionText] = useState('');
  const [manualExplanation, setManualExplanation] = useState('');
  
  // MCQ options / Fib answers
  const [options, setOptions] = useState<OptionInput[]>([
    { optionText: '', optionLetter: 'A', isCorrect: false },
    { optionText: '', optionLetter: 'B', isCorrect: false },
  ]);
  const [answers, setAnswers] = useState<AnswerInput[]>([
    { correctText: '' }
  ]);

  // Manual Writing form states
  const [writingTitle, setWritingTitle] = useState('');
  const [writingPromptText, setWritingPromptText] = useState('');
  const [writingExamType, setWritingExamType] = useState<'ACADEMIC' | 'GENERAL'>('ACADEMIC');
  const [writingTaskType, setWritingTaskType] = useState<'TASK_1' | 'TASK_2'>('TASK_2');

  // Manual Speaking form states
  const [speakingTopic, setSpeakingTopic] = useState('');
  const [speakingCueCardText, setSpeakingCueCardText] = useState('');
  const [speakingFollowUps, setSpeakingFollowUps] = useState<string[]>(['', '', '']);

  const [saving, setSaving] = useState(false);

  const loadQuestionsData = async () => {
    try {
      const data = await api.request<any>('/admin/questions/all');
      setQuestions(data.questions || []);
      setWriting(data.writing || []);
      setSpeaking(data.speaking || []);
      setModules(data.modules || []);
      if (data.modules && data.modules.length > 0) {
        setManualModuleId(data.modules[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestionsData();
  }, []);

  const handleAddOption = () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const nextLetter = letters[options.length] || '';
    setOptions([...options, { optionText: '', optionLetter: nextLetter, isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, field: keyof OptionInput, val: any) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: val };
    setOptions(updated);
  };

  const handleAnswerChange = (index: number, val: string) => {
    const updated = [...answers];
    updated[index] = { correctText: val };
    setAnswers(updated);
  };

  const handleAddAnswer = () => {
    setAnswers([...answers, { correctText: '' }]);
  };

  const handleRemoveAnswer = (index: number) => {
    setAnswers(answers.filter((_, i) => i !== index));
  };

  const handleDelete = async (type: 'question' | 'writing' | 'speaking', id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const endpoint = type === 'question' 
        ? `/admin/questions/${id}` 
        : type === 'writing' 
          ? `/admin/writing-prompts/${id}` 
          : `/admin/speaking-prompts/${id}`;
      
      await api.request(endpoint, { method: 'DELETE' });
      alert('Deleted successfully!');
      setSelectedIds(prev => prev.filter(x => x !== id));
      await loadQuestionsData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected items?`)) return;
    setLoading(true);
    try {
      const type = activeTab === 'listening' || activeTab === 'reading'
        ? 'question'
        : activeTab === 'speaking'
          ? 'speaking'
          : 'writing';

      await Promise.all(
        selectedIds.map(id => {
          const endpoint = type === 'question'
            ? `/admin/questions/${id}`
            : type === 'writing'
              ? `/admin/writing-prompts/${id}`
              : `/admin/speaking-prompts/${id}`;
          return api.request(endpoint, { method: 'DELETE' });
        })
      );

      alert('Selected items deleted successfully!');
      setSelectedIds([]);
      await loadQuestionsData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete some of the selected items');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeTab === 'listening' || activeTab === 'reading') {
        await api.request('/admin/questions/manual', {
          method: 'POST',
          body: JSON.stringify({
            moduleId: manualModuleId,
            questionType: manualQuestionType,
            instruction: manualInstruction,
            questionText: manualQuestionText,
            explanation: manualExplanation,
            options: manualQuestionType === 'MULTIPLE_CHOICE' ? options.filter(o => o.optionText.trim()) : undefined,
            answers: manualQuestionType === 'FILL_IN_THE_BLANK' ? answers.filter(a => a.correctText.trim()) : undefined,
          }),
        });
      } else if (activeTab === 'essays' || activeTab === 'reports' || activeTab === 'letters') {
        await api.request('/admin/writing-prompts/manual', {
          method: 'POST',
          body: JSON.stringify({
            title: writingTitle.trim(),
            promptText: writingPromptText.trim(),
            examType: writingExamType,
            taskType: writingTaskType,
          }),
        });
      } else if (activeTab === 'speaking') {
        await api.request('/admin/speaking-prompts/manual', {
          method: 'POST',
          body: JSON.stringify({
            topic: speakingTopic.trim(),
            cueCardText: speakingCueCardText.trim(),
            followUpQuestions: speakingFollowUps.filter(q => q.trim()),
          }),
        });
      }

      alert('Question saved successfully!');
      setShowManualModal(false);
      // Reset forms
      setManualInstruction('');
      setManualQuestionText('');
      setManualExplanation('');
      setOptions([{ optionText: '', optionLetter: 'A', isCorrect: false }, { optionText: '', optionLetter: 'B', isCorrect: false }]);
      setAnswers([{ correctText: '' }]);
      setWritingTitle('');
      setWritingPromptText('');
      setSpeakingTopic('');
      setSpeakingCueCardText('');
      setSpeakingFollowUps(['', '', '']);
      
      await loadQuestionsData();
    } catch (err: any) {
      alert(err.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTheme.trim()) return alert('Please enter a theme/topic.');
    setAiGenerating(true);
    try {
      await api.request('/admin/ai/generate-single', {
        method: 'POST',
        body: JSON.stringify({
          type: aiType,
          theme: aiTheme.trim(),
        }),
      });
      alert('AI Question generated and saved successfully!');
      setShowAiModal(false);
      setAiTheme('');
      await loadQuestionsData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI question');
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter items based on active tab
  const listeningList = questions.filter(q => q.module?.name?.toLowerCase() === 'listening');
  const readingList = questions.filter(q => q.module?.name?.toLowerCase() === 'reading');
  const essaysList = writing.filter(w => w.taskType === 'TASK_2');
  const reportsList = writing.filter(w => w.taskType === 'TASK_1' && w.examType === 'ACADEMIC');
  const lettersList = writing.filter(w => w.taskType === 'TASK_1' && w.examType === 'GENERAL');
  const speakingList = speaking;

  // Active list based on activeTab
  const getActiveList = () => {
    switch (activeTab) {
      case 'listening': return listeningList;
      case 'reading': return readingList;
      case 'essays': return essaysList;
      case 'reports': return reportsList;
      case 'letters': return lettersList;
      case 'speaking': return speakingList;
    }
  };

  const currentList = getActiveList();

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    const listIds = currentList.map(item => item.id);
    if (checked) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...listIds])));
    } else {
      setSelectedIds(prev => prev.filter(id => !listIds.includes(id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-primary/25 border border-primary-light/40 rounded-xl p-6 shadow-xl backdrop-blur-sm flex justify-between items-center">
        <div>
          <h2 className="text-white font-extrabold text-lg">IELTS Questions & Prompts Builder</h2>
          <p className="text-slate-400 text-xs mt-1">Manage database questions manually or generate new practice questions using AI.</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer shadow-lg shadow-red-500/10"
            >
              🗑️ Delete Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => {
              // Set correct default parameters based on tab
              if (activeTab === 'listening' || activeTab === 'reading') {
                const mod = modules.find(m => m.name.toLowerCase() === activeTab);
                if (mod) setManualModuleId(mod.id);
              } else if (activeTab === 'essays') {
                setWritingTaskType('TASK_2');
                setWritingExamType('ACADEMIC');
              } else if (activeTab === 'reports') {
                setWritingTaskType('TASK_1');
                setWritingExamType('ACADEMIC');
              } else if (activeTab === 'letters') {
                setWritingTaskType('TASK_1');
                setWritingExamType('GENERAL');
              }
              setShowManualModal(true);
            }}
            className="bg-primary-light/35 border border-primary-light text-slate-200 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            ➕ Add Manually
          </button>
          <button
            onClick={() => {
              // Set AI selection matching active tab
              if (activeTab === 'listening' || activeTab === 'reading') {
                setAiType(activeTab);
              } else if (activeTab === 'essays') {
                setAiType('writing_essay');
              } else if (activeTab === 'reports') {
                setAiType('writing_report');
              } else if (activeTab === 'letters') {
                setAiType('writing_letter');
              } else {
                setAiType('speaking');
              }
              setShowAiModal(true);
            }}
            className="bg-gold hover:bg-gold-dark text-primary font-black px-4 py-2 rounded-lg text-xs transition-all cursor-pointer shadow-lg shadow-gold/10"
          >
            🤖 Generate AI Question
          </button>
          <button
            onClick={() => setShowProSpinModal(true)}
            disabled={spinProgress?.status === 'RUNNING'}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-black px-4 py-2 rounded-lg text-xs transition-all cursor-pointer shadow-lg shadow-purple-600/10 flex items-center gap-1.5"
          >
            🎡 Auto Spin Questions
          </button>
        </div>
      </div>

      {/* Auto Spin Progress Card */}
      {spinProgress && spinProgress.status !== 'IDLE' && (
        <div className="bg-primary/25 border border-primary-light/45 rounded-xl p-5 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-300">🎡 Auto-Spin Progress: {spinProgress.currentStep}</span>
            <span className="text-gold">{spinProgress.percent}%</span>
          </div>
          <div className="w-full bg-navy/60 rounded-full h-3 overflow-hidden border border-primary-light/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                spinProgress.status === 'FAILED'
                  ? 'bg-red-500'
                  : spinProgress.status === 'COMPLETED'
                  ? 'bg-emerald'
                  : 'bg-gold'
              }`}
              style={{ width: `${spinProgress.percent}%` }}
            />
          </div>
          {spinProgress.status === 'COMPLETED' && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald font-bold">🎉 Batch generation completed successfully! Questions inserted.</span>
              <button
                onClick={() => setSpinProgress(null)}
                className="text-slate-400 hover:text-white transition-colors underline font-semibold cursor-pointer"
              >
                Dismiss Notice
              </button>
            </div>
          )}
          {spinProgress.status === 'FAILED' && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-red-400 font-bold">❌ Generation failed: {spinProgress.error || 'Unknown error'}</span>
              <button
                onClick={() => setSpinProgress(null)}
                className="text-slate-400 hover:text-white transition-colors underline font-semibold cursor-pointer"
              >
                Dismiss Notice
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-xs">
          {error}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-primary-light/25 overflow-x-auto gap-2">
        {([
          { key: 'listening', label: 'Listening Module', count: listeningList.length },
          { key: 'reading', label: 'Reading Module', count: readingList.length },
          { key: 'essays', label: 'Writing Essays', count: essaysList.length },
          { key: 'reports', label: 'Writing Reports', count: reportsList.length },
          { key: 'letters', label: 'Writing Letters', count: lettersList.length },
          { key: 'speaking', label: 'Speaking Module', count: speakingList.length }
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer capitalize whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'border-gold text-gold font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-navy/80 text-slate-300 font-bold border border-primary-light/10">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main List */}
      <div className="bg-primary/20 border border-primary-light/40 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
        
        {/* LISTENING TAB */}
        {activeTab === 'listening' && (
          <QuestionTable 
            list={listeningList} 
            selectedIds={selectedIds}
            onSelect={handleSelectOne}
            onSelectAll={handleSelectAll}
            onDelete={(id) => handleDelete('question', id)} 
          />
        )}

        {/* READING TAB */}
        {activeTab === 'reading' && (
          <QuestionTable 
            list={readingList} 
            selectedIds={selectedIds}
            onSelect={handleSelectOne}
            onSelectAll={handleSelectAll}
            onDelete={(id) => handleDelete('question', id)} 
          />
        )}

        {/* ESSAYS TAB */}
        {activeTab === 'essays' && (
          <SubjectiveTable 
            list={essaysList} 
            selectedIds={selectedIds}
            onSelect={handleSelectOne}
            onSelectAll={handleSelectAll}
            onDelete={(id) => handleDelete('writing', id)} 
            isWriting={true} 
          />
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <SubjectiveTable 
            list={reportsList} 
            selectedIds={selectedIds}
            onSelect={handleSelectOne}
            onSelectAll={handleSelectAll}
            onDelete={(id) => handleDelete('writing', id)} 
            isWriting={true} 
          />
        )}

        {/* LETTERS TAB */}
        {activeTab === 'letters' && (
          <SubjectiveTable 
            list={lettersList} 
            selectedIds={selectedIds}
            onSelect={handleSelectOne}
            onSelectAll={handleSelectAll}
            onDelete={(id) => handleDelete('writing', id)} 
            isWriting={true} 
          />
        )}

        {/* SPEAKING TAB */}
        {activeTab === 'speaking' && (
          <SubjectiveTable 
            list={speakingList} 
            selectedIds={selectedIds}
            onSelect={handleSelectOne}
            onSelectAll={handleSelectAll}
            onDelete={(id) => handleDelete('speaking', id)} 
            isWriting={false} 
          />
        )}

      </div>

      {/* PRO AUTO-SPIN WIZARD MODAL */}
      {showProSpinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-primary border border-primary-light rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-white font-bold text-base">🎡 Pro Auto-Spin Questions</h3>
              <p className="text-slate-400 text-xs mt-1">Configure your AI batch generation parameters. Section counts set to 0 will be skipped.</p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Difficulty */}
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">Questions Difficulty</label>
                <select
                  value={spinDifficulty}
                  onChange={(e: any) => setSpinDifficulty(e.target.value)}
                  className="w-full bg-navy border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="BEGINNER">Beginner (Easy)</option>
                  <option value="INTERMEDIATE">Intermediate (Medium)</option>
                  <option value="ADVANCED">Advanced (Hard)</option>
                </select>
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">Listening Questions</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={spinListeningCount}
                    onChange={(e) => setSpinListeningCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-navy border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">Reading Questions</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={spinReadingCount}
                    onChange={(e) => setSpinReadingCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-navy border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">Writing Essays (Task 2)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={spinEssaysCount}
                    onChange={(e) => setSpinEssaysCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-navy border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">Writing Reports (Task 1 Academic)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={spinReportsCount}
                    onChange={(e) => setSpinReportsCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-navy border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">Writing Letters (Task 1 General)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={spinLettersCount}
                    onChange={(e) => setSpinLettersCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-navy border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">Speaking Cue Cards</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={spinSpeakingCount}
                    onChange={(e) => setSpinSpeakingCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-navy border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-primary-light/20">
              <button
                type="button"
                onClick={() => setShowProSpinModal(false)}
                className="bg-primary-light/40 hover:bg-primary-light/60 border border-primary-light text-slate-300 font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={startAutoSpin}
                className="bg-purple-600 hover:bg-purple-700 text-white font-black px-6 py-2 rounded-lg transition-all cursor-pointer shadow-lg shadow-purple-600/10 flex items-center gap-1.5"
              >
                🔥 Start Pro Spin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI GENERATION MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAiGenerate} className="bg-primary border border-primary-light rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-white font-bold text-base">🤖 AI Auto-Generate Question</h3>
              <p className="text-slate-400 text-xs mt-1">AI will formulate a question based on your chosen category and theme context.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Question Module Type</label>
                <select
                  value={aiType}
                  onChange={(e: any) => setAiType(e.target.value)}
                  className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2.5 text-white focus:outline-none"
                >
                  <option value="listening">Listening Objective</option>
                  <option value="reading">Reading Objective</option>
                  <option value="writing_report">Writing Task 1 Academic (Report)</option>
                  <option value="writing_letter">Writing Task 1 General (Letter)</option>
                  <option value="writing_essay">Writing Task 2 (Essay)</option>
                  <option value="speaking">Speaking Part 2 (Cue Card)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Theme / Topic Context</label>
                <input
                  type="text"
                  placeholder="e.g. Modern Technology, Fast Food Health, Global Warming"
                  value={aiTheme}
                  onChange={(e) => setAiTheme(e.target.value)}
                  className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2.5 text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-primary-light/20">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="bg-primary-light/35 text-slate-200 font-bold px-4 py-2 rounded-lg text-xs hover:text-white cursor-pointer"
                disabled={aiGenerating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={aiGenerating || !aiTheme.trim()}
                className="bg-gold hover:bg-gold-dark text-primary font-black px-5 py-2 rounded-lg text-xs disabled:opacity-50 cursor-pointer"
              >
                {aiGenerating ? 'Generating...' : 'Generate & Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MANUAL CREATION MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleManualSubmit} className="bg-primary border border-primary-light rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div>
              <h3 className="text-white font-bold text-base">➕ Create Question Manually</h3>
              <p className="text-slate-400 text-xs mt-1">Manually enter practice question specifications.</p>
            </div>

            <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-2">
              
              {/* OBJECTIVE FLOWS */}
              {(activeTab === 'listening' || activeTab === 'reading') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Module</label>
                      <select
                        value={manualModuleId}
                        onChange={(e) => setManualModuleId(e.target.value)}
                        className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white focus:outline-none"
                      >
                        {modules.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Question Type</label>
                      <select
                        value={manualQuestionType}
                        onChange={(e: any) => setManualQuestionType(e.target.value)}
                        className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white focus:outline-none"
                      >
                        <option value="MULTIPLE_CHOICE">Multiple Choice (MCQ)</option>
                        <option value="FILL_IN_THE_BLANK">Fill In The Blank (FIB)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Instruction / Context</label>
                    <input
                      type="text"
                      placeholder="e.g. Choose the correct letter A, B, or C."
                      value={manualInstruction}
                      onChange={(e) => setManualInstruction(e.target.value)}
                      className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2.5 text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Question Text</label>
                    <textarea
                      placeholder="e.g. According to the speaker, what is the main reason for..."
                      value={manualQuestionText}
                      onChange={(e) => setManualQuestionText(e.target.value)}
                      rows={3}
                      className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2.5 text-white focus:outline-none resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Answer Explanation</label>
                    <textarea
                      placeholder="Explain why the answer is correct for the student review page..."
                      value={manualExplanation}
                      onChange={(e) => setManualExplanation(e.target.value)}
                      rows={2}
                      className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2.5 text-white focus:outline-none resize-none"
                      required
                    />
                  </div>

                  {/* MCQ OPTIONS LIST */}
                  {manualQuestionType === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-3 p-4 bg-navy/40 rounded-xl border border-primary-light/10">
                      <div className="flex justify-between items-center">
                        <p className="text-gold font-bold text-[10px] uppercase">Multiple Choice Options</p>
                        <button
                          type="button"
                          onClick={handleAddOption}
                          className="text-[10px] text-gold hover:underline font-bold"
                        >
                          + Add Option
                        </button>
                      </div>
                      {options.map((opt, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder={`Option ${opt.optionLetter}`}
                            value={opt.optionText}
                            onChange={(e) => handleOptionChange(i, 'optionText', e.target.value)}
                            className="flex-1 bg-navy/80 border border-primary-light/60 focus:border-gold rounded px-2.5 py-1 text-white text-xs"
                            required
                          />
                          <input
                            type="checkbox"
                            checked={opt.isCorrect}
                            onChange={(e) => {
                              handleOptionChange(i, 'isCorrect', e.target.checked);
                            }}
                            className="w-4 h-4 accent-gold"
                          />
                          <span className="text-[10px] text-slate-500 font-bold">Correct?</span>
                          {options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(i)}
                              className="text-red-400 hover:text-red-500 text-xs font-bold px-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FIB ANSWERS LIST */}
                  {manualQuestionType === 'FILL_IN_THE_BLANK' && (
                    <div className="space-y-3 p-4 bg-navy/40 rounded-xl border border-primary-light/10">
                      <div className="flex justify-between items-center">
                        <p className="text-gold font-bold text-[10px] uppercase">Acceptable Answer Strings</p>
                        <button
                          type="button"
                          onClick={handleAddAnswer}
                          className="text-[10px] text-gold hover:underline font-bold"
                        >
                          + Add Answer Alternative
                        </button>
                      </div>
                      {answers.map((ans, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="e.g. library, standard library"
                            value={ans.correctText}
                            onChange={(e) => handleAnswerChange(i, e.target.value)}
                            className="flex-1 bg-navy/80 border border-primary-light/60 focus:border-gold rounded px-2.5 py-1 text-white text-xs"
                            required
                          />
                          {answers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAnswer(i)}
                              className="text-red-400 hover:text-red-500 text-xs font-bold px-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* WRITING FLOWS */}
              {(activeTab === 'essays' || activeTab === 'reports' || activeTab === 'letters') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Writing Task Type</label>
                      <select
                        value={writingTaskType}
                        onChange={(e: any) => setWritingTaskType(e.target.value)}
                        className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white focus:outline-none"
                      >
                        <option value="TASK_1">Task 1 (Report / Letter)</option>
                        <option value="TASK_2">Task 2 (Essay)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Exam Type</label>
                      <select
                        value={writingExamType}
                        onChange={(e: any) => setWritingExamType(e.target.value)}
                        className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white focus:outline-none"
                      >
                        <option value="ACADEMIC">Academic</option>
                        <option value="GENERAL">General</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Writing Prompt Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Modern Architecture Essay, Formal Bank Complaint Letter"
                      value={writingTitle}
                      onChange={(e) => setWritingTitle(e.target.value)}
                      className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2.5 text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Prompt Text Instructions</label>
                    <textarea
                      placeholder="Type the full writing instructions here..."
                      value={writingPromptText}
                      onChange={(e) => setWritingPromptText(e.target.value)}
                      rows={6}
                      className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2.5 text-white focus:outline-none resize-none"
                      required
                    />
                  </div>
                </>
              )}

              {/* SPEAKING FLOWS */}
              {activeTab === 'speaking' && (
                <>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Speaking Topic / Cue Card Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Describe a memorable holiday"
                      value={speakingTopic}
                      onChange={(e) => setSpeakingTopic(e.target.value)}
                      className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2.5 text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Cue Card Prompt Bullet Points</label>
                    <textarea
                      placeholder="Describe a journey you went on... You should say: where you went, when you went..."
                      value={speakingCueCardText}
                      onChange={(e) => setSpeakingCueCardText(e.target.value)}
                      rows={4}
                      className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2.5 text-white focus:outline-none resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-3 p-4 bg-navy/40 rounded-xl border border-primary-light/10">
                    <p className="text-gold font-bold text-[10px] uppercase">Part 3 Follow Up Discussion Questions</p>
                    {speakingFollowUps.map((q, i) => (
                      <input
                        key={i}
                        type="text"
                        placeholder={`Follow up question ${i + 1}`}
                        value={q}
                        onChange={(e) => {
                          const updated = [...speakingFollowUps];
                          updated[i] = e.target.value;
                          setSpeakingFollowUps(updated);
                        }}
                        className="w-full bg-navy border border-primary-light/60 focus:border-gold rounded px-2.5 py-1 text-white text-xs"
                      />
                    ))}
                  </div>
                </>
              )}

            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-primary-light/20">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="bg-primary-light/35 text-slate-200 font-bold px-4 py-2 rounded-lg text-xs hover:text-white cursor-pointer"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-gold hover:bg-gold-dark text-primary font-black px-5 py-2 rounded-lg text-xs disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Question'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Objective Table
interface QuestionTableProps {
  list: any[];
  selectedIds: string[];
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDelete: (id: string) => void;
}

function QuestionTable({ list, selectedIds, onSelect, onSelectAll, onDelete }: QuestionTableProps) {
  if (list.length === 0) {
    return <p className="text-slate-500 text-xs text-center py-24">No questions found in this module tab.</p>;
  }

  const isAllSelected = list.every(item => selectedIds.includes(item.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="text-xs uppercase text-slate-400 bg-primary/40 border-b border-primary-light/40 font-bold">
          <tr>
            <th className="px-6 py-4 w-12">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 accent-gold rounded border-primary-light cursor-pointer"
              />
            </th>
            <th className="px-6 py-4">Instruction</th>
            <th className="px-6 py-4">Question Text</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Difficulty</th>
            <th className="px-6 py-4">Audio / Track</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary-light/20 text-xs">
          {list.map((q) => (
            <tr key={q.id} className={`hover:bg-primary-light/10 transition-colors duration-200 ${selectedIds.includes(q.id) ? 'bg-primary-light/10' : ''}`}>
              <td className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(q.id)}
                  onChange={(e) => onSelect(q.id, e.target.checked)}
                  className="w-4 h-4 accent-gold rounded border-primary-light cursor-pointer"
                />
              </td>
              <td className="px-6 py-4 font-semibold text-white max-w-xs truncate">{q.instruction}</td>
              <td className="px-6 py-4 max-w-sm truncate">{q.questionText}</td>
              <td className="px-6 py-4 font-mono text-[10px] text-gold uppercase">{q.questionType}</td>
              <td className="px-6 py-4">
                <span className="bg-primary-light/40 px-2 py-0.5 rounded text-[9px] font-bold text-slate-300 border border-primary-light/50">
                  {q.difficulty}
                </span>
              </td>
              <td className="px-6 py-4">
                {q.listeningAudio ? (
                  <div className="flex items-center gap-3">
                    <audio 
                      src={q.listeningAudio.audioUrl.startsWith('http') ? q.listeningAudio.audioUrl : `https://bandup-ielts.onrender.com${q.listeningAudio.audioUrl}`} 
                      controls 
                      className="w-44 h-7 accent-gold outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => alert(`Transcript:\n\n${q.listeningAudio.transcript}`)}
                      className="bg-gold/15 text-gold border border-gold/20 hover:bg-gold hover:text-primary px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer whitespace-nowrap"
                    >
                      Show Transcript
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const confirmRegen = window.confirm('Are you sure you want to regenerate the audio using the OpenAI API Key in AI Settings? This will overwrite the current track.');
                          if (!confirmRegen) return;
                          await api.request(`/admin/listening-audio/${q.listeningAudio.id}/regenerate`, {
                            method: 'POST'
                          });
                          alert('Audio regenerated successfully! Refresh the page to listen to the new track.');
                        } catch (err: any) {
                          alert(err.message || 'Failed to regenerate audio. Make sure your OpenAI API Key is valid.');
                        }
                      }}
                      className="bg-emerald/15 text-emerald border border-emerald/20 hover:bg-emerald hover:text-primary px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer whitespace-nowrap"
                    >
                      Regenerate Audio
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">None</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(q.id)}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-2.5 py-1 rounded font-bold text-[10px] transition-all cursor-pointer"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Subcomponent: Subjective Table
interface SubjectiveTableProps {
  list: any[];
  selectedIds: string[];
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDelete: (id: string) => void;
  isWriting: boolean;
}

function SubjectiveTable({ list, selectedIds, onSelect, onSelectAll, onDelete, isWriting }: SubjectiveTableProps) {
  if (list.length === 0) {
    return <p className="text-slate-500 text-xs text-center py-24">No prompts found in this tab.</p>;
  }

  const isAllSelected = list.every(item => selectedIds.includes(item.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="text-xs uppercase text-slate-400 bg-primary/40 border-b border-primary-light/40 font-bold">
          <tr>
            <th className="px-6 py-4 w-12">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 accent-gold rounded border-primary-light cursor-pointer"
              />
            </th>
            <th className="px-6 py-4">{isWriting ? 'Title' : 'Speaking Topic'}</th>
            <th className="px-6 py-4">{isWriting ? 'Prompt Text' : 'Cue Card Text'}</th>
            {isWriting && <th className="px-6 py-4">Exam Type</th>}
            {isWriting && <th className="px-6 py-4">Task</th>}
            <th className="px-6 py-4">Difficulty</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary-light/20 text-xs">
          {list.map((q) => (
            <tr key={q.id} className={`hover:bg-primary-light/10 transition-colors duration-200 ${selectedIds.includes(q.id) ? 'bg-primary-light/10' : ''}`}>
              <td className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(q.id)}
                  onChange={(e) => onSelect(q.id, e.target.checked)}
                  className="w-4 h-4 accent-gold rounded border-primary-light cursor-pointer"
                />
              </td>
              <td className="px-6 py-4 font-semibold text-white max-w-xs truncate">{isWriting ? q.title : q.topic}</td>
              <td className="px-6 py-4 max-w-sm truncate">{isWriting ? q.promptText : q.cueCardText}</td>
              {isWriting && (
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${q.examType === 'ACADEMIC' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-purple-500/15 text-purple-400 border border-purple-500/20'}`}>
                    {q.examType}
                  </span>
                </td>
              )}
              {isWriting && (
                <td className="px-6 py-4 font-mono font-bold text-[10px] text-gold uppercase">{q.taskType}</td>
              )}
              <td className="px-6 py-4">
                <span className="bg-primary-light/40 px-2 py-0.5 rounded text-[9px] font-bold text-slate-300 border border-primary-light/50">
                  {q.difficulty}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(q.id)}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-2.5 py-1 rounded font-bold text-[10px] transition-all cursor-pointer"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
