'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function MarketingLandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is the difference between IELTS Academic and General Training?',
      a: 'IELTS Academic is for students wishing to study at undergraduate or postgraduate levels, or for professional registration. IELTS General Training is for those migrating to English-speaking countries, or training/studying at a below-degree level.',
    },
    {
      q: 'How does the AI Writing and Speaking correction work?',
      a: 'When you submit an essay or voice recording, our AI analyzes it against the official IELTS band descriptors (Task Achievement, Coherence, Lexical Resource, Grammar). It outputs an estimated band score, highlights mistakes, and provides a Band 9.0 rewrite.',
    },
    {
      q: 'Can I cancel my subscription at any time?',
      a: 'Yes, subscriptions are billed monthly and you can cancel auto-renewal at any time through your dashboard settings. You will retain premium access until the end of your billing cycle.',
    },
    {
      q: 'Is there a free trial?',
      a: 'Yes! Every new account gets registered on our Free Starter Plan, which includes 5 practice questions per day and 1 free full-length mock test with auto-marking.',
    },
  ];

  const pricingPlans = [
    {
      name: 'Free Starter',
      price: '₦0',
      description: 'Perfect for exploring the platform and testing your baseline.',
      features: ['5 Practice Questions / Day', '1 Full Mock Test', 'Basic progress analytics', 'Community FAQ Support'],
      cta: 'Start Free Trial',
      link: '/auth/register',
      popular: false,
    },
    {
      name: 'Basic Preparation',
      price: '₦15,000',
      description: 'Comprehensive practice questions library for self-study.',
      features: ['20 Practice Questions / Day', '3 Full Mock Tests', 'Unlimited lessons access', 'Email Support'],
      cta: 'Choose Basic',
      link: '/auth/register',
      popular: false,
    },
    {
      name: 'Pro AI Intensive',
      price: '₦35,000',
      description: 'Maximize your band score using instant AI evaluations.',
      features: ['Unlimited Practice & Lessons', 'Unlimited Mock Tests', 'AI Writing corrections', 'AI Speaking evaluations', 'Priority Support'],
      cta: 'Go Pro AI',
      link: '/auth/register',
      popular: true,
    },
    {
      name: 'Premium Tutor',
      price: '₦75,000',
      description: 'Complete package with personalized tutor review.',
      features: ['Everything in Pro AI', '1-on-1 Tutor feedback', 'Personalized Study Plans', 'Completion Certificates'],
      cta: 'Get Premium',
      link: '/auth/register',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-navy text-white selection:bg-gold selection:text-primary">
      {/* Header / Navbar */}
      <header className="h-20 border-b border-primary-light/30 bg-primary/40 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-8 md:px-16">
        <Link href="/" className="text-2xl font-bold tracking-wider flex items-center gap-2">
          <span className="text-gold">BandUp</span> IELTS
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
          <a href="#about" className="hover:text-gold transition-colors duration-200">About IELTS</a>
          <a href="#features" className="hover:text-gold transition-colors duration-200">AI Tools</a>
          <a href="#pricing" className="hover:text-gold transition-colors duration-200">Pricing</a>
          <a href="#faq" className="hover:text-gold transition-colors duration-200">FAQ</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-semibold text-slate-300 hover:text-gold transition-colors duration-200">
            Sign In
          </Link>
          <Link href="/auth/register" className="bg-gold hover:bg-gold-dark text-primary font-bold px-5 py-2.5 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-gold/15">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-8 md:px-16 overflow-hidden flex flex-col items-center text-center">
        {/* Gradients */}
        <div className="absolute top-[-30%] left-[-30%] w-[80%] h-[80%] rounded-full bg-primary-light/25 blur-[160px]" />
        <div className="absolute bottom-[-30%] right-[-30%] w-[80%] h-[80%] rounded-full bg-gold/10 blur-[160px]" />

        <div className="max-w-3xl relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary-light/40 border border-primary-light/60 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider text-slate-300 uppercase">
            🚀 Powered by Advanced AI
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Crack the IELTS Exam with <span className="text-gold">Estimated Band 8.5+</span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Get instant AI writing feedback, speaking practice transcriptions, and interactive mock tests tailored to Academic and General Training.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/auth/register" className="w-full sm:w-auto bg-gold hover:bg-gold-dark text-primary font-extrabold px-8 py-4 rounded-lg transition-all duration-200 shadow-xl shadow-gold/25 text-base cursor-pointer">
              Start Free Trial
            </Link>
            <a href="#pricing" className="w-full sm:w-auto border border-primary-light/80 hover:border-gold px-8 py-4 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer">
              View Plans
            </a>
          </div>
        </div>
      </section>

      {/* IELTS Intro Section */}
      <section id="about" className="py-20 bg-primary/20 border-y border-primary-light/30 px-8 md:px-16">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Understanding the IELTS Modules</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">We support all sections of both IELTS Academic and General Training exams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-primary/45 border border-primary-light/40 rounded-2xl p-8 shadow-xl">
              <h3 className="text-gold font-bold text-xl mb-4">IELTS Academic</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Designed for candidates applying for higher education or professional registration in English-speaking environments. The listening and speaking modules are standard, while reading and writing topics relate to academic disciplines.
              </p>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Features charts, reports & essays</span>
            </div>
            <div className="bg-primary/45 border border-primary-light/40 rounded-2xl p-8 shadow-xl">
              <h3 className="text-gold font-bold text-xl mb-4">IELTS General Training</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Suited for candidates looking to migrate to Australia, Canada, New Zealand, or the UK, or applying for training programs or secondary school education. Reading and writing tasks focus on general survival context in work and social life.
              </p>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Features letters & general essays</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-20 px-8 md:px-16">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Instant AI-Driven Corrective Learning</h2>
            <p className="text-slate-400 text-sm">Study with feedback calibrated to the actual IELTS band score descriptors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-primary/20 border border-primary-light/30 rounded-2xl p-6 space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center font-bold text-xl">✍️</div>
              <h3 className="text-white font-bold text-lg">AI Essay Review</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Submit Task 1 and Task 2 writing responses. Get highlighted mistakes, vocabulary updates, and a Band 9.0 rewrite.
              </p>
            </div>
            <div className="bg-primary/20 border border-primary-light/30 rounded-2xl p-6 space-y-4">
              <div className="w-12 h-12 bg-emerald/10 text-emerald rounded-xl flex items-center justify-center font-bold text-xl">🎙️</div>
              <h3 className="text-white font-bold text-lg">Speaking Analysis</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Record directly in app. AI transcribes speech-to-text, evaluates fluency/pronunciation, and suggests idiomatic phrases.
              </p>
            </div>
            <div className="bg-primary/20 border border-primary-light/30 rounded-2xl p-6 space-y-4">
              <div className="w-12 h-12 bg-gold/10 text-gold rounded-xl flex items-center justify-center font-bold text-xl">📊</div>
              <h3 className="text-white font-bold text-lg">Mock Exams</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Full timed exam runs simulating strict test conditions. Detailed analytics pinpoint weak question patterns instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-primary/20 border-y border-primary-light/30 px-8 md:px-16">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="text-slate-400 text-sm">Choose the preparation level that matches your target band timeline.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-primary/45 border rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden ${
                  plan.popular ? 'border-gold shadow-gold/5' : 'border-primary-light/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-3 right-3 bg-gold text-primary text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div>
                  <h4 className="text-white font-bold text-base">{plan.name}</h4>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-white text-3xl font-extrabold">{plan.price}</span>
                    <span className="text-slate-500 text-xs">/month</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed">{plan.description}</p>
                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-emerald shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={plan.link}
                  className={`w-full mt-8 py-3 rounded-lg text-center font-bold text-xs transition-all duration-200 block ${
                    plan.popular
                      ? 'bg-gold hover:bg-gold-dark text-primary shadow-lg shadow-gold/25'
                      : 'bg-primary-light/35 border border-primary-light/80 hover:border-gold text-slate-200 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-8 md:px-16">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">Everything you need to know about preparing on BandUp IELTS.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="bg-primary/20 border border-primary-light/30 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white focus:outline-none transition-colors duration-200 hover:bg-primary-light/10"
                  >
                    <span>{faq.q}</span>
                    <svg className={`w-4 h-4 text-gold transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-primary-light/10 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-primary-light/30 text-center text-xs text-slate-500 bg-primary/10">
        <p>&copy; {new Date().getFullYear()} BandUp IELTS PrepPro. All rights reserved.</p>
        <p className="mt-2 text-[10px] text-slate-600">Disclaimer: IELTS is a registered trademark of University of Cambridge ESOL, the British Council, and IDP Education Australia. This platform is not endorsed by them.</p>
      </footer>
    </div>
  );
}
