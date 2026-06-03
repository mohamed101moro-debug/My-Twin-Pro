import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { supabase } from '../lib/supabase';
import { 
  Home, 
  MessageCircle, 
  History, 
  User, 
  BrainCircuit, 
  Palette, 
  Diamond, 
  Settings, 
  HelpCircle, 
  Info, 
  LogOut 
} from 'lucide-react-native';

const MENU_ITEMS = {
  ar: [
    { icon: Home, label: 'الرئيسية', route: '/chat', action: 'home' },
    { icon: MessageCircle, label: 'محادثة جديدة', route: '/chat', action: 'new' },
    { icon: History, label: 'المحادثات السابقة', route: '/history' },
    { icon: User, label: 'الملف الشخصي', route: '/profile' },
    { icon: BrainCircuit, label: 'الذكريات', route: '/memories' },
    { icon: Palette, label: 'تخصيص التوأم', route: '/customize' },
    { icon: Diamond, label: 'الترقية', route: '/subscription' },
    { icon: Settings, label: 'الإعدادات', route: '/settings' },
    { icon: HelpCircle, label: 'المساعدة', route: '/help' },
    { icon: Info, label: 'عن التطبيق', route: '/about' },
  ],
  en: [
    { icon: Home, label: 'Home', route: '/chat', action: 'home' },
    { icon: MessageCircle, label: 'New Chat', route: '/chat', action: 'new' },
    { icon: History, label: 'Chat History', route: '/history' },
    { icon: User, label: 'Profile', route: '/profile' },
    { icon: BrainCircuit, label: 'Memories', route: '/memories' },
    { icon: Palette, label: 'Customize Twin', route: '/customize' },
    { icon: Diamond, label: 'Upgrade', route: '/subscription' },
    { icon: Settings, label: 'Settings', route: '/settings' },
    { icon: HelpCircle, label: 'Help', route: '/help' },
    { icon: Info, label: 'About', route: '/about' },
  ],
};

export default function CustomDrawerContent({ onClose }: { onClose: () => void }) {
  const { tier, twinName, bondLevel, lang, clearHistory } = useTwinStore();
  const items = MENU_ITEMS[lang] || MENU_ITEMS.ar;
  const stage = bondLevel >= 95 ? (lang === 'ar' ? 'توأم روح' : 'Soulmate')
    : bondLevel >= 80 ? (lang === 'ar' ? 'ارتباط' : 'Bonded')
    : bondLevel >= 60 ? (lang === 'ar' ? 'ثقة' : 'Trusted')
    : bondLevel >= 40 ? (lang === 'ar' ? 'مقربين' : 'Close')
    : bondLevel >= 20 ? (lang === 'ar' ? 'أصدقاء' : 'Friends')
    : (lang === 'ar' ? 'غرباء' : 'Strangers');

  const handleLogout = () => {
    Alert.alert(
      lang === 'ar' ? 'تسجيل الخروج' : 'Logout',
      lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?',
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: lang === 'ar' ? 'خروج' : 'Logout', style: 'destructive',
          onPress: async () => { await supabase.auth.signOut(); router.replace('/login'); }
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.twinCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{twinName?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.twinName}>{twinName || 'توأمك'}</Text>
        <Text style={styles.stage}>{stage} • {bondLevel.toFixed(0)}%</Text>
        <View style={styles.energyBar}>
          <View style={[styles.energyFill, { width: `${Math.min(bondLevel, 100)}%` }]} />
        </View>
        {tier === 'free' && (
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => { onClose(); router.push('/subscription'); }}>
            <Text style={styles.upgradeText}>{lang === 'ar' ? '⭐ ترقية' : '⭐ Upgrade'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.map((item, i) => (
        <TouchableOpacity key={i} style={styles.menuItem} onPress={() => {
          onClose();
          if (item.action === 'new') {
            clearHistory();
            router.push(item.route);
          } else {
            router.push(item.route);
          }
        }}>
          <item.icon size={22} color="#4A1D6F" />
          <Text style={styles.menuLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
        <LogOut size={22} color="#EF4444" />
        <Text style={[styles.menuLabel, { color: '#EF4444' }]}>
          {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.version}>MyTwin v6.3.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  twinCard: { alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#6B21A8', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  twinName: { color: '#1A1A1A', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  stage: { color: '#888', fontSize: 13, marginBottom: 10 },
  energyBar: { width: '80%', height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  energyFill: { height: '100%', backgroundColor: '#6B21A8', borderRadius: 3 },
  upgradeBtn: { marginTop: 12, backgroundColor: '#6B21A8', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  upgradeText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  menuLabel: { fontSize: 16, color: '#1A1A1A', fontWeight: '500', flex: 1 },
  logoutItem: { borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 16 },
  version: { textAlign: 'center', color: '#CCC', fontSize: 12, marginTop: 20, paddingBottom: 40 },
});
