import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTwinStore, type TwinGender } from '../store/useTwinStore';
import { COLORS, FONTS } from '../utils/theme';
import { track } from '../lib/analytics';

// أسئلة نفسية مصممة علمياً
const QUESTIONS = [
  { id: 1, q: 'عندما تواجه مشكلة صعبة، كيف تتصرف عادةً؟', o: ['أحللها بهدوء', 'أثق بحدسي', 'أطلب المساعدة', 'أتجنبها مؤقتاً'] },
  { id: 2, q: 'ما هو أكثر شيء يمنحك الطاقة والإيجابية؟', o: ['تحقيق إنجاز', 'قضاء وقت مع الأحباء', 'اكتشاف شيء جديد', 'الراحة والاسترخاء'] },
  { id: 3, q: 'كيف تصف علاقاتك مع الأشخاص المقربين منك؟', o: ['مستقرة وداعمة', 'أحياناً أقلق من فقدانهم', 'أستمتع بها لكن أحتاج مساحتي', 'أفضل الاعتماد على نفسي'] },
  { id: 4, q: 'عندما تشعر بالحزن أو الضيق، ما هو أول شيء تفعله؟', o: ['أتحدث مع أحدهم', 'أبقى وحدي لأفكر', 'أشغل نفسي بشيء آخر', 'أبحث عن حل مباشر'] },
  { id: 5, q: 'ما هو أكبر حلم أو طموح تسعى لتحقيقه؟', o: ['النجاح المهني', 'السعادة العائلية', 'التأثير في العالم', 'تحقيق السلام الداخلي'] },
  { id: 6, q: 'كيف تفضل أن تقضي يومك المثالي؟', o: ['منجزاً ومليئاً بالمهام', 'مع العائلة والأصدقاء', 'أتعلم أو أقرأ شيئاً جديداً', 'في الطبيعة أو أسترخي'] },
  { id: 7, q: 'ما هي الصفة التي تقدرها أكثر في الآخرين؟', o: ['الصدق والوفاء', 'الذكاء والدهاء', 'اللطف والتعاطف', 'القوة والاستقلالية'] },
];

// تحليل شخصية علمي موسع
function analyzePersonality(answers: Record<string, string>) {
  const traits: Record<string, number> = {
    analytical: 0,  // التحليلية
    emotional: 0,   // العاطفية
    social: 0,      // الاجتماعية
    independent: 0, // الاستقلالية
    ambitious: 0,   // الطموح
    calm: 0,        // الهدوء
    creative: 0,    // الإبداع
    resilient: 0,   // المرونة النفسية
    attachment_secure: 0, // التعلق الآمن
    attachment_anxious: 0, // التعلق القلق
    attachment_avoidant: 0, // التعلق المتجنب
  };

  // السؤال 1: أسلوب حل المشكلات
  if (answers['1'] === 'أحللها بهدوء') traits.analytical += 2;
  if (answers['1'] === 'أثق بحدسي') traits.emotional += 2;
  if (answers['1'] === 'أطلب المساعدة') traits.social += 2;
  if (answers['1'] === 'أتجنبها مؤقتاً') traits.attachment_avoidant += 2;

  // السؤال 2: مصادر الدافع
  if (answers['2'] === 'تحقيق إنجاز') traits.ambitious += 2;
  if (answers['2'] === 'قضاء وقت مع الأحباء') traits.social += 2;
  if (answers['2'] === 'اكتشاف شيء جديد') traits.creative += 2;
  if (answers['2'] === 'الراحة والاسترخاء') traits.calm += 2;

  // السؤال 3: نمط التعلق
  if (answers['3'] === 'مستقرة وداعمة') traits.attachment_secure += 2;
  if (answers['3'] === 'أحياناً أقلق من فقدانهم') traits.attachment_anxious += 2;
  if (answers['3'] === 'أستمتع بها لكن أحتاج مساحتي') traits.attachment_avoidant += 2;
  if (answers['3'] === 'أفضل الاعتماد على نفسي') traits.independent += 2;

  // السؤال 4: التنظيم العاطفي
  if (answers['4'] === 'أتحدث مع أحدهم') traits.social += 2;
  if (answers['4'] === 'أبقى وحدي لأفكر') traits.analytical += 2;
  if (answers['4'] === 'أشغل نفسي بشيء آخر') traits.resilient += 2;
  if (answers['4'] === 'أبحث عن حل مباشر') traits.independent += 2;

  // السؤال 5: الطموح
  if (answers['5'] === 'النجاح المهني') traits.ambitious += 2;
  if (answers['5'] === 'السعادة العائلية') traits.attachment_secure += 2;
  if (answers['5'] === 'التأثير في العالم') traits.social += 2;
  if (answers['5'] === 'تحقيق السلام الداخلي') traits.calm += 2;

  // السؤال 6: اليوم المثالي
  if (answers['6'] === 'منجزاً ومليئاً بالمهام') traits.ambitious += 2;
  if (answers['6'] === 'مع العائلة والأصدقاء') traits.social += 2;
  if (answers['6'] === 'أتعلم أو أقرأ شيئاً جديداً') traits.creative += 2;
  if (answers['6'] === 'في الطبيعة أو أسترخي') traits.calm += 2;

  // السؤال 7: القيم الاجتماعية
  if (answers['7'] === 'الصدق والوفاء') traits.attachment_secure += 2;
  if (answers['7'] === 'الذكاء والدهاء') traits.ambitious += 2;
  if (answers['7'] === 'اللطف والتعاطف') traits.emotional += 2;
  if (answers['7'] === 'القوة والاستقلالية') traits.independent += 2;

  const dominant = Object.entries(traits).sort((a, b) => b[1] - a[1])[0][0];
  const typeMap: Record<string, string> = {
    analytical: 'ANALYTICAL', emotional: 'EMPATH', social: 'SOCIAL',
    independent: 'INDEPENDENT', ambitious: 'ACHIEVER', calm: 'PEACEMAKER',
    creative: 'CREATOR', resilient: 'RESILIENT',
    attachment_secure: 'SECURE', attachment_anxious: 'ANXIOUS', attachment_avoidant: 'AVOIDANT',
  };

  // تحسين: إرجاع وصف شخصية مبسط بناءً على السمات
  let personality_desc = '';
  if (traits.analytical > 4) personality_desc = 'شخصية تحليلية، تحب التفكير المنطقي.';
  else if (traits.emotional > 4) personality_desc = 'شخصية عاطفية، تتخذ قراراتك بقلبك.';
  else if (traits.social > 4) personality_desc = 'شخصية اجتماعية، تستمد طاقتك من الآخرين.';
  else if (traits.independent > 4) personality_desc = 'شخصية مستقلة، تقدر حريتك.';
  else personality_desc = 'شخصية متوازنة، تجمع بين العقل والعاطفة.';

  return { traits, dominant_type: typeMap[dominant] || 'BALANCED', description: personality_desc };
}

export default function Onboarding() {
  const [step, setStep] = useState(1); // 1=الأسئلة، 2=معلومات حرة، 3=جنس التوأم، 4=الأسماء، 5=تحميل، 6=ترحيب
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionStep, setQuestionStep] = useState(0); // تتبع السؤال الحالي
  const [freeInfo, setFreeInfo] = useState('');
  const [twinGender, setTwinGender] = useState<TwinGender>('female');
  const [userName, setUserName] = useState('');
  const [twinName, setTwinName] = useState('');
  const [_loading, setLoading] = useState(false);
  const { userId, setTwinName: storeSetTwinName, setTwinGender: storeSetTwinGender } = useTwinStore();

  const pickAnswer = (answer: string) => {
    setAnswers({ ...answers, [questionStep + 1]: answer });
    if (questionStep < QUESTIONS.length - 1) {
      setQuestionStep(questionStep + 1);
    } else {
      setStep(2);
    }
  };

  const handleFinalSubmit = async () => {
    if (!userName || !twinName) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    setLoading(true);
    try {
      const analysis = analyzePersonality(answers);
      setStep(5);
      await supabase.from('profiles').update({
        twin_name: twinName,
        twin_gender: twinGender,
        full_name: userName,
        onboarded: true,
      }).eq('user_id', userId);
      await supabase.from('personality_profiles').upsert({
        user_id: userId,
        answers: { ...answers, free_info: freeInfo },
        analyzed_traits: analysis,
      });
      // إضافة تاريخ الشخصية (تم إصلاح الفواصل)
      await supabase.from('personality_history').insert({
        user_id: userId,
        traits: analysis,
        recorded_at: new Date().toISOString(),
      });
      storeSetTwinName(twinName);
      storeSetTwinGender(twinGender);
      track('onboarding_completed', { personality_type: analysis.dominant_type });
      setStep(6);
    } catch (e: unknown) {
      Alert.alert('خطأ', 'لم نتمكن من حفظ بياناتك');
      setLoading(false);
      setStep(4);
    }
  };

  const skip = async () => {
    try {
      const analysis = analyzePersonality(answers);
      await supabase.from('profiles').update({
        twin_name: 'Twin',
        twin_gender: 'female',
        full_name: 'User',
        onboarded: true,
      }).eq('user_id', userId);
      await supabase.from('personality_profiles').upsert({
        user_id: userId,
        answers: { ...answers, free_info: freeInfo },
        analyzed_traits: analysis,
      });
      track('onboarding_skipped');
      setStep(6);
    } catch (e: unknown) {
      Alert.alert('خطأ', 'لم نتمكن من حفظ بياناتك');
    }
  };

  // شاشة التحميل
  if (step === 5) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, fontSize: FONTS.body, color: COLORS.text }}>جاري إعداد توأمك...</Text>
        <Text style={{ marginTop: 8, fontSize: FONTS.small, color: COLORS.textSecondary }}>نحن نفهم شخصيتك لبناء أفضل رفيق لك</Text>
      </View>
    );
  }

  // شاشة الترحيب النهائية
  if (step === 6) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>💜</Text>
        <Text style={{ fontSize: FONTS.title, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 8 }}>
          مرحباً {userName || 'بك'}!
        </Text>
        <Text style={{ fontSize: FONTS.subtitle, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8 }}>
          أنا {twinName || 'توأمك'}، {twinGender === 'female' ? 'رفيقتك' : 'رفيقك'} الرقمي{ twinGender === 'female' ? 'ة' : ''}.
        </Text>
        <Text style={{ fontSize: FONTS.body, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>
          أنا هنا لأستمع إليك، لأفهمك، ولأرافقك في كل خطوة.{"\n"}لنبدأ رحلتنا معاً.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/chat')}>
          <Text style={styles.primaryBtnText}>ابدأ الرحلة 🚀</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <Text style={styles.skipText}>تخطي ←</Text>
      </TouchableOpacity>

      {/* الخطوة 1: الأسئلة النفسية */}
      {step === 1 && (
        <>
          <Text style={styles.progress}>{questionStep + 1} / {QUESTIONS.length}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((questionStep + 1) / QUESTIONS.length) * 100}%` }]} />
          </View>
          <Text style={styles.question}>{QUESTIONS[questionStep].q}</Text>
          {QUESTIONS[questionStep].o.map((opt, i) => (
            <TouchableOpacity key={i} style={styles.option} onPress={() => pickAnswer(opt)} activeOpacity={0.7}>
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* الخطوة 2: معلومات حرة */}
      {step === 2 && (
        <>
          <Text style={styles.sectionTitle}>هل هناك شيء تريد أن يعرفه توأمك عنك؟</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={6}
            placeholder="مثلاً: أحب القهوة، عندي كلب اسمه ماكس، أنا خجول قليلاً..."
            placeholderTextColor={COLORS.textSecondary}
            value={freeInfo}
            onChangeText={setFreeInfo}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(3)}>
            <Text style={styles.primaryBtnText}>متابعة</Text>
          </TouchableOpacity>
        </>
      )}

      {/* الخطوة 3: جنس التوأم */}
      {step === 3 && (
        <>
          <Text style={styles.sectionTitle}>اختر جنس توأمك</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderCard, twinGender === 'female' && styles.selectedCard]}
              onPress={() => setTwinGender('female')}
            >
              <Text style={styles.genderEmoji}>👩</Text>
              <Text style={styles.genderText}>أنثى</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderCard, twinGender === 'male' && styles.selectedCard]}
              onPress={() => setTwinGender('male')}
            >
              <Text style={styles.genderEmoji}>👨</Text>
              <Text style={styles.genderText}>ذكر</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(4)}>
            <Text style={styles.primaryBtnText}>متابعة</Text>
          </TouchableOpacity>
        </>
      )}

      {/* الخطوة 4: الأسماء */}
      {step === 4 && (
        <>
          <Text style={styles.sectionTitle}>أخبرنا عنك وعن توأمك</Text>
          <TextInput
            style={styles.input}
            placeholder="اسمك"
            placeholderTextColor={COLORS.textSecondary}
            value={userName}
            onChangeText={setUserName}
          />
          <TextInput
            style={styles.input}
            placeholder="اسم توأمك"
            placeholderTextColor={COLORS.textSecondary}
            value={twinName}
            onChangeText={setTwinName}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, (!userName || !twinName) && { opacity: 0.5 }]}
            onPress={handleFinalSubmit}
            disabled={!userName || !twinName}
          >
            <Text style={styles.primaryBtnText}>إنشاء توأمي</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', padding: 24 },
  skipBtn: { position: 'absolute', top: 20, right: 20, padding: 8, zIndex: 10 },
  skipText: { color: COLORS.primary, fontSize: FONTS.body, fontWeight: '600' },
  progress: { color: COLORS.textSecondary, fontSize: FONTS.small, textAlign: 'center', marginBottom: 8 },
  progressBar: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: 32, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  question: { color: COLORS.text, fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 32 },
  option: { backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  optionText: { color: COLORS.text, textAlign: 'center', fontSize: FONTS.body },
  sectionTitle: { fontSize: FONTS.title, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 24 },
  textArea: { backgroundColor: COLORS.card, color: COLORS.text, padding: 16, borderRadius: 12, fontSize: FONTS.body, minHeight: 120, textAlignVertical: 'top', marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  input: { backgroundColor: COLORS.card, color: COLORS.text, padding: 16, borderRadius: 12, fontSize: FONTS.body, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  genderRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 32 },
  genderCard: { flex: 1, padding: 24, borderRadius: 16, backgroundColor: COLORS.card, alignItems: 'center', borderWidth: 2, borderColor: COLORS.border },
  selectedCard: { borderColor: COLORS.primary, backgroundColor: '#F3F0FF' },
  genderEmoji: { fontSize: 48, marginBottom: 8 },
  genderText: { fontSize: FONTS.body, fontWeight: '600', color: COLORS.text },
  primaryBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: FONTS.body },
});
