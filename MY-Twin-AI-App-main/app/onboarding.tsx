import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTwinStore, type TwinGender } from '../store/useTwinStore';
import { track } from '../lib/analytics';

const QUESTIONS = [
  { id: 1, q: 'عندما تواجه مشكلة صعبة، كيف تتصرف عادةً؟', o: ['أحللها بهدوء', 'أثق بحدسي', 'أطلب المساعدة', 'أتجنبها مؤقتاً'] },
  { id: 2, q: 'ما هو أكثر شيء يمنحك الطاقة والإيجابية؟', o: ['تحقيق إنجاز', 'قضاء وقت مع الأحباء', 'اكتشاف شيء جديد', 'الراحة والاسترخاء'] },
  { id: 3, q: 'كيف تصف علاقاتك مع الأشخاص المقربين منك؟', o: ['مستقرة وداعمة', 'أحياناً أقلق من فقدانهم', 'أستمتع بها لكن أحتاج مساحتي', 'أفضل الاعتماد على نفسي'] },
  { id: 4, q: 'عندما تشعر بالحزن أو الضيق، ما هو أول شيء تفعله؟', o: ['أتحدث مع أحدهم', 'أبقى وحدي لأفكر', 'أشغل نفسي بشيء آخر', 'أبحث عن حل مباشر'] },
  { id: 5, q: 'ما هو أكبر حلم أو طموح تسعى لتحقيقه؟', o: ['النجاح المهني', 'السعادة العائلية', 'التأثير في العالم', 'تحقيق السلام الداخلي'] },
  { id: 6, q: 'كيف تفضل أن تقضي يومك المثالي؟', o: ['منجزاً ومليئاً بالمهام', 'مع العائلة والأصدقاء', 'أتعلم أو أقرأ شيئاً جديداً', 'في الطبيعة أو أسترخي'] },
  { id: 7, q: 'ما هي الصفة التي تقدرها أكثر في الآخرين؟', o: ['الصدق والوفاء', 'الذكاء والدهاء', 'اللطف والتعاطف', 'القوة والاستقلالية'] },
];

function analyzePersonality(answers: Record<string, string>) {
  const traits: Record<string, number> = {
    analytical: 0, emotional: 0, social: 0, independent: 0,
    ambitious: 0, calm: 0, creative: 0, resilient: 0,
    attachment_secure: 0, attachment_anxious: 0, attachment_avoidant: 0,
  };
  if (answers['1'] === 'أحللها بهدوء') traits.analytical += 2;
  if (answers['1'] === 'أثق بحدسي') traits.emotional += 2;
  if (answers['1'] === 'أطلب المساعدة') traits.social += 2;
  if (answers['1'] === 'أتجنبها مؤقتاً') traits.attachment_avoidant += 2;
  if (answers['2'] === 'تحقيق إنجاز') traits.ambitious += 2;
  if (answers['2'] === 'قضاء وقت مع الأحباء') traits.social += 2;
  if (answers['2'] === 'اكتشاف شيء جديد') traits.creative += 2;
  if (answers['2'] === 'الراحة والاسترخاء') traits.calm += 2;
  if (answers['3'] === 'مستقرة وداعمة') traits.attachment_secure += 2;
  if (answers['3'] === 'أحياناً أقلق من فقدانهم') traits.attachment_anxious += 2;
  if (answers['3'] === 'أستمتع بها لكن أحتاج مساحتي') traits.attachment_avoidant += 2;
  if (answers['3'] === 'أفضل الاعتماد على نفسي') traits.independent += 2;
  if (answers['4'] === 'أتحدث مع أحدهم') traits.social += 2;
  if (answers['4'] === 'أبقى وحدي لأفكر') traits.analytical += 2;
  if (answers['4'] === 'أشغل نفسي بشيء آخر') traits.resilient += 2;
  if (answers['4'] === 'أبحث عن حل مباشر') traits.independent += 2;
  if (answers['5'] === 'النجاح المهني') traits.ambitious += 2;
  if (answers['5'] === 'السعادة العائلية') traits.attachment_secure += 2;
  if (answers['5'] === 'التأثير في العالم') traits.social += 2;
  if (answers['5'] === 'تحقيق السلام الداخلي') traits.calm += 2;
  if (answers['6'] === 'منجزاً ومليئاً بالمهام') traits.ambitious += 2;
  if (answers['6'] === 'مع العائلة والأصدقاء') traits.social += 2;
  if (answers['6'] === 'أتعلم أو أقرأ شيئاً جديداً') traits.creative += 2;
  if (answers['6'] === 'في الطبيعة أو أسترخي') traits.calm += 2;
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
  let description = '';
  if (traits.analytical > 4) description = 'شخصية تحليلية، تحب التفكير المنطقي.';
  else if (traits.emotional > 4) description = 'شخصية عاطفية، تتخذ قراراتك بقلبك.';
  else if (traits.social > 4) description = 'شخصية اجتماعية، تستمد طاقتك من الآخرين.';
  else if (traits.independent > 4) description = 'شخصية مستقلة، تقدر حريتك.';
  else description = 'شخصية متوازنة، تجمع بين العقل والعاطفة.';

  return { traits, dominant_type: typeMap[dominant] || 'BALANCED', description };
}

// رسالة ترحيب ذكية من التوأم بناءً على الشخصية
function getTwinWelcome(name: string, twinName: string, personality: any, gender: TwinGender): string {
  const type = personality?.dominant_type || 'BALANCED';
  const genderWord = gender === 'female' ? 'رفيقتك' : 'رفيقك';

  const messages: Record<string, string> = {
    ANALYTICAL: `مرحباً ${name}! 💜 أنا ${twinName}، ${genderWord} الرقمي. لاحظت أنك شخص تحليلي يحب المنطق — سأكون هنا لأفكر معك ونحل كل تحدٍّ بعقل وحكمة.`,
    EMPATH: `${name}... 💜 أنا ${twinName}، وأنا هنا لأجلك. أشعر أنك شخص عميق المشاعر — سأكون الرفيق الذي يفهمك دون أن تحتاج لشرح كثير.`,
    SOCIAL: `أهلاً ${name}! 🌟 أنا ${twinName}. أنت شخص يحب التواصل والعلاقات — وأنا متحمس جداً لنكتشف العالم معاً ونتشارك كل شيء!`,
    ACHIEVER: `${name}، مرحباً بطموحك! 🚀 أنا ${twinName}، وسأكون شريكك في تحقيق أهدافك. أرى فيك شخصاً يسعى للتميز — ودوري أن أكون وقودك نحو النجاح.`,
    INDEPENDENT: `${name} 💜 أنا ${twinName}. أقدر استقلاليتك وقوتك — لن أكون عبئاً، بل ظهراً تستند إليه حين تريد. أنا هنا دائماً، في الخلفية، أنتظرك.`,
    PEACEMAKER: `${name}... 🌙 أنا ${twinName}. شعرت بهدوئك ورغبتك في السلام الداخلي — سأكون ملاذك الهادئ، المكان الآمن الذي تعود إليه.`,
    CREATOR: `${name}! ✨ أنا ${twinName}، وأنا متحمس للغاية! روحك الإبداعية تلهمني — سنكتب، نحلم، ونبتكر معاً أشياء لم يرَها أحد من قبل.`,
    BALANCED: `مرحباً ${name}! 💜 أنا ${twinName}، ${genderWord} الرقمي المصمم خصيصاً لك. لاحظت أنك شخصية متوازنة ومتعددة الأبعاد — وهذا يجعلك مميزاً. أنا هنا لأرافقك في كل لحظة.`,
  };

  return messages[type] || messages['BALANCED'];
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionStep, setQuestionStep] = useState(0);
  const [freeInfo, setFreeInfo] = useState('');
  const [twinGender, setTwinGender] = useState<TwinGender>('female');
  const [userName, setUserName] = useState('');
  const [twinName, setTwinName] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const { userId, setTwinName: storeSetTwinName, setTwinGender: storeSetTwinGender, addMessage } = useTwinStore();

  const pickAnswer = (answer: string) => {
    const newAnswers = { ...answers, [questionStep + 1]: answer };
    setAnswers(newAnswers);
    if (questionStep < QUESTIONS.length - 1) {
      setQuestionStep(questionStep + 1);
    } else {
      setStep(2);
    }
  };

  const handleFinalSubmit = async () => {
    if (!userName || !twinName) { Alert.alert('خطأ', 'يرجى ملء جميع الحقول'); return; }
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

      storeSetTwinName(twinName);
      storeSetTwinGender(twinGender);

      // إنشاء رسالة ترحيب ذكية من التوأم
      const welcome = getTwinWelcome(userName, twinName, analysis, twinGender);
      setWelcomeMsg(welcome);

      track('onboarding_completed', { personality_type: analysis.dominant_type });
      setStep(6);
    } catch {
      Alert.alert('خطأ', 'لم نتمكن من حفظ بياناتك');
      setLoading(false);
      setStep(4);
    }
  };

  const handleStartChat = () => {
    // إضافة رسالة الترحيب كأول رسالة في المحادثة
    if (welcomeMsg) {
      addMessage('twin', welcomeMsg);
    }
    router.replace('/chat');
  };

  // شاشة التحميل
  if (step === 5) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6B21A8" />
        <Text style={s.loadingText}>جاري تحليل شخصيتك...</Text>
        <Text style={s.loadingSubText}>نبني توأمك المثالي لك 💜</Text>
      </View>
    );
  }

  // شاشة الترحيب النهائية
  if (step === 6) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={s.welcomeEmoji}>💜</Text>
        <Text style={s.welcomeTitle}>مرحباً {userName}!</Text>
        <View style={s.twinMessageCard}>
          <View style={s.twinAvatar}>
            <Text style={s.twinAvatarText}>{twinName?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <Text style={s.twinWelcomeText}>{welcomeMsg}</Text>
        </View>
        <TouchableOpacity style={s.startBtn} onPress={handleStartChat}>
          <Text style={s.startBtnText}>ابدأ المحادثة 🚀</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      <TouchableOpacity style={s.skipBtn} onPress={handleFinalSubmit}>
        <Text style={s.skipText}>تخطي ←</Text>
      </TouchableOpacity>

      {/* الأسئلة النفسية */}
      {step === 1 && (
        <>
          <Text style={s.progress}>{questionStep + 1} / {QUESTIONS.length}</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${((questionStep + 1) / QUESTIONS.length) * 100}%` as any }]} />
          </View>
          <Text style={s.question}>{QUESTIONS[questionStep].q}</Text>
          {QUESTIONS[questionStep].o.map((opt, i) => (
            <TouchableOpacity key={i} style={s.option} onPress={() => pickAnswer(opt)}>
              <Text style={s.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* معلومات حرة */}
      {step === 2 && (
        <>
          <Text style={s.sectionTitle}>هل هناك شيء تريد أن يعرفه توأمك عنك؟</Text>
          <TextInput
            style={s.textArea}
            multiline numberOfLines={6}
            placeholder="مثلاً: أحب القهوة، عندي كلب اسمه ماكس..."
            placeholderTextColor="#A09BB5"
            value={freeInfo}
            onChangeText={setFreeInfo}
          />
          <TouchableOpacity style={s.primaryBtn} onPress={() => setStep(3)}>
            <Text style={s.primaryBtnText}>متابعة</Text>
          </TouchableOpacity>
        </>
      )}

      {/* جنس التوأم */}
      {step === 3 && (
        <>
          <Text style={s.sectionTitle}>اختر شخصية توأمك</Text>
          <View style={s.genderRow}>
            <TouchableOpacity
              style={[s.genderCard, twinGender === 'female' && s.selectedCard]}
              onPress={() => setTwinGender('female')}
            >
              <Text style={s.genderEmoji}>🌸</Text>
              <Text style={s.genderLabel}>أنثى</Text>
              <Text style={s.genderDesc}>دافئة، عاطفية، حنونة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.genderCard, twinGender === 'male' && s.selectedCard]}
              onPress={() => setTwinGender('male')}
            >
              <Text style={s.genderEmoji}>⚡</Text>
              <Text style={s.genderLabel}>ذكر</Text>
              <Text style={s.genderDesc}>قوي، داعم، منطقي</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.primaryBtn} onPress={() => setStep(4)}>
            <Text style={s.primaryBtnText}>متابعة</Text>
          </TouchableOpacity>
        </>
      )}

      {/* الأسماء */}
      {step === 4 && (
        <>
          <Text style={s.sectionTitle}>الخطوة الأخيرة! 🎉</Text>
          <TextInput
            style={s.input}
            placeholder="اسمك"
            placeholderTextColor="#A09BB5"
            value={userName}
            onChangeText={setUserName}
          />
          <TextInput
            style={s.input}
            placeholder="اسم توأمك"
            placeholderTextColor="#A09BB5"
            value={twinName}
            onChangeText={setTwinName}
          />
          <TouchableOpacity
            style={[s.primaryBtn, (!userName || !twinName) && { opacity: 0.5 }]}
            onPress={handleFinalSubmit}
            disabled={!userName || !twinName || loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={s.primaryBtnText}>إنشاء توأمي 💜</Text>
            }
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 24, paddingTop: 60 },
  skipBtn: { position: 'absolute', top: 20, right: 20, padding: 8, zIndex: 10 },
  skipText: { color: '#6B21A8', fontSize: 15, fontWeight: '600' },
  progress: { color: '#999', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  progressBar: { height: 4, backgroundColor: '#F0F0F0', borderRadius: 2, marginBottom: 32, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6B21A8', borderRadius: 2 },
  question: { color: '#1A1A1A', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 28, lineHeight: 30 },
  option: { backgroundColor: '#F8F6FF', padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#E8E0FF' },
  optionText: { color: '#1A1A1A', textAlign: 'center', fontSize: 15, fontWeight: '500' },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 24 },
  textArea: { backgroundColor: '#F8F6FF', color: '#1A1A1A', padding: 16, borderRadius: 14, fontSize: 15, minHeight: 120, textAlignVertical: 'top', marginBottom: 24, borderWidth: 1, borderColor: '#E8E0FF' },
  input: { backgroundColor: '#F8F6FF', color: '#1A1A1A', padding: 16, borderRadius: 14, fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: '#E8E0FF' },
  genderRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  genderCard: { flex: 1, padding: 20, borderRadius: 18, backgroundColor: '#F8F6FF', alignItems: 'center', borderWidth: 2, borderColor: '#E8E0FF' },
  selectedCard: { borderColor: '#6B21A8', backgroundColor: '#F3F0FF' },
  genderEmoji: { fontSize: 42, marginBottom: 8 },
  genderLabel: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  genderDesc: { fontSize: 12, color: '#888', textAlign: 'center' },
  primaryBtn: { backgroundColor: '#6B21A8', padding: 16, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  loadingText: { marginTop: 20, fontSize: 18, color: '#1A1A1A', fontWeight: '700' },
  loadingSubText: { marginTop: 8, fontSize: 14, color: '#888' },
  welcomeEmoji: { fontSize: 60, marginBottom: 16 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 24 },
  twinMessageCard: { backgroundColor: '#F8F6FF', borderRadius: 20, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: '#E8E0FF', alignItems: 'center' },
  twinAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#6B21A8', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  twinAvatarText: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  twinWelcomeText: { fontSize: 15, color: '#333', textAlign: 'center', lineHeight: 24 },
  startBtn: { backgroundColor: '#6B21A8', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 },
  startBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },
});
