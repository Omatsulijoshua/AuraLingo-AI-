import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/localization.dart';
import 'subscription_screen.dart';
import 'support_screen.dart';
import 'referrals_screen.dart';
import 'history_screen.dart';
import 'login_screen.dart';
import 'progress_report_screen.dart';
import 'subscription_history_screen.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final ApiService _apiService = ApiService();
  bool _notifications = true;
  String _preferredLanguage = 'EN';
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _preferredLanguage = LocalizationService.currentLocale;
    _loadNotificationPreference();
  }

  Future<void> _loadNotificationPreference() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _notifications = prefs.getBool('notifications_enabled') ?? true;
    });
  }

  Future<void> _saveNotificationPreference(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_enabled', value);
    setState(() {
      _notifications = value;
    });
  }

  void _showRateAppDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: const Color(0xFFF8FAFC),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // IELTS Prep Logo
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: const Color(0xFFC62828),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('IELTS', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w900, height: 1.0)),
                        Text('Prep', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, height: 1.0)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Enjoying IELTS?',
                  style: TextStyle(color: Color(0xFF0F172A), fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Tap a star to rate it on the App Store.',
                  style: TextStyle(color: Colors.black54, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    return GestureDetector(
                      onTap: () {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Thank you for rating!')),
                        );
                      },
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 4.0),
                        child: Icon(Icons.star_outline_rounded, color: Colors.blueAccent, size: 36),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 24),
                const Divider(height: 1),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Not Now', style: TextStyle(color: Colors.blueAccent, fontSize: 14, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _t(String key) => LocalizationService.translate(key);

  Future<void> _updateSettings({
    String? examType,
    double? targetBand,
    String? language,
  }) async {
    setState(() => _isSaving = true);
    try {
      final user = ref.read(authProvider).user;
      final payload = {
        'targetExam': examType ?? user?['targetExam'],
        'targetBand': targetBand ?? user?['targetBand'],
        'preferredLanguage': language ?? user?['preferredLanguage'] ?? 'EN',
      };

      await _apiService.request(
        path: '/auth/onboarding',
        method: 'PUT',
        body: jsonEncode(payload),
      );

      // Refresh authentication profile
      await ref.read(authProvider.notifier).fetchProfile();
    } catch (e) {
      debugPrint('Failed to save settings: $e');
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final targetExam = user?['targetExam'] ?? 'ACADEMIC';
    final targetBand = (user?['targetBand'] ?? 7.0) as double;

    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        title: Text(_t('menu_settings'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Profile Card with Name, Email & Account ID Badge
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E3E6E)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user?['name'] ?? 'Student Name',
                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user?['email'] ?? 'student@example.com',
                    style: const TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF050E1A),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF152A4A)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            'ID: ${user?['id'] ?? ''}',
                            style: const TextStyle(color: Colors.white70, fontSize: 9, fontFamily: 'monospace'),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            if (user?['id'] != null) {
                              Clipboard.setData(ClipboardData(text: user?['id'] ?? ''));
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('ID copied to clipboard!')),
                              );
                            }
                          },
                          child: const Text(
                            'Copy',
                            style: TextStyle(color: Color(0xFFD4AF37), fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Plan Widget Banner
            (() {
              final List subscriptions = user?['subscriptions'] as List? ?? [];
              final dynamic activeSub = subscriptions.firstWhere(
                (sub) => sub['status'] == 'ACTIVE',
                orElse: () => null,
              );
              final bool hasActiveSub = activeSub != null;
              final String planName = hasActiveSub ? (activeSub['plan']?['name'] ?? 'Premium Plan') : _t('free_plan');
              
              String planSubtitle = hasActiveSub ? 'Full premium access active' : _t('upgrade_plan');
              if (hasActiveSub && activeSub['endDate'] != null) {
                try {
                  final expiry = DateTime.parse(activeSub['endDate']);
                  final days = expiry.difference(DateTime.now()).inDays;
                  final formattedDate = '${expiry.day}/${expiry.month}/${expiry.year}';
                  planSubtitle = 'Expires on $formattedDate ($days days remaining)';
                } catch (_) {}
              }

              return Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF0B1E36),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF1E3E6E)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: Color(0xFF152A4A),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        hasActiveSub ? Icons.verified_rounded : Icons.lock_open,
                        color: const Color(0xFFD4AF37),
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(planName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                          const SizedBox(height: 4),
                          Text(planSubtitle, style: const TextStyle(color: Colors.white54, fontSize: 11)),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const SubscriptionScreen()));
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD4AF37),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                      child: Text(
                        hasActiveSub ? 'Manage' : _t('upgrade'),
                        style: const TextStyle(color: Color(0xFF050E1A), fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              );
            })(),
            const SizedBox(height: 24),

            // General Settings
            const Text('GENERAL', style: TextStyle(color: Colors.white30, fontSize: 10, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E3E6E)),
              ),
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('Notifications', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                    subtitle: Text(_t('daily_reminders'), style: const TextStyle(color: Colors.white38, fontSize: 10)),
                    value: _notifications,
                    activeColor: const Color(0xFFD4AF37),
                    onChanged: (val) {
                      _saveNotificationPreference(val);
                    },
                  ),
                  const Divider(color: Color(0xFF1E3E6E), height: 1),
                  ListTile(
                    title: const Text('App Language', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                    subtitle: const Text('Select layout language switcher', style: TextStyle(color: Colors.white38, fontSize: 10)),
                    trailing: DropdownButton<String>(
                      value: _preferredLanguage,
                      underline: const SizedBox(),
                      dropdownColor: const Color(0xFF0B1E36),
                      items: LocalizationService.languagesList.map((lang) {
                        return DropdownMenuItem<String>(
                          value: lang['code'],
                          child: Text(lang['name'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 12)),
                        );
                      }).toList(),
                      onChanged: (val) async {
                        if (val != null) {
                          await LocalizationService.setLocale(val);
                          setState(() => _preferredLanguage = val);
                          _updateSettings(language: val);
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),

            // My Account Section
            const Text('MY ACCOUNT', style: TextStyle(color: Colors.white30, fontSize: 10, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E3E6E)),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.analytics, color: Color(0xFFD4AF37), size: 20),
                    title: const Text('AI Progress Report', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                    trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 14),
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const ProgressReportScreen()));
                    },
                  ),
                  const Divider(color: Color(0xFF1E3E6E), height: 1),
                  ListTile(
                    leading: const Icon(Icons.history, color: Color(0xFFD4AF37), size: 20),
                    title: const Text('Attempt History', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                    trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 14),
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const HistoryScreen()));
                    },
                  ),
                  const Divider(color: Color(0xFF1E3E6E), height: 1),
                  ListTile(
                    leading: const Icon(Icons.share, color: Color(0xFFD4AF37), size: 20),
                    title: const Text('Referral Program', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                    trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 14),
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const ReferralsScreen()));
                    },
                  ),
                  const Divider(color: Color(0xFF1E3E6E), height: 1),
                  ListTile(
                    leading: const Icon(Icons.credit_card, color: Color(0xFFD4AF37), size: 20),
                    title: const Text('Billing History', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                    trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 14),
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const SubscriptionHistoryScreen()));
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Study Settings
            const Text('STUDY', style: TextStyle(color: Colors.white30, fontSize: 10, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E3E6E)),
              ),
              child: Column(
                children: [
                  ListTile(
                    title: Text(_t('exam_type'), style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                    trailing: DropdownButton<String>(
                      value: targetExam,
                      underline: const SizedBox(),
                      dropdownColor: const Color(0xFF0B1E36),
                      items: const [
                        DropdownMenuItem(value: 'ACADEMIC', child: Text('Academic', style: TextStyle(color: Colors.white, fontSize: 12))),
                        DropdownMenuItem(value: 'GENERAL', child: Text('General Training', style: TextStyle(color: Colors.white, fontSize: 12))),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          _updateSettings(examType: val);
                        }
                      },
                    ),
                  ),
                  const Divider(color: Color(0xFF1E3E6E), height: 1),
                  ListTile(
                    title: Text(_t('target_band'), style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                    trailing: DropdownButton<double>(
                      value: targetBand,
                      underline: const SizedBox(),
                      dropdownColor: const Color(0xFF0B1E36),
                      items: [5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5].map((double band) {
                        return DropdownMenuItem<double>(
                          value: band,
                          child: Text('Band $band', style: const TextStyle(color: Colors.white, fontSize: 12)),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          _updateSettings(targetBand: val);
                        }
                      },
                    ),
                  ),
                  const Divider(color: Color(0xFF1E3E6E), height: 1),
                  ListTile(
                    title: Text(_t('reset_plan'), style: const TextStyle(color: Colors.orangeAccent, fontSize: 13, fontWeight: FontWeight.w600)),
                    trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 14),
                    onTap: () {
                      _updateSettings(examType: 'ACADEMIC', targetBand: 7.0);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Study plan schedule recalculated successfully!')),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Support Settings
            const Text('SUPPORT', style: TextStyle(color: Colors.white30, fontSize: 10, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E3E6E)),
              ),
              child: Column(
                children: [
                  _buildSupportItem(_t('send_feedback'), Icons.mail, () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const SupportScreen()));
                  }),
                  const Divider(color: Color(0xFF1E3E6E), height: 1),
                  _buildSupportItem(_t('rate_app'), Icons.star, () {
                    _showRateAppDialog();
                  }),
                  const Divider(color: Color(0xFF1E3E6E), height: 1),
                  _buildSupportItem(_t('privacy_policy'), Icons.security, () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Privacy Policy loaded successfully.')),
                    );
                  }),
                  const Divider(color: Color(0xFF1E3E6E), height: 1),
                  _buildSupportItem(_t('terms_of_use'), Icons.description, () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Terms of Use loaded successfully.')),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Session Settings
            const Text('SESSION', style: TextStyle(color: Colors.white30, fontSize: 10, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E3E6E)),
              ),
              child: ListTile(
                leading: const Icon(Icons.logout_rounded, color: Colors.redAccent, size: 20),
                title: const Text('Log Out', style: TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 14),
                onTap: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) {
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (route) => false,
                    );
                  }
                },
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSupportItem(String title, IconData icon, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFFD4AF37), size: 20),
      title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 14),
      onTap: onTap,
    );
  }
}
