import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import 'writing_practice_screen.dart';
import 'listening_practice_screen.dart';
import 'reading_practice_screen.dart';
import 'speaking_practice_screen.dart';
import 'mock_exams_screen.dart';
import 'referrals_screen.dart';
import 'subscription_screen.dart';
import 'support_screen.dart';
import 'history_screen.dart';
import 'progress_report_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      backgroundColor: const Color(0xFF050E1A), // Deep Navy
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        title: const Text(
          'Student Dashboard',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline_rounded, color: Color(0xFFD4AF37)),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SupportScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Colors.white70),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Global Expiry/Upgrade Notification Bar
            (() {
              final subs = user?['subscriptions'] as List?;
              final Map<String, dynamic>? sub = (() {
                if (subs == null || subs.isEmpty) return null;
                final activeSub = subs.firstWhere(
                  (s) => s['status'] == 'ACTIVE',
                  orElse: () => subs[0],
                );
                return Map<String, dynamic>.from(activeSub);
              })();
              final planCode = sub != null ? (sub['plan']?['code'] ?? 'FREE') : 'FREE';
              
              if (planCode == 'FREE') {
                return GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SubscriptionScreen()),
                    );
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E1B10), // Amber tinted background
                      border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.3)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.stars_rounded, color: Color(0xFFD4AF37), size: 20),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            '✨ Upgrade to Premium for unlimited AI correction and mock tests! (Tap to Upgrade)',
                            style: TextStyle(color: Color(0xFFD4AF37), fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              } else if (sub != null && sub['endDate'] != null) {
                try {
                  final endDate = DateTime.parse(sub['endDate']);
                  final daysLeft = endDate.difference(DateTime.now()).inDays;
                  if (daysLeft >= 0 && daysLeft <= 3) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2D1616), // Red tinted background
                        border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              '⚠️ Your subscription expires in $daysLeft ${daysLeft == 1 ? 'day' : 'days'}! Renew now.',
                              style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    );
                  }
                } catch (_) {}
              }
              return const SizedBox.shrink();
            })(),

            // Welcome Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0B1E36), Color(0xFF1E3E6E)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E3E6E)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome back, ${user?['name'] ?? 'Student'}!',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Target Exam: ${user?['targetExam'] ?? 'ACADEMIC'}',
                    style: const TextStyle(
                      color: Color(0xFFD4AF37),
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: user?['id'] ?? ''));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Personal ID copied to clipboard!'),
                          backgroundColor: Color(0xFF0B1E36),
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'ID: ',
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
                          ),
                          Text(
                            user?['id'] ?? '',
                            style: const TextStyle(color: Colors.white70, fontSize: 10, fontFamily: 'monospace'),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.copy_rounded, color: Color(0xFFD4AF37), size: 10),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatItem(
                          'Target Band',
                          'Band ${(user?['targetBand'] ?? 7.0).toStringAsFixed(1)}',
                          onTap: () {
                            showModalBottomSheet(
                              context: context,
                              backgroundColor: const Color(0xFF0B1E36),
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                              ),
                              builder: (context) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      const Text(
                                        'Select Target Band Score',
                                        style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                        textAlign: TextAlign.center,
                                      ),
                                      const SizedBox(height: 16),
                                      SizedBox(
                                        height: 200,
                                        child: ListView(
                                          children: [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((band) {
                                            final isSelected = (user?['targetBand'] ?? 7.0).toString() == band.toString();
                                            return ListTile(
                                              title: Text(
                                                'Band $band',
                                                style: TextStyle(
                                                  color: isSelected ? const Color(0xFFD4AF37) : Colors.white,
                                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                                ),
                                                textAlign: TextAlign.center,
                                              ),
                                              onTap: () async {
                                                Navigator.pop(context);
                                                final success = await ref.read(authProvider.notifier).updateTargetBand(band);
                                                if (success) {
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    SnackBar(
                                                      content: Text('Target Band updated to $band!'),
                                                      backgroundColor: const Color(0xFF0B1E36),
                                                    ),
                                                  );
                                                }
                                              },
                                            );
                                          }).toList(),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            );
                          },
                        ),
                      ),
                      Expanded(
                        child: (() {
                          final progressStats = user?['progressStats'] as Map?;
                          final currentEstimate = progressStats != null ? (progressStats['overallBandEstimate'] ?? 0.0) : 0.0;
                          return _buildStatItem(
                            'Current Estimate',
                            currentEstimate > 0 ? 'Band ${currentEstimate.toStringAsFixed(1)}' : 'Band 0.0',
                          );
                        })(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: (() {
                          final progressStats = user?['progressStats'] as Map?;
                          final completedLessons = progressStats != null ? (progressStats['lessonsCompletedCount'] ?? 0) : 0;
                          return _buildStatItem(
                            'Completed Lessons',
                            '$completedLessons Lessons',
                          );
                        })(),
                      ),
                      Expanded(
                        child: (() {
                          final subs = user?['subscriptions'] as List?;
                          final Map<String, dynamic>? sub = (() {
                            if (subs == null || subs.isEmpty) return null;
                            final activeSub = subs.firstWhere(
                              (s) => s['status'] == 'ACTIVE',
                              orElse: () => subs[0],
                            );
                            return Map<String, dynamic>.from(activeSub);
                          })();
                          final planCode = sub != null ? (sub['plan']?['code'] ?? 'FREE') : 'FREE';

                          int diffDays = 0;
                          String expiryDate = '';
                          if (sub != null && sub['status'] == 'ACTIVE' && sub['endDate'] != null) {
                            final end = DateTime.tryParse(sub['endDate']);
                            if (end != null) {
                              diffDays = end.difference(DateTime.now()).inDays + 1;
                              expiryDate = _formatDate(end);
                            }
                          }

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Billing Status', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                              const SizedBox(height: 4),
                              Text(
                                planCode,
                                style: TextStyle(
                                  color: planCode == 'PREMIUM' ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (planCode == 'PREMIUM' && expiryDate.isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFF1E3E6E)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Text('DAYS LEFT: ', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 8, fontWeight: FontWeight.bold)),
                                          Text(
                                            '$diffDays Days',
                                            style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 9, fontWeight: FontWeight.w900),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Text('EXPIRES: ', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 8, fontWeight: FontWeight.bold)),
                                          Text(
                                            expiryDate,
                                            style: const TextStyle(color: Colors.white70, fontSize: 8, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          );
                        })(),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Quick Navigation Panel
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildQuickAction(context, 'Progress', Icons.insights_rounded, const ProgressReportScreen()),
                _buildQuickAction(context, 'History', Icons.history_rounded, const HistoryScreen()),
                _buildQuickAction(context, 'Referrals', Icons.card_giftcard_rounded, const ReferralsScreen()),
              ],
            ),
            const SizedBox(height: 32),

            const Text(
              'IELTS Practice Modules',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.35,
              children: [
                _buildModuleCard(context, 'Listening', Icons.headphones_rounded, const Color(0xFF3B82F6)),
                _buildModuleCard(context, 'Reading', Icons.menu_book_rounded, const Color(0xFF10B981)),
                _buildModuleCard(context, 'Writing', Icons.edit_note_rounded, const Color(0xFFF59E0B)),
                _buildModuleCard(context, 'Speaking', Icons.mic_external_on_rounded, Colors.purple),
              ],
            ),
            const SizedBox(height: 24),

            // Mock Exam Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.stars_rounded, color: Color(0xFFD4AF37), size: 36),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Full Mock Exam',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Simulate a timed 2.5-hour complete IELTS exam.',
                          style: TextStyle(color: Colors.white60, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const MockExamsScreen()));
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD4AF37),
                      foregroundColor: const Color(0xFF050E1A),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Start', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAction(BuildContext context, String label, IconData icon, Widget screen) {
    return Expanded(
      child: GestureDetector(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => screen)),
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF0B1E36),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF1E3E6E)),
          ),
          child: Column(
            children: [
              Icon(icon, color: const Color(0xFFD4AF37), size: 20),
              const SizedBox(height: 6),
              Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
          const SizedBox(height: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value,
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              if (onTap != null) ...[
                const SizedBox(width: 4),
                const Icon(Icons.arrow_drop_down_rounded, color: Color(0xFFD4AF37), size: 18),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildModuleCard(BuildContext context, String title, IconData icon, Color accentColor) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0B1E36),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E3E6E)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            if (title == 'Writing') {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const WritingPracticeScreen()));
            } else if (title == 'Listening') {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const ListeningPracticeScreen()));
            } else if (title == 'Reading') {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const ReadingPracticeScreen()));
            } else if (title == 'Speaking') {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const SpeakingPracticeScreen()));
            }
          },
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: accentColor, size: 28),
                ),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }
}
