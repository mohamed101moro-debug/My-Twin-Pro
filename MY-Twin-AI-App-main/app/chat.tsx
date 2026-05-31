import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, Modal, Animated, Alert, Image as RNImage } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useTwinStore } from '../store/useTwinStore';
import { askTwin } from '../lib/api';
import { startRecordingVoice, stopRecordingVoice, speakResponse } from '../utils/voice_engine';
import { useToast } from '../components/Toast';
import CircleProgress from '../components/CircleProgress';
import { Mic, ArrowUp, Paperclip, Image as ImageIcon, FileText, Sun, MoonStar, Smile, Target, Brain, PenTool, X, Menu } from 'lucide-react-native';

type ChatMessage = { role: 'user' | 'twin'; content: string; };

function getWelcomeMessage(lang: 'ar' | 'en') {
  const hour = new Date().getHours();
  if (lang === 'ar') {
    if (hour >= 6 && hour < 12) return { emoji: '🌅', text: 'صباح الخير! كيف حالك اليوم؟' };
    if (hour >= 12 && hour < 18) return { emoji: '🌞', text: 'مرحباً! كيف يومك؟' };
    if (hour >= 18 && hour < 24) return { emoji: '🌙', text: 'مساء الخير! كيف كان يومك؟' };
    return { emoji: '🌃', text: 'سهرة سعيدة! لنكن معاً؟' };
  }
  if (hour >= 6 && hour < 12) return { emoji: '🌅', text: 'Good morning! How are you today?' };
  if (hour >= 12 && hour < 18) return { emoji: '🌞', text: 'Hello! How is your day?' };
  if (hour >= 18 && hour < 24) return { emoji: '🌙', text: 'Good evening! How was your day?' };
  return { emoji: '🌃', text: 'Happy late night! Shall we talk?' };
}

function getSuggestions(lang: 'ar' | 'en') {
  if (lang === 'ar') return [
    { icon: Smile, label: 'دردشة', prompt: 'لنتحدث عن أي شيء' },
    { icon: Target, label: 'مهمة', prompt: 'أريد مساعدتك في مهمة' },
    { icon: Brain, label: 'مشاعر', prompt: 'أريد أن أفهم مشاعري' },
    { icon: PenTool, label: 'إبداع', prompt: 'لنكتب شيئاً معاً' },
  ];
  return [
    { icon: Smile, label: 'Chat', prompt: "Let's talk about anything" },
    { icon: Target, label: 'Task', prompt: 'I need help with a task' },
    { icon: Brain, label: 'Feelings', prompt: 'Help me understand my feelings' },
    { icon: PenTool, label: 'Creative', prompt: "Let's write something together" },
  ];
}

interface ChatProps {
  onOpenMenu?: () => void;
}

export default function Chat({ onOpenMenu }: ChatProps) {
  const { twinName, bondLevel, relationshipDims, chatHistory, addMessage, updateBond, updateRelationshipDims, calmMode, toggleCalmMode, triggerHaptic, lang } = useTwinStore();
  const { showToast } = useToast();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [energy] = useState(85);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const recordWave = useRef(new Animated.Value(1)).current;
  const isRTL = lang === 'ar';
  const welcome = getWelcomeMessage(lang);
  const suggestions = getSuggestions(lang);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [chatHistory]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(Animated.sequence([
        Animated.timing(recordWave, { toValue: 1.3, duration: 300, useNativeDriver: true }),
        Animated.timing(recordWave, { toValue: 0.8, duration: 300, useNativeDriver: true }),
      ])).start();
    } else { recordWave.setValue(1); }
  }, [isRecording]);

  const send = async (messageText?: string) => {
    const message = (messageText || input).trim();
    if (!message || loading) return;
    triggerHaptic();
    addMessage('user', message);
    setInput('');
    setLoading(true);
    try {
      const res = await askTwin(message, twinName, bondLevel, relationshipDims, calmMode);
      addMessage('twin', res.reply);
      updateBond(res.new_bond ?? bondLevel);
      if (res.dims_update) updateRelationshipDims(res.dims_update);
      if (res?.importance > 0.7) showToast(lang === 'ar' ? 'تم حفظ ذكرى ✨' : 'Memory saved ✨', 'success');
      if (res.tts) speakResponse(res.reply, res.tts);
    } catch {
      addMessage('twin', lang === 'ar' ? 'تعذر الاتصال بالخادم 😔' : 'Connection failed 😔');
    } finally { setLoading(false); }
  };

  const handleVoice = async () => {
    if (isRecording) {
      setIsRecording(false);
      const text = await stopRecordingVoice();
      if (text) send(text);
    } else {
      const started = await startRecordingVoice();
      if (started) setIsRecording(true);
      else Alert.alert(lang === 'ar' ? 'خطأ' : 'Error', lang === 'ar' ? 'تعذر الوصول للميكروفون' : 'Microphone access denied');
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === 'user';
    const isLast = index === chatHistory.length - 1;
    return (
      <Animated.View style={[
        styles.messageRow,
        isUser ? styles.userRow : styles.twinRow,
        isLast && { opacity: fadeAnim }
      ]}>
        {!isUser && (
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>{twinName?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.twinBubble]}>
          <Text style={isUser ? styles.userText : styles.twinText}>{item.content}</Text>
        </View>
      </Animated.View>
    );
  };

  const ListEmpty = () => (
    <View style={styles.welcomeContainer}>
      <Text style={styles.welcomeEmoji}>{welcome.emoji}</Text>
      <Text style={styles.welcomeText}>{welcome.text}</Text>
      <View style={styles.suggestionsRow}>
        {suggestions.map((item, i) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity key={i} style={styles.suggestionBtn} onPress={() => send(item.prompt)}>
              <Icon size={18} color="#6B21A8" />
              <Text style={styles.suggestionText}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header كامل مع القائمة والمؤشرات */}
        <View style={styles.header}>

          {/* الصف الأول: القائمة + اسم التوأم + وضع الهدوء */}
          <View style={styles.headerRow1}>
            <TouchableOpacity onPress={onOpenMenu} style={styles.menuBtn}>
              <Menu size={24} color="#1A1A1A" />
            </TouchableOpacity>

            <View style={styles.twinInfo}>
              <View style={styles.avatarHeader}>
                <Text style={styles.avatarHeaderText}>{twinName?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
              <View>
                <Text style={styles.headerName}>{twinName || (lang === 'ar' ? 'توأمك' : 'Your Twin')}</Text>
                <View style={styles.onlineRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>{lang === 'ar' ? 'متصل الآن' : 'Online'}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={toggleCalmMode} style={styles.calmBtn}>
              {calmMode ? <MoonStar size={22} color="#6B21A8" /> : <Sun size={22} color="#F59E0B" />}
            </TouchableOpacity>
          </View>

          {/* الصف الثاني: المؤشرات */}
          <View style={styles.headerRow2}>
            <CircleProgress
              percentage={bondLevel}
              color="#6B21A8"
              size={56}
              label={lang === 'ar' ? 'ترابط' : 'Level'}
              icon="💜"
            />
            <CircleProgress
              percentage={energy}
              color="#10B981"
              size={56}
              label={lang === 'ar' ? 'طاقة' : 'Energy'}
              icon="⚡"
            />
            <View style={styles.bondInfo}>
              <Text style={styles.bondLabel}>
                {lang === 'ar' ? 'مستوى الترابط' : 'Bond Level'}
              </Text>
              <Text style={styles.bondValue}>{bondLevel.toFixed(0)}%</Text>
              <Text style={styles.bondStage}>
                {bondLevel >= 95 ? (lang === 'ar' ? 'توأم روح 🔮' : 'Soulmate 🔮')
                  : bondLevel >= 80 ? (lang === 'ar' ? 'ارتباط عميق 💜' : 'Deep Bond 💜')
                  : bondLevel >= 60 ? (lang === 'ar' ? 'ثقة متبادلة ✨' : 'Mutual Trust ✨')
                  : bondLevel >= 40 ? (lang === 'ar' ? 'صداقة حقيقية 🌱' : 'True Friends 🌱')
                  : (lang === 'ar' ? 'بداية الرحلة 🌟' : 'Journey Begins 🌟')}
              </Text>
            </View>
          </View>

        </View>

        {/* المحادثة */}
        <FlatList
          ref={flatListRef}
          data={chatHistory}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderMessage}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          removeClippedSubviews
          initialNumToRender={15}
        />

        {/* مؤشر الكتابة */}
        {loading && (
          <View style={styles.typingRow}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingDots}>• • •</Text>
              <Text style={styles.typingText}>{lang === 'ar' ? 'يكتب...' : 'typing...'}</Text>
            </View>
          </View>
        )}

        {/* شريط الإدخال */}
        <View style={styles.inputBar}>
          <TouchableOpacity onPress={handleVoice} style={styles.iconBtn}>
            <Animated.View style={{ transform: [{ scale: recordWave }] }}>
              <Mic size={22} color={isRecording ? '#EF4444' : '#999'} />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAttachMenu(true)} style={styles.iconBtn}>
            <Paperclip size={20} color="#999" />
          </TouchableOpacity>
          <TextInput
            style={[styles.textInput, isRTL && { textAlign: 'right' }]}
            value={input}
            onChangeText={setInput}
            placeholder={lang === 'ar' ? 'أنا هنا لأجلك... تكلم معي 💜' : "I'm here for you... talk to me 💜"}
            placeholderTextColor="#C4B5D4"
            multiline
            maxLength={2000}
            onSubmitEditing={() => send()}
          />
          {input.trim().length > 0 ? (
            <TouchableOpacity onPress={() => send()} style={styles.sendBtn}>
              <ArrowUp size={18} color="#FFF" />
            </TouchableOpacity>
          ) : <View style={{ width: 42 }} />}
        </View>

        {/* المرفقات */}
        <Modal visible={showAttachMenu} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowAttachMenu(false)}>
            <View style={styles.attachMenu}>
              <TouchableOpacity style={styles.attachItem} onPress={async () => {
                setShowAttachMenu(false);
                const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
                if (!r.canceled) addMessage('user', '[صورة]');
              }}>
                <ImageIcon size={26} color="#6B21A8" />
                <Text style={styles.attachLabel}>{lang === 'ar' ? 'صورة' : 'Image'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachItem} onPress={() => { setShowAttachMenu(false); Alert.alert(lang === 'ar' ? 'قريباً' : 'Coming Soon', ''); }}>
                <FileText size={26} color="#6B21A8" />
                <Text style={styles.attachLabel}>{lang === 'ar' ? 'ملف' : 'File'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachItem} onPress={() => setShowAttachMenu(false)}>
                <X size={26} color="#EF4444" />
                <Text style={styles.attachLabel}>{lang === 'ar' ? 'إغلاق' : 'Close'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 8 },
  headerRow1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8 },
  menuBtn: { padding: 6 },
  twinInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginLeft: 8 },
  avatarHeader: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#6B21A8', justifyContent: 'center', alignItems: 'center' },
  avatarHeaderText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  headerName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  onlineText: { fontSize: 11, color: '#10B981', fontWeight: '500' },
  calmBtn: { padding: 8 },
  headerRow2: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 16 },
  bondInfo: { flex: 1 },
  bondLabel: { fontSize: 11, color: '#999', fontWeight: '500' },
  bondValue: { fontSize: 22, fontWeight: '800', color: '#6B21A8' },
  bondStage: { fontSize: 12, color: '#6B21A8', fontWeight: '600', marginTop: 2 },
  listContent: { paddingHorizontal: 14, paddingVertical: 12, flexGrow: 1 },
  welcomeContainer: { alignItems: 'center', paddingTop: 40 },
  welcomeEmoji: { fontSize: 44, marginBottom: 10 },
  welcomeText: { fontSize: 16, color: '#1A1A1A', fontWeight: '600', textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  suggestionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F0FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E0D9F5' },
  suggestionText: { fontSize: 13, color: '#6B21A8', fontWeight: '600' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  userRow: { justifyContent: 'flex-end' },
  twinRow: { justifyContent: 'flex-start' },
  avatarMini: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6B21A8', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  avatarMiniText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  userBubble: { backgroundColor: '#6B21A8', borderBottomRightRadius: 4 },
  twinBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#EFEFEF' },
  userText: { color: '#FFF', fontSize: 15, lineHeight: 22 },
  twinText: { color: '#1A1A1A', fontSize: 15, lineHeight: 22 },
  typingRow: { paddingHorizontal: 14, paddingBottom: 6 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#EEE' },
  typingDots: { color: '#6B21A8', fontSize: 16, letterSpacing: 2 },
  typingText: { color: '#999', fontSize: 12 },
  inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 6 },
  iconBtn: { padding: 8 },
  textInput: { flex: 1, backgroundColor: '#F8F8F8', color: '#1A1A1A', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, fontSize: 15, maxHeight: 100, minHeight: 44, borderWidth: 1, borderColor: '#EFEFEF' },
  sendBtn: { backgroundColor: '#6B21A8', width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  attachMenu: { flexDirection: 'row', backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, justifyContent: 'space-around' },
  attachItem: { alignItems: 'center', gap: 6 },
  attachLabel: { fontSize: 12, color: '#666' },
});
