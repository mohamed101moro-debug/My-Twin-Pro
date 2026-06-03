
// تسجيل الجلسة النشطة عند نجاح تسجيل الدخول
export const recordActiveSession = async (userId: string, device: string, ip: string) => {
  try {
    const { error } = await supabase
      .from('active_sessions')
      .insert({
        user_id: userId,
        device: device || 'unknown',
        ip: ip || 'unknown',
        last_seen: new Date().toISOString(),
      });
    if (error) console.warn('Failed to record session:', error);
  } catch (e) {
    console.warn('Exception recording session:', e);
  }
};

// تحديث وقت آخر ظهور للجلسة
export const updateSessionLastSeen = async (userId: string) => {
  try {
    await supabase
      .from('active_sessions')
      .update({ last_seen: new Date().toISOString() })
      .eq('user_id', userId)
      .order('last_seen', { ascending: false })
      .limit(1);
  } catch (e) {
    console.warn('Failed to update session:', e);
  }
};
