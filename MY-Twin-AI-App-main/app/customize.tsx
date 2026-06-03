import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { supabase } from '../lib/supabase';
import { COLORS, FONTS } from '../utils/theme';
import { 
  Palette, 
  Mic, 
  Volume2, 
  Zap, 
  Brain, 
  Heart, 
  MessageSquare 
} from 'lucide-react-native';

const TEXTS = {
  ar: {
    title: '🎨 تخصيص التوأم',
    personality: 'الشخصية',
    name: 'اسم التوأم',
    gender: 'النوع',
    male: 'ذكر',
    female: 'أنثى',
    style: 'النمط',
    styles: { supportive: '🤝 صديق داعم', coach: '🎯 مدرب شخصي', wise: '💡 مستشار حكيم', fun: '😊 رفيق مرح', calm: '🧘 معلم هادئ' },
    appearance: 'المظهر',
    avatar: 'الأفاتار',
    colors: 'الألوان',
    voice: 'الصوت',
    voiceEnabled: 'تفعيل الصوت',
    voiceInfo: 'الصوت متاح في الباقات المدفوعة فقط',
    voiceType: 'نوع الصوت',
    voiceSpeed: 'السرعة',
    voiceTone: 'النبرة',
    language: 'اللغة',
    primaryLang: 'اللغة الأساسية',
    dialect: 'اللهجة',
    behavior: 'السلوك',
    detailLevel: 'مستوى التفصيل',
    defaultMode: 'الوضع الافتراضي',
    initiative: 'المبادرة',
    save: 'حفظ التغييرات',
    saved: 'تم حفظ التغييرات بنجاح',
  },
  en: {
    title: '🎨 Customize Twin',
    personality: 'Personality',
    name: 'Twin Name',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    style: 'Style',
    styles: { supportive: '🤝 Supportive Friend', coach: '🎯 Personal Coach', wise: '💡 Wise Advisor', fun: '😊 Fun Companion', calm: '🧘 Calm Teacher' },
    appearance: 'Appearance',
    avatar: 'Avatar',
    colors: 'Colors',
    voice: 'Voice',
    voiceEnabled: 'Enable Voice',
    voiceInfo: 'Voice is available in paid plans only',
    voiceType: 'Voice Type',
    voiceSpeed: 'Speed',
    voiceTone: 'Tone',
    language: 'Language',
    primaryLang: 'Primary Language',
    dialect: 'Dialect',
    behavior: 'Behavior',
    detailLevel: 'Detail Level',
    defaultMode: 'Default Mode',
    initiative: 'Initiative',
    save: 'Save Changes',
    saved: 'Changes saved successfully',
  },
};

export default function Customize() {
  const { twinName, twinGender, twinStyle, setTwinName, setTwinGender, setTwinStyle } = useTwinStore();
  const [name, setName] = useState(twinName);
  const [gender, setGender] = useState(twinGender);
  const [style, setStyle] = useState(twinStyle);
  const [voiceOn, setVoiceOn] = useState(false);
  const [detailLevel, setDetailLevel] = useState('medium');
  const lang = 'ar';
  const t = TEXTS[lang];
  const isFree = false; // سيتم جلبه من الاستخدام

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        twin_name: name,
        twin_gender: gender,
        twin_style: style,
        voice_enabled: voiceOn,
        detail_level: detailLevel,
      }).eq('user_id', user.id);
      setTwinName(name);
      setTwinGender(gender);
      setTwinStyle(style);
    }
    Alert.alert('✅', t.saved);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{t.title}</Text>

      <Text style={styles.sectionTitle}>{t.personality}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{t.name}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t.name}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t.gender}</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'female' && styles.genderActive]}
              onPress={() => setGender('female')}
            >
              <Text>أنثى</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'male' && styles.genderActive]}
              onPress={() => setGender('male')}
            >
              <Text>ذكر</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.optionTitle}>{t.style}</Text>
        {Object.entries(t.styles).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.optionBtn, style === key && styles.optionActive]} onPress={() => setStyle(key as keyof typeof t.styles)}>
            <Text style={[styles.optionText, style === key && styles.optionActiveText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t.voice}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{t.voiceEnabled}</Text>
          <Switch
            value={voiceOn}
            onValueChange={setVoiceOn}
            trackColor={{ false: '#DDD', true: '#6B21A8' }}
            disabled={isFree}
          />
        </View>
        {isFree && <Text style={styles.voiceInfo}>{t.voiceInfo}</Text>}
      </View>

      <Text style={styles.sectionTitle}>{t.behavior}</Text>
      <View style={styles.card}>
        <Text style={styles.optionTitle}>{t.detailLevel}</Text>
        {['short', 'medium', 'long'].map(level => (
          <TouchableOpacity key={level} style={[styles.optionBtn, detailLevel === level && styles.optionActive]} onPress={() => setDetailLevel(level)}>
            <Text style={[styles.optionText, detailLevel === level && styles.optionActiveText]}>
              {level === 'short' ? 'مختصر' : level === 'medium' ? 'متوسط' : 'مفصل'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{t.save}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F6F2', padding: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginTop: 20, marginBottom: 12 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E0D9F5' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { color: '#888', fontSize: 14 },
  input: { backgroundColor: '#F8F6F2', color: '#1A1A1A', padding: 10, borderRadius: 8, minWidth: 120 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E0D9F5' },
  genderActive: { backgroundColor: '#6B21A8', borderColor: '#6B21A8' },
  optionTitle: { color: '#888', fontSize: 12, marginTop: 12, marginBottom: 8 },
  optionBtn: { padding: 12, borderRadius: 10, backgroundColor: '#F8F6F2', marginBottom: 8, borderWidth: 1, borderColor: '#E0D9F5' },
  optionActive: { backgroundColor: '#6B21A8', borderColor: '#6B21A8' },
  optionText: { color: '#1A1A1A', fontSize: 14 },
  optionActiveText: { color: '#FFF' },
  voiceInfo: { color: '#888', fontSize: 12, marginTop: 8, textAlign: 'center' },
  saveBtn: { backgroundColor: '#6B21A8', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
