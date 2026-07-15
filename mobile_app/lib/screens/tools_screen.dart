import 'package:flutter/material.dart';
import '../services/localization.dart';
import 'essay_checker_screen.dart';
import 'grammar_checker_screen.dart';
import 'paraphrase_screen.dart';
import 'vocabulary_builder_screen.dart';
import 'speaking_practice_screen.dart';
import 'writing_practice_screen.dart';
import 'mock_exams_screen.dart';

class ToolsScreen extends StatefulWidget {
  const ToolsScreen({super.key});

  @override
  State<ToolsScreen> createState() => _ToolsScreenState();
}

class _ToolsScreenState extends State<ToolsScreen> {
  // Band Calculator input variables
  double _listeningScore = 6.0;
  double _readingScore = 6.0;
  double _writingScore = 6.0;
  double _speakingScore = 6.0;
  double _overallBand = 6.0;

  void _calculateOverall() {
    final double avg = (_listeningScore + _readingScore + _writingScore + _speakingScore) / 4.0;
    // IELTS Rounding Rules: round to nearest half band
    final double fraction = avg - avg.toInt();
    double rounded = avg.toInt().toDouble();
    if (fraction >= 0.75) {
      rounded += 1.0;
    } else if (fraction >= 0.25) {
      rounded += 0.5;
    }
    setState(() {
      _overallBand = rounded;
    });
  }

  String _t(String key) => LocalizationService.translate(key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        toolbarHeight: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title Header Section
              const Text(
                'AI Tools',
                style: TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Powerful tools to boost your IELTS preparation',
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 28),

              // AI Analysis Header
              const Text(
                'AI Analysis',
                style: TextStyle(
                  color: Color(0xFF475569),
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),

              // 2-Column Grid for AI Analysis
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.95,
                children: [
                  _buildGridToolCard(
                    'Essay Checker',
                    'Get AI band score\n& feedback',
                    Icons.description_outlined,
                    const Color(0xFF9333EA), // Purple
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const EssayCheckerScreen()),
                      );
                    },
                  ),
                  _buildGridToolCard(
                    'Grammar Check',
                    'Find & fix grammar\nerrors',
                    Icons.verified_outlined,
                    const Color(0xFFD97706), // Orange
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const GrammarCheckerScreen()),
                      );
                    },
                  ),
                  _buildGridToolCard(
                    'Paraphrase',
                    'Rewrite sentences\n3 ways',
                    Icons.sync,
                    const Color(0xFF2563EB), // Blue
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ParaphraseScreen()),
                      );
                    },
                  ),
                  _buildGridToolCard(
                    'Vocabulary',
                    'Build IELTS\nvocabulary',
                    Icons.menu_book_outlined,
                    const Color(0xFF059669), // Green
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const VocabularyBuilderScreen()),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // AI Sample Generators Header
              const Text(
                'AI Sample Generators',
                style: TextStyle(
                  color: Color(0xFF475569),
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),

              // 2-Column Grid for Sample Generators
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.95,
                children: [
                  _buildGridToolCard(
                    'Speaking Samples',
                    'Band 9 answers for\nPart 1-3',
                    Icons.mic_none_outlined,
                    const Color(0xFF0891B2), // Cyan
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const SpeakingPracticeScreen()),
                      );
                    },
                  ),
                  _buildGridToolCard(
                    'Writing Samples',
                    'Band 9 essays &\nreports',
                    Icons.edit_outlined,
                    const Color(0xFFDB2777), // Pink
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const WritingPracticeScreen()),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Exam Simulation Header
              const Text(
                'Exam Simulation',
                style: TextStyle(
                  color: Color(0xFF475569),
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),

              // Mock Exam Card
              Container(
                margin: const EdgeInsets.only(bottom: 28),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.15),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const MockExamsScreen()),
                      );
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFD4AF37).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(
                                  Icons.assignment_turned_in_rounded,
                                  color: Color(0xFFD4AF37),
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Timed Mock Exam',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    SizedBox(height: 2),
                                    Text(
                                      'Real IELTS Conditions',
                                      style: TextStyle(
                                        color: Color(0xFFD4AF37),
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.arrow_forward_ios,
                                color: Colors.white54,
                                size: 14,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Complete a full 3-hour practice simulation of the Listening, Reading, Writing, and Speaking modules with overall band grading.',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // Band Calculator / Utilities
              const Text(
                'Utilities',
                style: TextStyle(
                  color: Color(0xFF475569),
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),

              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 10,
                      spreadRadius: 1,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.calculate_outlined, color: Color(0xFFC62828), size: 24),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _t('band_calculator'),
                                style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _t('band_calculator_desc'),
                                style: const TextStyle(color: Color(0xFF64748B), fontSize: 10),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Overall result display
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF4F6FB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFC62828).withValues(alpha: 0.2)),
                      ),
                      child: Column(
                        children: [
                          const Text('Calculated Overall Band', style: TextStyle(color: Color(0xFF64748B), fontSize: 10)),
                          const SizedBox(height: 4),
                          Text(
                            '$_overallBand',
                            style: const TextStyle(color: Color(0xFFC62828), fontSize: 32, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Score sliders
                    _buildScoreSelector('Listening', _listeningScore, (val) {
                      setState(() => _listeningScore = val);
                      _calculateOverall();
                    }),
                    _buildScoreSelector('Reading', _readingScore, (val) {
                      setState(() => _readingScore = val);
                      _calculateOverall();
                    }),
                    _buildScoreSelector('Writing', _writingScore, (val) {
                      setState(() => _writingScore = val);
                      _calculateOverall();
                    }),
                    _buildScoreSelector('Speaking', _speakingScore, (val) {
                      setState(() => _speakingScore = val);
                      _calculateOverall();
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGridToolCard(
    String title,
    String desc,
    IconData icon,
    Color accentColor, {
    VoidCallback? onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            spreadRadius: 1,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top circle icon badge
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: accentColor, size: 20),
                ),
                const SizedBox(height: 12),
                // Title
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                // Description
                Expanded(
                  child: Text(
                    desc,
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 10,
                      height: 1.3,
                    ),
                  ),
                ),
                // Bottom right arrow button container
                Align(
                  alignment: Alignment.bottomRight,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: const Color(0xFFC62828).withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.arrow_forward,
                      color: Color(0xFFC62828),
                      size: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildScoreSelector(String label, double val, ValueChanged<double> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(label, style: const TextStyle(color: Color(0xFF475569), fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          Expanded(
            child: Slider(
              value: val,
              min: 4.0,
              max: 9.0,
              divisions: 10,
              label: val.toString(),
              activeColor: const Color(0xFFC62828),
              inactiveColor: const Color(0xFFCBD5E1),
              onChanged: onChanged,
            ),
          ),
          SizedBox(
            width: 30,
            child: Text(val.toString(), style: const TextStyle(color: Color(0xFFC62828), fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ],
      ),
    );
  }
}
