import 'dart:async';
import '../models/language_ai_models.dart';

class LanguageAIService {
  static LanguageProfile profile = LanguageProfile(
    nativeLanguage: 'English',
    targetLanguage: 'Spanish',
    cefrLevel: 'B1',
    goal: 'Career Advancement',
    dailyMinutes: 20,
    studyStreak: 7,
    isOnboarded: true,
  );

  static final List<Scenario> presetScenarios = [
    Scenario(
      id: 'job-interview-tech',
      title: 'Senior Tech Job Interview',
      category: 'BUSINESS',
      cefrLevel: 'B2',
      description: 'Simulate a high-stakes software engineering job interview at a tech hub in Madrid.',
      tutorPersona: TutorPersona(
        name: 'Sofia Ramirez',
        role: 'Head of Tech Talent',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        greeting: '¡Hola! Bienvenido a la entrevista. Cuéntame sobre tu experiencia en arquitectura de software.',
      ),
      keyVocabulary: ['Desarrollo de software', 'Arquitectura de sistemas', 'Resolución de problemas'],
      culturalNote: 'Starting with polite small talk ("¿Cómo estuvo tu día?") builds immediate rapport in Spanish business.',
    ),
    Scenario(
      id: 'tapas-bar-order',
      title: 'Ordering Tapas & Wine',
      category: 'DINING',
      cefrLevel: 'A2',
      description: 'Order authentic regional tapas, ask about ingredients, and request the check in Barcelona.',
      tutorPersona: TutorPersona(
        name: 'Mateo Garcia',
        role: 'Tapas Bar Owner',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
        greeting: '¡Buenas noches! Bienvenidos. ¿Tienen mesa reservada o prefieren en la barra?',
      ),
      keyVocabulary: ['La cuenta, por favor', 'Recomendación de la casa', 'Vino tinto'],
      culturalNote: 'Requesting "La cuenta, por favor" when ready is expected; servers won\'t rush guests with early checks.',
    ),
  ];

  static final List<MistakeRecord> mistakes = [
    MistakeRecord(
      id: 'm-1',
      category: 'GRAMMAR',
      originalPhrase: 'Yo ir a la supermercado ayer por la tarde.',
      correctedPhrase: 'Yo fui al supermercado ayer por la tarde.',
      explanation: 'Used infinitive "ir" instead of preterite past tense "fui", and missed contraction "a + el = al".',
      recurrenceCount: 4,
      masteryLevel: 42,
      lastMade: '2 hours ago',
    ),
    MistakeRecord(
      id: 'm-2',
      category: 'VOCABULARY',
      originalPhrase: 'Estoy muy emocionado porque el examen fue difícil.',
      correctedPhrase: 'Estoy muy preocupado porque el examen fue difícil.',
      explanation: '"Emocionado" means excited, not emotional or worried. Use "preocupado" for anxiety.',
      recurrenceCount: 3,
      masteryLevel: 58,
      lastMade: 'Yesterday',
    ),
  ];

  static Future<Map<String, dynamic>> simulateAITurn(Scenario scenario, String userMessage) async {
    await Future.delayed(const Duration(milliseconds: 1000));

    final lower = userMessage.toLowerCase();
    final hasGrammarMistake = lower.contains('yo ir') || lower.contains('una coche');

    final responseText = scenario.id == 'job-interview-tech'
        ? 'Excelente. Me alegra escuchar sobre tu trayectoria. ¿Nos podrías contar sobre un proyecto desafiante?'
        : '¡Excelente elección! Tenemos tapas muy recomendadas hoy. ¿Le gustaría una copa de vino tinto?';

    final feedback = CoachingFeedback(
      pronunciationScore: 88,
      mispronouncedWords: [
        {'word': 'arquitectura', 'expectedPhonetic': 'ar-ki-tek-TU-ra', 'actualPhonetic': 'ar-chi-tek-TU-ra'}
      ],
      grammarCorrections: hasGrammarMistake
          ? [
              {
                'original': userMessage,
                'corrected': userMessage.replaceAll('yo ir', 'yo fui').replaceAll('una coche', 'un coche'),
                'explanation': 'Conjugate verbs into preterite past tense (fui instead of ir) and maintain gender agreement (un coche).'
              }
            ]
          : [],
      vocabularyUpgrades: [
        {'word': 'bueno', 'upgrade': 'sobresaliente / excepcional', 'context': 'Elevates formal business presentation.'}
      ],
      culturalTip: scenario.culturalNote,
    );

    return {
      'responseText': responseText,
      'feedback': feedback,
    };
  }
}
