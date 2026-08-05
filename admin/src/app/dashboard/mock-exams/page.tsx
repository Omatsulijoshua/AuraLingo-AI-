'use client';

import React, { useState } from 'react';

interface CertificationExam {
  id: string;
  title: string;
  cefrTarget: string;
  durationMins: number;
  sectionsCount: number;
  status: 'PUBLISHED' | 'DRAFT';
}

const INITIAL_EXAMS: CertificationExam[] = [
  {
    id: 'exam-1',
    title: 'AuraLingo CEFR B2 Spoken Fluency Certification',
    cefrTarget: 'B2 Level',
    durationMins: 45,
    sectionsCount: 3,
    status: 'PUBLISHED'
  },
  {
    id: 'exam-2',
    title: 'AuraLingo Business Communication Master (C1)',
    cefrTarget: 'C1 Level',
    durationMins: 60,
    sectionsCount: 4,
    status: 'PUBLISHED'
  },
  {
    id: 'exam-3',
    title: 'AuraLingo Conversational Foundations (A2)',
    cefrTarget: 'A2 Level',
    durationMins: 30,
    sectionsCount: 2,
    status: 'PUBLISHED'
  }
];

export default function AuraLingoMockExamsPage() {
  const [exams, setExams] = useState<CertificationExam[]>(INITIAL_EXAMS);

  return (
    <div className="space-y-6 text-purple-50">
      {/* Header */}
      <div className="bg-primary/80 border border-primary-light/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black bg-coral/10 text-coral border border-coral/30 px-3 py-1 rounded-full uppercase tracking-wider">
              AuraLingo AI Certifications
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Full-Length AI Language Fluency Exams</h1>
          <p className="text-purple-300/70 text-xs mt-1">Design timed CEFR speaking, listening comprehension, and grammar certification tests.</p>
        </div>

        <button className="bg-gradient-to-r from-amethyst to-coral hover:from-coral hover:to-amethyst text-white font-black px-5 py-3 rounded-2xl text-xs shadow-xl shadow-amethyst/30 transition-all hover:scale-105 cursor-pointer shrink-0">
          ✨ Synthesize New Certification Exam
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {exams.map((ex) => (
          <div
            key={ex.id}
            className="bg-primary/80 border border-primary-light/60 hover:border-amethyst/60 p-6 rounded-3xl space-y-4 shadow-xl transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="bg-amethyst/20 text-amethyst-light border border-amethyst/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {ex.cefrTarget}
                </span>
                <span className="text-[10px] font-black bg-emerald/10 text-emerald border border-emerald/20 px-2.5 py-0.5 rounded-full uppercase">
                  {ex.status}
                </span>
              </div>

              <h3 className="font-extrabold text-white text-base leading-snug">{ex.title}</h3>

              <div className="flex items-center gap-4 text-xs text-purple-300/80 pt-2 border-t border-purple-900/60">
                <span>⏱️ {ex.durationMins} Minutes</span>
                <span>📋 {ex.sectionsCount} Sections</span>
              </div>
            </div>

            <div className="pt-3 border-t border-purple-900/60 flex items-center justify-between">
              <button
                onClick={() => setExams(exams.filter(e => e.id !== ex.id))}
                className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                Delete Exam
              </button>
              <button className="bg-gradient-to-r from-amethyst to-purple-600 text-white font-black px-4 py-2 rounded-xl text-xs shadow-md shadow-amethyst/20 cursor-pointer">
                Configure Test →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
