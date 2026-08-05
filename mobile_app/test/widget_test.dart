import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/main.dart';

void main() {
  testWidgets('AuraLingoApp initializes test', (WidgetTester tester) async {
    await tester.pumpWidget(const AuraLingoApp());
    expect(find.text('AuraLingo AI'), findsWidgets);
  });
}
