export interface LanguageProfile {
  nativeLanguage: string;
  targetLanguage: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  goal: 'CAREER' | 'RELOCATION' | 'TRAVEL' | 'EXAM_PREP' | 'DATING' | 'CASUAL';
  dailyMinutes: number;
  preference: 'VOICE_PRIORITY' | 'TEXT_PRIORITY' | 'BALANCED';
  studyStreak: number;
  isOnboarded: boolean;
  // Phase 2 Settings
  voiceEngine: 'WEB_SPEECH' | 'GEMINI_AUDIO' | 'ELEVENLABS_PRO';
  regionalAccent: string;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
}

export interface RegionalAccentOption {
  code: string;
  name: string;
  flag: string;
  language: string;
  elevenLabsSampleVoiceId: string;
}

export const REGIONAL_ACCENT_OPTIONS: RegionalAccentOption[] = [
  // Spanish
  { code: 'ES_MADRID', name: 'Castilian Spanish (Madrid)', flag: '🇪🇸', language: 'Spanish', elevenLabsSampleVoiceId: 'pNInz6obpgDQGcFmaJgB' },
  { code: 'ES_MEXICO', name: 'Mexican Spanish (Mexico City)', flag: '🇲🇽', language: 'Spanish', elevenLabsSampleVoiceId: 'ErXwobaYiN019PkySvjV' },
  { code: 'ES_ARGENTINA', name: 'Argentine Spanish (Buenos Aires)', flag: '🇦🇷', language: 'Spanish', elevenLabsSampleVoiceId: 'VR6AewLTigWG4xSOukaG' },
  
  // French
  { code: 'FR_PARIS', name: 'Parisian Standard French', flag: '🇫🇷', language: 'French', elevenLabsSampleVoiceId: 'XB0fDUnXU5powFXDhCwa' },
  { code: 'FR_QUEBEC', name: 'Québécois French (Montreal)', flag: '🇨🇦', language: 'French', elevenLabsSampleVoiceId: 'EXAVITQu4vr4xnSDxMaL' },

  // German
  { code: 'DE_BERLIN', name: 'Hochdeutsch German (Berlin)', flag: '🇩🇪', language: 'German', elevenLabsSampleVoiceId: '21m00Tcm4TlvDq8ikWAM' },
  { code: 'DE_VIENNA', name: 'Austrian German (Vienna)', flag: '🇦🇹', language: 'German', elevenLabsSampleVoiceId: 'AZnzlk1XvdvUeBnXmlld' },

  // English
  { code: 'EN_BRITISH', name: 'RP British English (London)', flag: '🇬🇧', language: 'English', elevenLabsSampleVoiceId: 'pFZP5JQG7iQjIQuC4Bku' },
  { code: 'EN_AMERICAN', name: 'General American English', flag: '🇺🇸', language: 'English', elevenLabsSampleVoiceId: '29vD33N1CtxCmqQRPOHJ' },
];

export interface CurriculumUnit {
  id: string;
  title: string;
  description: string;
  cefrLevel: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED';
  progressPercent: number;
  topics: string[];
  grammarFocus: string;
  keyScenarios: string[];
}

export interface Scenario {
  id: string;
  title: string;
  category: 'BUSINESS' | 'FOOD_DINING' | 'TRAVEL' | 'SOCIAL' | 'HOUSING' | 'EMERGENCY' | 'CUSTOM';
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  description: string;
  tutorPersona: {
    name: string;
    role: string;
    avatarUrl: string;
    greeting: string;
    elevenLabsVoiceId?: string;
  };
  keyVocabulary: string[];
  culturalNote: string;
  isCustom?: boolean;
}

export interface CoachingFeedback {
  pronunciationScore: number;
  mispronouncedWords: { word: string; expectedPhonetic: string; actualPhonetic: string }[];
  grammarCorrections: { original: string; corrected: string; explanation: string }[];
  vocabularyUpgrades: { word: string; upgrade: string; context: string }[];
  culturalTip?: string;
  confidenceScore: number;
}

export interface ConversationTurn {
  id: string;
  sender: 'USER' | 'AI_TUTOR';
  text: string;
  audioUrl?: string;
  timestamp: string;
  feedback?: CoachingFeedback;
}

export interface MistakeRecord {
  id: string;
  category: 'GRAMMAR' | 'VOCABULARY' | 'PRONUNCIATION' | 'SYNTAX' | 'CULTURAL_PRAGMATICS';
  originalPhrase: string;
  correctedPhrase: string;
  explanation: string;
  recurrenceCount: number;
  masteryLevel: number; // 0 to 100
  lastMade: string;
  targetLanguage: string;
}

export interface DynamicExercise {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'SENTENCE_RECONSTRUCTION' | 'PRONUNCIATION_MIMIC' | 'FILL_IN_BLANK';
  targetMistakeId?: string;
  question: string;
  contextPhrase?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

// Initial Mock Language Profile (Updated with Phase 2 defaults)
export const DEFAULT_LANGUAGE_PROFILE: LanguageProfile = {
  nativeLanguage: 'English',
  targetLanguage: 'Spanish',
  cefrLevel: 'B1',
  goal: 'CAREER',
  dailyMinutes: 20,
  preference: 'BALANCED',
  studyStreak: 7,
  isOnboarded: true,
  voiceEngine: 'WEB_SPEECH',
  regionalAccent: 'ES_MADRID',
  elevenLabsApiKey: '',
  elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB'
};

// Initial Scenarios
export const PRESET_SCENARIOS: Scenario[] = [
  {
    id: 'job-interview-tech',
    title: 'Senior Software Engineer Job Interview',
    category: 'BUSINESS',
    cefrLevel: 'B2',
    description: 'Simulate a high-stakes job interview at a top tech company in Madrid. Practice discussing your system design experience, leadership skills, and salary expectations.',
    tutorPersona: {
      name: 'Sofia Ramirez',
      role: 'Head of Engineering Talent',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      greeting: '¡Hola! Bienvenido a la entrevista. Cuéntame sobre tu experiencia profesional previa en desarrollo de software.',
      elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB'
    },
    keyVocabulary: ['Desarrollo de software', 'Arquitectura de sistemas', 'Trabajo en equipo', 'Resolución de problemas'],
    culturalNote: 'In Spanish business contexts, starting with polite small talk ("¿Cómo estuvo tu día?") establishes trust before diving into technical details.'
  },
  {
    id: 'tapas-bar-order',
    title: 'Ordering Tapas & Wine at a Local Bar',
    category: 'FOOD_DINING',
    cefrLevel: 'A2',
    description: 'Order authentic regional dishes, ask about ingredients, request dietary recommendations, and ask for the bill in Barcelona.',
    tutorPersona: {
      name: 'Mateo Garcia',
      role: 'Friendly Tapas Bar Owner',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      greeting: '¡Buenas noches! Bienvenidos. ¿Tienen mesa reservada o prefieren sentarse en la barra?',
      elevenLabsVoiceId: 'ErXwobaYiN019PkySvjV'
    },
    keyVocabulary: ['La cuenta, por favor', 'Recomendación de la casa', 'Sin gluten', 'Vino tinto'],
    culturalNote: 'Asking "La cuenta, por favor" when ready to leave is customary; waiters in Spain rarely bring the check unsolicited to avoid rushing guests.'
  },
  {
    id: 'renting-apartment',
    title: 'Negotiating an Apartment Rental',
    category: 'HOUSING',
    cefrLevel: 'B1',
    description: 'Speak with a landlord to inquire about lease terms, security deposit, utilities included, and pet rules in Valencia.',
    tutorPersona: {
      name: 'Carmen Delgado',
      role: 'Property Owner',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      greeting: 'Hola, buenas tardes. Gracias por venir a ver el piso. ¿Tienes alguna pregunta sobre el contrato de arrendamiento?',
      elevenLabsVoiceId: 'VR6AewLTigWG4xSOukaG'
    },
    keyVocabulary: ['Contrato de arrendamiento', 'Fianza', 'Gastos incluidos', 'Plazo de alquiler'],
    culturalNote: 'Confirming whether community fees ("gastos de comunidad") are included in the price is essential before signing rental contracts in Spain.'
  },
  {
    id: 'airport-lost-luggage',
    title: 'Reporting Lost Baggage at Airport',
    category: 'EMERGENCY',
    cefrLevel: 'A2',
    description: 'File a missing luggage report at the customer service desk in Bogota Airport.',
    tutorPersona: {
      name: 'Alejandro Morales',
      role: 'Airline Desk Agent',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      greeting: 'Buenas tardes, bienvenido al servicio al cliente. ¿En qué le puedo ayudar hoy?',
      elevenLabsVoiceId: 'ErXwobaYiN019PkySvjV'
    },
    keyVocabulary: ['Equipaje perdido', 'Número de vuelo', 'Reclamación', 'Descripción de la maleta'],
    culturalNote: 'Always state your flight number ("número de vuelo") and baggage tag code first to speed up tracking.'
  }
];

// Initial Sample Mistake Records
export const INITIAL_MISTAKE_RECORDS: MistakeRecord[] = [
  {
    id: 'm-1',
    category: 'GRAMMAR',
    originalPhrase: 'Yo ir a la supermercado ayer por la tarde.',
    correctedPhrase: 'Yo fui al supermercado ayer por la tarde.',
    explanation: 'Used infinitive "ir" instead of preterite past tense "fui", and missed the contraction "a + el = al".',
    recurrenceCount: 4,
    masteryLevel: 42,
    lastMade: '2 hours ago',
    targetLanguage: 'Spanish'
  },
  {
    id: 'm-2',
    category: 'VOCABULARY',
    originalPhrase: 'Estoy muy emocionado porque el examen fue difícil.',
    correctedPhrase: 'Estoy muy preocupado/nervioso porque el examen fue difícil.',
    explanation: '"Emocionado" means excited, not emotional or worried. Use "preocupado" or "estresado" for exam anxiety.',
    recurrenceCount: 3,
    masteryLevel: 58,
    lastMade: 'Yesterday',
    targetLanguage: 'Spanish'
  },
  {
    id: 'm-3',
    category: 'PRONUNCIATION',
    originalPhrase: 'Trabajo en desarrollo de software',
    correctedPhrase: 'Phonetic emphasis on "des-a-RRO-llo" (trilled rr sound).',
    explanation: 'Substituted English "r" sound instead of Spanish double "rr" trill in "desarrollo".',
    recurrenceCount: 5,
    masteryLevel: 30,
    lastMade: '3 days ago',
    targetLanguage: 'Spanish'
  },
  {
    id: 'm-4',
    category: 'SYNTAX',
    originalPhrase: 'Tiene una coche muy grande y azul.',
    correctedPhrase: 'Tiene un coche muy grande y azul.',
    explanation: '"Coche" (car) is a masculine noun requiring the article "un", not feminine "una".',
    recurrenceCount: 2,
    masteryLevel: 75,
    lastMade: '4 days ago',
    targetLanguage: 'Spanish'
  }
];

// Initial Curriculum Units
export const INITIAL_CURRICULUM: CurriculumUnit[] = [
  {
    id: 'unit-1',
    title: 'Unit 1: Professional Introductions & Elevating Career Discussions',
    description: 'Master introducing your professional background, pitching projects, and articulating tech achievements in Spanish.',
    cefrLevel: 'B1',
    status: 'IN_PROGRESS',
    progressPercent: 65,
    topics: ['Past tense narration (Preterite vs Imperfect)', 'Professional vocabulary', 'Subjunctive present introduced'],
    grammarFocus: 'Preterite / Imperfect Contrast & Direct Object Pronouns',
    keyScenarios: ['Job Interview at a Tech Company', 'Networking at an Innovation Summit']
  },
  {
    id: 'unit-2',
    title: 'Unit 2: Real-World Transactions & Social Interactions',
    description: 'Navigate housing leases, restaurant dining, bank accounts, and shopping without relying on English.',
    cefrLevel: 'B1',
    status: 'IN_PROGRESS',
    progressPercent: 30,
    topics: ['Indirect object pronouns', 'Polite requests (Conditional)', 'Food & Housing terms'],
    grammarFocus: 'Conditional Tense ("me gustaría", "¿podría?") & Gender Agreement',
    keyScenarios: ['Ordering Tapas & Wine', 'Negotiating Apartment Rental']
  },
  {
    id: 'unit-3',
    title: 'Unit 3: Persuasive Argumentation & Business Negotiations',
    description: 'Debate strategy, lead meetings, negotiate contracts, and express hypothetical scenarios smoothly.',
    cefrLevel: 'B2',
    status: 'LOCKED',
    progressPercent: 0,
    topics: ['Imperfect Subjunctive', 'Business idiom mastery', 'Contractual vocabulary'],
    grammarFocus: 'Present & Past Subjunctive in Complex Clauses',
    keyScenarios: ['Client Contract Negotiation', 'Quarterly Board Presentation']
  },
  {
    id: 'unit-4',
    title: 'Unit 4: Advanced Cultural Nuances & Pragmatics',
    description: 'Understand humor, regional slang (Spain vs Mexico vs Argentina), and complex literary/political commentary.',
    cefrLevel: 'C1',
    status: 'LOCKED',
    progressPercent: 0,
    topics: ['Regional slang variations', 'Double entendres & idioms', 'Advanced discourse markers'],
    grammarFocus: 'Subjunctive Tense Mastery & Discourse Connectors',
    keyScenarios: ['Impromptu Debate on Current Events', 'Cultural Media Review']
  }
];

// Helper class for LocalStorage Management
export class LanguageAIService {
  public static getProfile(): LanguageProfile {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE_PROFILE;
    const data = localStorage.getItem('lingua_profile');
    if (!data) {
      localStorage.setItem('lingua_profile', JSON.stringify(DEFAULT_LANGUAGE_PROFILE));
      return DEFAULT_LANGUAGE_PROFILE;
    }
    return JSON.parse(data);
  }

  public static saveProfile(profile: LanguageProfile): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lingua_profile', JSON.stringify(profile));
  }

  public static getMistakes(): MistakeRecord[] {
    if (typeof window === 'undefined') return INITIAL_MISTAKE_RECORDS;
    const data = localStorage.getItem('lingua_mistakes');
    if (!data) {
      localStorage.setItem('lingua_mistakes', JSON.stringify(INITIAL_MISTAKE_RECORDS));
      return INITIAL_MISTAKE_RECORDS;
    }
    return JSON.parse(data);
  }

  public static saveMistakes(mistakes: MistakeRecord[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lingua_mistakes', JSON.stringify(mistakes));
  }

  public static addMistake(mistake: Omit<MistakeRecord, 'id' | 'lastMade'>): MistakeRecord {
    const existing = this.getMistakes();
    const newRecord: MistakeRecord = {
      ...mistake,
      id: `m-${Date.now()}`,
      lastMade: 'Just now'
    };
    const updated = [newRecord, ...existing];
    this.saveMistakes(updated);
    return newRecord;
  }

  public static getCurriculum(): CurriculumUnit[] {
    if (typeof window === 'undefined') return INITIAL_CURRICULUM;
    const data = localStorage.getItem('lingua_curriculum');
    if (!data) {
      localStorage.setItem('lingua_curriculum', JSON.stringify(INITIAL_CURRICULUM));
      return INITIAL_CURRICULUM;
    }
    return JSON.parse(data);
  }

  public static saveCurriculum(curriculum: CurriculumUnit[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lingua_curriculum', JSON.stringify(curriculum));
  }

  public static generateExercisesFromMistakes(): DynamicExercise[] {
    const mistakes = this.getMistakes();
    if (mistakes.length === 0) {
      return [
        {
          id: 'ex-1',
          type: 'MULTIPLE_CHOICE',
          question: 'Select the correct past tense form in Spanish:',
          contextPhrase: 'Ayer yo ___ al mercado.',
          options: ['fui', 'ir', 'iba', 'vaya'],
          correctAnswer: 'fui',
          explanation: 'Preterite past tense of "ir" for "yo" is "fui".'
        }
      ];
    }

    return mistakes.map((m, idx) => {
      if (m.category === 'GRAMMAR' || m.category === 'SYNTAX') {
        return {
          id: `ex-${idx}-${m.id}`,
          type: 'MULTIPLE_CHOICE',
          targetMistakeId: m.id,
          question: `Fix your previous mistake: "${m.originalPhrase}"`,
          contextPhrase: `Original context: "${m.originalPhrase}"`,
          options: [
            m.correctedPhrase,
            m.originalPhrase,
            m.correctedPhrase.replace('un', 'una'),
            m.correctedPhrase.replace('fui', 'iba')
          ].sort(() => Math.random() - 0.5),
          correctAnswer: m.correctedPhrase,
          explanation: m.explanation
        };
      } else if (m.category === 'VOCABULARY') {
        return {
          id: `ex-${idx}-${m.id}`,
          type: 'FILL_IN_BLANK',
          targetMistakeId: m.id,
          question: `Which word correctly replaces the false friend in: "${m.originalPhrase}"?`,
          contextPhrase: m.explanation,
          correctAnswer: m.correctedPhrase.split(' ')[2] || 'preocupado',
          explanation: m.explanation
        };
      } else {
        return {
          id: `ex-${idx}-${m.id}`,
          type: 'PRONUNCIATION_MIMIC',
          targetMistakeId: m.id,
          question: `Practice speaking this phrase aloud with correct pronunciation:`,
          contextPhrase: m.originalPhrase,
          correctAnswer: m.correctedPhrase,
          explanation: m.explanation
        };
      }
    });
  }

  // Phase 2: Synthesize voice speech via ElevenLabs API or Web Speech API fallback
  public static async synthesizeElevenLabsAudio(
    text: string,
    voiceId: string = 'pNInz6obpgDQGcFmaJgB',
    apiKey?: string
  ): Promise<string | null> {
    if (!apiKey) return null;
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) return null;
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('ElevenLabs Audio Generation Error:', e);
      return null;
    }
  }

  // Simulate real-time AI Tutor reply with micro-coaching analysis
  public static async simulateAITutorTurn(
    scenario: Scenario,
    userMessage: string
  ): Promise<{ responseText: string; feedback: CoachingFeedback; audioUrl?: string }> {
    await new Promise((res) => setTimeout(res, 1200));

    const profile = this.getProfile();
    const lower = userMessage.toLowerCase();
    const hasGrammarMistake = lower.includes('yo ir') || lower.includes('yo tener') || lower.includes('una coche');

    let responseText = '';
    if (scenario.id === 'job-interview-tech') {
      responseText = `Excelente. Me alegra escuchar sobre tu trayectoria. ¿Nos podrías contar sobre un proyecto desafiante en el que lideraste la arquitectura del sistema y cómo resolviste los cuellos de botella?`;
    } else if (scenario.id === 'tapas-bar-order') {
      responseText = `¡Excelente elección! Tenemos jamón ibérico de bellota y patatas bravas muy recomendadas hoy. ¿Le gustaría también una copa de vino tinto de la casa?`;
    } else {
      responseText = `Entendido perfectamente. Cuéntame más detalles sobre tus requerimientos en ${scenario.title} para que pueda ofrecerte la mejor opción.`;
    }

    const feedback: CoachingFeedback = {
      pronunciationScore: Math.floor(Math.random() * 15) + 82, // 82 to 97%
      mispronouncedWords: [
        { word: 'arquitectura', expectedPhonetic: 'ar-ki-tek-TU-ra', actualPhonetic: 'ar-chi-tek-TU-ra' }
      ],
      grammarCorrections: hasGrammarMistake
        ? [
            {
              original: userMessage,
              corrected: userMessage.replace('yo ir', 'yo fui').replace('una coche', 'un coche'),
              explanation: 'Always conjugate verbs into tense (fui instead of ir) and maintain gender agreement (un coche).'
            }
          ]
        : [],
      vocabularyUpgrades: [
        { word: 'bueno', upgrade: 'excepcional / sobresaliente', context: 'Elevates your formal business pitch.' }
      ],
      culturalTip: scenario.culturalNote,
      confidenceScore: 94
    };

    if (hasGrammarMistake) {
      this.addMistake({
        category: 'GRAMMAR',
        originalPhrase: userMessage,
        correctedPhrase: userMessage.replace('yo ir', 'yo fui').replace('una coche', 'un coche'),
        explanation: 'Grammar conjugation and gender agreement error detected during live scenario.',
        recurrenceCount: 1,
        masteryLevel: 20,
        targetLanguage: 'Spanish'
      });
    }

    let audioUrl: string | undefined;
    if (profile.voiceEngine === 'ELEVENLABS_PRO' && profile.elevenLabsApiKey) {
      const generated = await this.synthesizeElevenLabsAudio(
        responseText,
        scenario.tutorPersona.elevenLabsVoiceId || profile.elevenLabsVoiceId,
        profile.elevenLabsApiKey
      );
      if (generated) audioUrl = generated;
    }

    return { responseText, feedback, audioUrl };
  }
}
