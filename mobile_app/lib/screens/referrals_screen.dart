import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';

class ReferralsScreen extends StatefulWidget {
  const ReferralsScreen({super.key});

  @override
  State<ReferralsScreen> createState() => _ReferralsScreenState();
}

class _ReferralsScreenState extends State<ReferralsScreen> {
  final ApiService _apiService = ApiService();
  bool _loading = true;
  dynamic _stats;

  // Text Controllers
  final TextEditingController _bankNameController = TextEditingController();
  final TextEditingController _accountNumberController = TextEditingController();
  final TextEditingController _accountNameController = TextEditingController();
  final TextEditingController _amountController = TextEditingController(text: '1000');

  bool _verifying = false;
  bool _withdrawing = false;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  @override
  void dispose() {
    _bankNameController.dispose();
    _accountNumberController.dispose();
    _accountNameController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _fetchStats() async {
    try {
      final response = await _apiService.request(path: '/referrals/stats', method: 'GET');
      if (response.statusCode == 200) {
        setState(() {
          _stats = jsonDecode(response.body);
          if (_stats['bankName'] != null) _bankNameController.text = _stats['bankName'];
          if (_stats['accountNumber'] != null) _accountNumberController.text = _stats['accountNumber'];
          if (_stats['accountName'] != null) _accountNameController.text = _stats['accountName'];
        });
      }
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _verifyDetails() async {
    setState(() => _verifying = true);
    try {
      final response = await _apiService.request(
        path: '/referrals/verify',
        method: 'POST',
        body: jsonEncode({
          'bankName': _bankNameController.text,
          'accountNumber': _accountNumberController.text,
          'accountName': _accountNameController.text,
        }),
      );
      if (response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Bank account verified successfully!')),
        );
        _fetchStats();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Verification failed: $e')),
      );
    } finally {
      setState(() => _verifying = false);
    }
  }

  Future<void> _requestWithdrawal() async {
    setState(() => _withdrawing = true);
    try {
      final response = await _apiService.request(
        path: '/referrals/withdraw',
        method: 'POST',
        body: jsonEncode({
          'amount': double.parse(_amountController.text),
        }),
      );
      if (response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Withdrawal request submitted! Processing in 24 hours.')),
        );
        _fetchStats();
      } else {
        final body = jsonDecode(response.body);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(body['message'] ?? 'Withdrawal failed')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Withdrawal failed: $e')),
      );
    } finally {
      setState(() => _withdrawing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final refLink = _stats != null && _stats['userId'] != null
        ? 'https://bandup-ielts.com/auth/register?ref=${_stats['userId']}'
        : 'https://bandup-ielts.com/auth/register?ref=your-id';

    return Scaffold(
      backgroundColor: const Color(0xFF050E1A), // Deep Navy
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        title: const Text('Referrals & Earnings', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Balance Card
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
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Referral Balance', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('₦${_stats?['referralBalance']?.toStringAsFixed(2) ?? '0.00'}', style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 24, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('Referred Students', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('${_stats?['totalReferralsCount'] ?? 0}', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Referral Link Copy Option
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: const Color(0xFF0B1E36), borderRadius: BorderRadius.circular(12)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Your Invite Link', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: Text(refLink, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11), overflow: TextOverflow.ellipsis),
                            ),
                            IconButton(
                              icon: const Icon(Icons.copy_rounded, color: Color(0xFFD4AF37)),
                              onPressed: () {
                                Clipboard.setData(ClipboardData(text: refLink));
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Referral link copied!')));
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Verification Form
                  const Text('Payout Bank Account Details', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _buildTextField(_bankNameController, 'Bank Name (e.g. Opay, Kuda)'),
                  const SizedBox(height: 10),
                  _buildTextField(_accountNumberController, 'Account Number'),
                  const SizedBox(height: 10),
                  _buildTextField(_accountNameController, 'Account Name'),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                    onPressed: _verifying ? null : _verifyDetails,
                    child: Text(_verifying ? 'Saving details...' : 'Save Bank Account', style: const TextStyle(color: Colors.black)),
                  ),
                  const SizedBox(height: 24),

                  // Request Withdrawal Form
                  if (_stats?['isReferralVerified'] == true) ...[
                    const Text('Request Payout', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.blue.withAlpha(25),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue.withAlpha(50)),
                      ),
                      child: const Text(
                        'ℹ️ Payout Schedule Notice: Payout requests are verified and paid on the 21st of every month. You can only request one payout at a time.',
                        style: TextStyle(color: Colors.blueAccent, fontSize: 10, height: 1.4),
                      ),
                    ),
                    _buildTextField(_amountController, 'Amount (₦)', keyboardType: TextInputType.number),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD4AF37)),
                      onPressed: _withdrawing ? null : _requestWithdrawal,
                      child: Text(_withdrawing ? 'Processing payout...' : 'Request Payout', style: const TextStyle(color: Colors.black)),
                    ),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.yellow.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                      child: const Text('⚠️ Save and verify your payout bank details above to enable withdrawals request.', style: TextStyle(color: Colors.yellowAccent, fontSize: 11)),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, {TextInputType keyboardType = TextInputType.text}) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white, fontSize: 13),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
        filled: true,
        fillColor: const Color(0xFF0B1E36),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF1E3E6E)),
        ),
      ),
    );
  }
}
