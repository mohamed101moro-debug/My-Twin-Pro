import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTwinStore } from '../store/useTwinStore';
import { COLORS, FONTS } from '../utils/theme';

const TEXTS = {
  ar: { title: '📚 المحادثات السابقة', search: 'بحث...', all: 'الكل', today: 'اليوم', week: 'أسبوع', month: 'شهر', empty: 'لا توجد محادثات بعد', delete: 'حذف', deleteConfirm: 'هل أنت متأكد من حذف هذه المحادثة؟' },
  en: { title: '📚 Chat History', search: 'Search...', all: 'All', today: 'Today', week: 'Week', month: 'Month', empty: 'No conversations yet', delete: 'Delete', deleteConfirm: 'Are you sure you want to delete this chat?' },
};

type HistoryMessage = {
  id: string;
  content: string;
  created_at: string;
};

export default function History() {
  const { userId, lang } = useTwinStore();
  const [messages, setMessages] = useState<HistoryMessage[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const t = TEXTS[lang] || TEXTS.ar;
  const getFilterLabel = (filterKey: string) => {
    switch (filterKey) {
      case 'today': return t.today;
      case 'week': return t.week;
      case 'month': return t.month;
      default: return t.all;
    }
  };

  const fetchMessages = useCallback(async () => {
    if (!userId) return;
    let query = supabase.from('messages').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    if (filter === 'today') query = query.gte('created_at', new Date().toISOString().split('T')[0]);
    else if (filter === 'week') query = query.gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    else if (filter === 'month') query = query.gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    if (search) query = query.ilike('content', `%${search}%`);
    const { data } = await query;
    setMessages(data || []);
  }, [userId, filter, search]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const deleteMessage = async (id: string) => {
    Alert.alert(t.delete, t.deleteConfirm, [
      { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: async () => { await supabase.from('messages').delete().eq('id', id); fetchMessages(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.title}</Text>
      <TextInput style={styles.searchInput} placeholder={t.search} placeholderTextColor={COLORS.textSecondary} value={search} onChangeText={setSearch} />
      <View style={styles.filterRow}>
        {['all', 'today', 'week', 'month'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterActiveText]}>{getFilterLabel(f)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={messages} keyExtractor={(item) => item.id} renderItem={({ item }: { item: HistoryMessage }) => (
        <View style={styles.chatItem}>
          <View style={styles.chatInfo}>
            <Text style={styles.chatDate}>{new Date(item.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</Text>
            <Text style={styles.chatPreview} numberOfLines={1}>{item.content}</Text>
          </View>
          <TouchableOpacity onPress={() => deleteMessage(item.id)}><Text style={styles.deleteIcon}>🗑️</Text></TouchableOpacity>
        </View>
      )} ListEmptyComponent={<Text style={styles.empty}>{t.empty}</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: FONTS.title, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  searchInput: { backgroundColor: COLORS.card, color: COLORS.text, padding: 12, borderRadius: 12, fontSize: FONTS.body, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  filterActive: { backgroundColor: COLORS.primary },
  filterText: { color: COLORS.text, fontSize: FONTS.small },
  filterActiveText: { color: COLORS.white },
  chatItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  chatInfo: { flex: 1 },
  chatDate: { color: COLORS.textSecondary, fontSize: FONTS.small, marginBottom: 4 },
  chatPreview: { color: COLORS.text, fontSize: FONTS.body },
  deleteIcon: { fontSize: 20 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, fontSize: FONTS.body },
});
