class LanguageProfile {
  String nativeLanguage;
  String targetLanguage;
  String cefrLevel;
  String goal;
  int dailyMinutes;
  int studyStreak;
  bool isOnboarded;

  LanguageProfile({
    required this.nativeLanguage,
    required this.targetLanguage,
    required this.cefrLevel,
    required this.goal,
    required this.dailyMinutes,
    required this.studyStreak,
    required this.isOnboarded,
  });
}

class TutorPersona {
  final String name;
  final String role;
  final String avatarUrl;
  final String greeting;

  TutorPersona({
    required this.name,
    required this.role,
    required this.avatarUrl,
    required this.greeting,
  });
}

class Scenario {
  final String id;
  final String title;
  final String category;
  final String cefrLevel;
  final String description;
  final TutorPersona tutorPersona;
  final List<String> keyVocabulary;
  final String culturalNote;

  Scenario({
    required this.id,
    required this.title,
    required this.category,
    required this.cefrLevel,
    required this.description,
    required this.tutorPersona,
    required this.keyVocabulary,
    required this.culturalNote,
  });
}

class CoachingFeedback {
  final int pronunciationScore;
  final List<Map<String, String>> mispronouncedWords;
  final List<Map<String, String>> grammarCorrections;
  final List<Map<String, String>> vocabularyUpgrades;
  final String culturalTip;

  CoachingFeedback({
    required this.pronunciationScore,
    required this.mispronouncedWords,
    required this.grammarCorrections,
    required this.vocabularyUpgrades,
    required this.culturalTip,
  });
}

class ConversationTurn {
  final String id;
  final String sender; // USER or AI_TUTOR
  final String text;
  final String timestamp;
  final CoachingFeedback? feedback;

  ConversationTurn({
    required this.id,
    required this.sender,
    required this.text,
    required this.timestamp,
    this.feedback,
  });
}

class MistakeRecord {
  final String id;
  final String category;
  final String originalPhrase;
  final String correctedPhrase;
  final String explanation;
  final int recurrenceCount;
  final int masteryLevel;
  final String lastMade;

  MistakeRecord({
    required this.id,
    required this.category,
    required this.originalPhrase,
    required this.correctedPhrase,
    required this.explanation,
    required this.recurrenceCount,
    required this.masteryLevel,
    required this.lastMade,
  });
}

class DynamicExercise {
  final String id;
  final String type; // MULTIPLE_CHOICE, FILL_IN_BLANK, PRONUNCIATION_MIMIC
  final String question;
  final String contextPhrase;
  final List<String>? options;
  final String correctAnswer;
  final String explanation;

  DynamicExercise({
    required this.id,
    required this.type,
    required this.question,
    required this.contextPhrase,
    this.options,
    required this.correctAnswer,
    required this.explanation,
  });
}
