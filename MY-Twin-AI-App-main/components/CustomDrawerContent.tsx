import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { supabase } from '../lib/supabase';

const MENU_ITEMS = {
  ar: [
    { icon: '🏠', label: 'الرئيسية', route: '/chat' },
    { icon: '💬', label: 'محادثة جديدة', route: '/chat' },
    { icon: '📚', label: 'المحادثات السابقة', route: '/history' },
    { icon: '👤', label: 'الملف الشخصي', route: '/profile' },
    { icon: '🧠', label: 'الذكريات', route: '/memories' },
    { icon: '🎨', label: 'تخصيص التوأم', route: '/customize' },
    { icon: '💎', label: 'الترقية', route: '/subscription' },
    { icon: '⚙️', label: 'الإعدادات', route: '/settings' },
    { icon: '❓', label: 'المساعدة', route: '/help' },
    { icon: 'ℹ️', label: 'عن التطبيق', route: '/about' },
  ],
  en: [
    { icon: '🏠', label: 'Home', route: '/chat' },
    { icon: '💬', label: 'New Chat', route: '/chat' },
    { icon: '📚', label: 'Chat History', route: '/history' },
    { icon: '👤', label: 'Profile', route: '/profile' },
    { icon: '🧠', label: 'Memories', route: '/memories' },
    { icon: '🎨', label: 'Customize Twin', route: '/customize' },
    { icon: '💎', label: 'Upgrade', route: '/subscription' },
    { icon: '⚙️', label: 'Settings', route: '/settings' },
    { icon: '❓', label: 'Help', route: '/help' },
    { icon: 'ℹ️', label: 'About', route: '/about' },
  ],
};

export default function CustomDrawerContent({ onClose }: { onClose: () => void }) {
  const { tier, twinName, bondLevel, lang } = useTwinStore();
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
          <View style={[styles.energyFill, { width: `${Math.min(bondLevel, 100)}%` as any }]} />
        </View>
        {tier === 'free' && (
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => { onClose(); router.push('/subscription' as any); }}>
            <Text style={styles.upgradeText}>{lang === 'ar' ? '⭐ ترقية' : '⭐ Upgrade'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.map((item, i) => (
        <TouchableOpacity key={i} style={styles.menuItem} onPress={() => { onClose(); router.push(item.route as any); }}>
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <Text style={styles.menuLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
        <Text style={styles.menuIcon}>🚪</Text>
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
  menuIcon: { fontSize: 22, width: 36 },
  menuLabel: { fontSize: 16, color: '#1A1A1A', fontWeight: '500', flex: 1 },
  logoutItem: { borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 16 },
  version: { textAlign: 'center', color: '#CCC', fontSize: 12, marginTop: 20, paddingBottom: 40 },
});
