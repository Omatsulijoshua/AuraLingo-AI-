import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'subscription_history_screen.dart';
import 'dashboard_screen.dart';

class SubscriptionScreen extends StatefulWidget {
  final bool isRegisterFlow;
  const SubscriptionScreen({super.key, this.isRegisterFlow = false});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  final ApiService _apiService = ApiService();
  bool _loading = true;
  List<dynamic> _plans = [];
  dynamic _paymentInfo;
  String? _selectedPlanId;
  final TextEditingController _referenceController = TextEditingController();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _referenceController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final plansRes = await _apiService.request(path: '/subscriptions/plans', method: 'GET');
      final infoRes = await _apiService.request(path: '/subscriptions/payment-info', method: 'GET');

      if (plansRes.statusCode == 200 && infoRes.statusCode == 200) {
        final List<dynamic> allPlans = jsonDecode(plansRes.body);
        final dynamic paymentInfo = jsonDecode(infoRes.body);

        final prefs = await SharedPreferences.getInstance();
        final pendingPlan = prefs.getString('pendingOnboardingPlan');

        setState(() {
          _plans = allPlans.where((p) => p['code'] != 'FREE').toList();
          _paymentInfo = paymentInfo;
          
          if (_plans.isNotEmpty) {
            _selectedPlanId = _plans[0]['id'];
            if (pendingPlan != null) {
              final targetCode = pendingPlan == '12_MONTHS' ? 'PREMIUM' : 'PRO';
              for (final plan in _plans) {
                if (plan['code'] == targetCode) {
                  _selectedPlanId = plan['id'];
                  break;
                }
              }
            }
          }
        });
      }
    } catch (e) {
      debugPrint('Error loading subscription info: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _submitRequest() async {
    if (_selectedPlanId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a premium plan to continue.')),
      );
      return;
    }
    if (_referenceController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your transaction reference or sender account name.')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final response = await _apiService.request(
        path: '/subscriptions/manual-request',
        method: 'POST',
        body: jsonEncode({
          'planId': _selectedPlanId,
          'receiptUrl': _referenceController.text.trim(),
        }),
      );

      if (response.statusCode == 201) {
        if (!mounted) return;
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) {
            return AlertDialog(
              backgroundColor: const Color(0xFF0B1E36),
              title: const Text('Payment Submitted', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              content: const Text(
                'Proof of payment submitted successfully! Tutors will review and activate your account shortly.',
                style: TextStyle(color: Colors.white70),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context); // Pop dialog
                    if (widget.isRegisterFlow) {
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(builder: (_) => const DashboardScreen()),
                      );
                    } else {
                      Navigator.pop(context); // Pop screen
                    }
                  },
                  child: const Text('OK', style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      } else {
        final body = jsonDecode(response.body);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(body['message'] ?? 'Failed to submit request')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Submission failed: $e')),
      );
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        title: const Text('Upgrade Premium', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        leading: widget.isRegisterFlow
            ? const SizedBox()
            : IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
        actions: [
          if (widget.isRegisterFlow)
            TextButton(
              onPressed: () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const DashboardScreen()),
                );
              },
              child: const Text(
                'Skip',
                style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.history_rounded, color: Color(0xFFD4AF37)),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SubscriptionHistoryScreen()),
              );
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Choose Your Premium Plan',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  ..._plans.map((plan) {
                    final isSelected = _selectedPlanId == plan['id'];
                    final double price = double.tryParse(plan['price']?.toString() ?? '') ?? 0.0;
                    final features = plan['features'] as List?;

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedPlanId = plan['id'];
                        });
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF0B1E36) : const Color(0xFF071424),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? const Color(0xFFD4AF37) : const Color(0xFF1E3E6E),
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  plan['name'] ?? '',
                                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  '₦${price.toStringAsFixed(0)}',
                                  style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if (features != null)
                              ...features.map((feat) => Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 2),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 14),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            feat.toString(),
                                            style: const TextStyle(color: Colors.white70, fontSize: 12),
                                          ),
                                        ),
                                      ],
                                    ),
                                  )),
                          ],
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 24),
                  if (_paymentInfo != null) ...[
                    const Text(
                      'Payment Details',
                      style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B1E36),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF1E3E6E)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildDetailRow('Bank Name', _paymentInfo['bankName'] ?? ''),
                          const Divider(color: Color(0xFF1E3E6E), height: 20),
                          _buildDetailRow('Account Number', _paymentInfo['accountNumber'] ?? ''),
                          const Divider(color: Color(0xFF1E3E6E), height: 20),
                          _buildDetailRow('Account Name', _paymentInfo['accountName'] ?? ''),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Confirm Your Payment',
                      style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _referenceController,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      maxLines: 3,
                      decoration: InputDecoration(
                        labelText: 'Transaction Reference / Sender Details',
                        labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                        helperText: 'Paste transaction reference ID, or enter sender account name and payment date.',
                        helperStyle: const TextStyle(color: Colors.white38, fontSize: 10),
                        filled: true,
                        fillColor: const Color(0xFF0B1E36),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFF1E3E6E)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD4AF37),
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _submitting ? null : _submitRequest,
                      child: Text(
                        _submitting ? 'Submitting Details...' : 'Submit Payment Reference',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
