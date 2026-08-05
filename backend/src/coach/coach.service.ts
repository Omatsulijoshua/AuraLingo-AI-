import { Injectable } from '@nestjs/common';

export class OnboardDto {
  nativeLanguage: string;
  targetLanguage: string;
  cefrLevel: string;
  goal: string;
  dailyMinutes: number;
}

export class ConversationTurnDto {
  scenarioId: string;
  userMessage: string;
}

@Injectable()
export class CoachService {
  async getProfile(userId: string) {
    return {
      userId,
      nativeLanguage: 'English',
      targetLanguage: 'Spanish',
      cefrLevel: 'B1',
      goal: 'CAREER',
      dailyMinutes: 20,
      studyStreak: 7,
      isOnboarded: true,
    };
  }

  async saveProfile(userId: string, dto: OnboardDto) {
    return {
      userId,
      ...dto,
      studyStreak: 7,
      isOnboarded: true,
      updatedAt: new Date().toISOString(),
    };
  }

  async processTurn(userId: string, dto: ConversationTurnDto) {
    const lower = (dto.userMessage || '').toLowerCase();
    const hasGrammarMistake = lower.includes('yo ir') || lower.includes('yo tener') || lower.includes('una coche');

    const responseText = dto.scenarioId === 'job-interview-tech'
      ? 'Excelente. Me alegra escuchar sobre tu trayectoria. ¿Nos podrías contar sobre un proyecto desafiante en el que lideraste la arquitectura del sistema?'
      : '¡Excelente elección! Tenemos tapas muy recomendadas hoy. ¿Le gustaría una copa de vino tinto?';

    const feedback = {
      pronunciationScore: 89,
      mispronouncedWords: [
        { word: 'arquitectura', expectedPhonetic: 'ar-ki-tek-TU-ra', actualPhonetic: 'ar-chi-tek-TU-ra' }
      ],
      grammarCorrections: hasGrammarMistake
        ? [
            {
              original: dto.userMessage,
              corrected: dto.userMessage.replace('yo ir', 'yo fui').replace('una coche', 'un coche'),
              explanation: 'Always conjugate verbs into preterite past tense (fui instead of ir) and use masculine articles (un coche).'
            }
          ]
        : [],
      vocabularyUpgrades: [
        { word: 'bueno', upgrade: 'excepcional / sobresaliente', context: 'Elevates your formal business pitch.' }
      ],
      culturalTip: 'In Spanish business meetings, initiating polite small talk before technical details builds professional trust.'
    };

    return {
      turnId: `turn-${Date.now()}`,
      responseText,
      feedback,
      timestamp: new Date().toISOString()
    };
  }
}
