import 'package:flutter/material.dart';

class PremiumPaywallSheet extends StatefulWidget {
  const PremiumPaywallSheet({super.key});

  @override
  State<PremiumPaywallSheet> createState() => _PremiumPaywallSheetState();
}

class _PremiumPaywallSheetState extends State<PremiumPaywallSheet> {
  int _selectedMonths = 12; // 12 or 1

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      padding: EdgeInsets.only(
        top: 16,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).padding.bottom + 16,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag Handle Indicator
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Red IELTS Logo
            Center(
              child: Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: const Color(0xFFC62828), // Deep Red
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Text(
                    'IELTS',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Title Text
            const Text(
              'Unlock your target IELTS Band Score',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF1E293B),
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),

            // Subscription Selection Container
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  // 12 Months Options
                  InkWell(
                    onTap: () => setState(() => _selectedMonths = 12),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(16),
                      topRight: Radius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      child: Row(
                        children: [
                          Container(
                            width: 22,
                            height: 22,
                            decoration: BoxDecoration(
                              color: _selectedMonths == 12 ? const Color(0xFFC62828) : Colors.transparent,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: _selectedMonths == 12 ? const Color(0xFFC62828) : const Color(0xFFCBD5E1),
                                width: 2,
                              ),
                            ),
                            child: _selectedMonths == 12
                                ? const Icon(Icons.check, color: Colors.white, size: 14)
                                : null,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Text(
                                      '12 Months',
                                      style: TextStyle(
                                        color: Color(0xFF1E293B),
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFC62828),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        '71%',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'Only ₦5,825.00/mo',
                                  style: TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Text(
                            '₦ 69,900.00',
                            style: TextStyle(
                              color: Color(0xFF1E293B),
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Divider(height: 1, color: Color(0xFFE2E8F0)),
                  // 1 Month Options
                  InkWell(
                    onTap: () => setState(() => _selectedMonths = 1),
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      child: Row(
                        children: [
                          Container(
                            width: 22,
                            height: 22,
                            decoration: BoxDecoration(
                              color: _selectedMonths == 1 ? const Color(0xFFC62828) : Colors.transparent,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: _selectedMonths == 1 ? const Color(0xFFC62828) : const Color(0xFFCBD5E1),
                                width: 2,
                              ),
                            ),
                            child: _selectedMonths == 1
                                ? const Icon(Icons.check, color: Colors.white, size: 14)
                                : null,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  '1 Month',
                                  style: TextStyle(
                                    color: Color(0xFF1E293B),
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'Only ₦19,900.00/mo',
                                  style: TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Text(
                            '₦ 19,900.00',
                            style: TextStyle(
                              color: Color(0xFF1E293B),
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // What's Included label
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4.0),
              child: Text(
                'WHAT\'S INCLUDED',
                style: TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const SizedBox(height: 8),

            // Features Card Container
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _buildFeatureItem(
                    icon: Icons.mic_none_rounded,
                    title: 'AI Speaking Practice',
                    description: 'Unlimited sessions with an AI examiner anytime. Get instant band scores on fluency, vocabulary, grammar, and pronunciation.',
                  ),
                  const Divider(height: 1, color: Color(0xFFE2E8F0)),
                  _buildFeatureItem(
                    icon: Icons.assignment_outlined,
                    title: '300+ Full Mock Tests',
                    description: 'Practice with real IELTS-style tests for all four skills — Reading, Listening, Writing, and Speaking.',
                  ),
                  const Divider(height: 1, color: Color(0xFFE2E8F0)),
                  _buildFeatureItem(
                    icon: Icons.draw_outlined,
                    title: 'AI Writing Correction',
                    description: 'Submit Task 1 or Task 2 essays and receive detailed band score feedback with grammar and coherence tips.',
                  ),
                  const Divider(height: 1, color: Color(0xFFE2E8F0)),
                  _buildFeatureItem(
                    icon: Icons.calendar_today_outlined,
                    title: 'Personalized Study Plan',
                    description: 'Your daily plan adapts to your current band score, weak skills, and exam date to keep you on track.',
                  ),
                  const Divider(height: 1, color: Color(0xFFE2E8F0)),
                  _buildFeatureItem(
                    icon: Icons.donut_large_rounded,
                    title: 'Band Score Progress Tracker',
                    description: 'Visualize your improvement over time with detailed performance charts across every IELTS skill.',
                    isLast: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Continue Button
            SizedBox(
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFC62828), // deep red
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: const Color(0xFF15803D),
                      content: Text(
                        'Thank you! Subscribing for $_selectedMonths ${_selectedMonths == 12 ? "Months" : "Month"}...',
                      ),
                    ),
                  );
                },
                child: const Text(
                  'Continue',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Footer actions row
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Purchases restored.')),
                    );
                  },
                  child: const Text(
                    'Restore Purchases',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                  ),
                ),
                const SizedBox(width: 4),
                const Text('|', style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 11)),
                const SizedBox(width: 4),
                TextButton(
                  onPressed: () {},
                  child: const Text(
                    'Terms',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                  ),
                ),
                const SizedBox(width: 4),
                const Text('|', style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 11)),
                const SizedBox(width: 4),
                TextButton(
                  onPressed: () {},
                  child: const Text(
                    'Privacy',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureItem({
    required IconData icon,
    required String title,
    required String description,
    bool isLast = false,
  }) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: const Color(0xFFC62828), // deep red background
              borderRadius: BorderRadius.circular(6),
            ),
            child: Center(
              child: Icon(
                icon,
                color: Colors.white,
                size: 14,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF1E293B),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 10,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

void showPremiumPaywall(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => const PremiumPaywallSheet(),
  );
}
