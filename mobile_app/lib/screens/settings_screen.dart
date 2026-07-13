import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/localization.dart';
import 'subscription_screen.dart';

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
            // Plan Widget Banner
            Container(
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
                    child: const Icon(Icons.lock_open, color: Color(0xFFD4AF37), size: 28),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_t('free_plan'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 4),
                        Text(_t('upgrade_plan'), style: const TextStyle(color: Colors.white54, fontSize: 11)),
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
                    child: Text(_t('upgrade'), style: const TextStyle(color: Color(0xFF050E1A), fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ],
              ),
            ),
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
                      setState(() => _notifications = val);
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
                  _buildSupportItem(_t('send_feedback'), Icons.mail),
                  const Divider(color: Color(0xFF1E3E6E), height: 1),
                  _buildSupportItem(_t('rate_app'), Icons.star),
                  const Divider(color: Color(0xFF1E3E6E), height: 1),
                  _buildSupportItem(_t('privacy_policy'), Icons.security),
                  const Divider(color: Color(0xFF1E3E6E), height: 1),
                  _buildSupportItem(_t('terms_of_use'), Icons.description),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSupportItem(String title, IconData icon) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFFD4AF37), size: 20),
      title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 14),
      onTap: () {},
    );
  }
}
