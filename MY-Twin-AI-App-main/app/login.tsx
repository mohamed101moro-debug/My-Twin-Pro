import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';
import { useTwinStore } from '../store/useTwinStore';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const { setAuth, lang, setLang } = useTwinStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isAr = lang === 'ar';

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const redirectTo = makeRedirectUri({ scheme: 'com.mohamed101.mytwinpro' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success') {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) { setAuth(session.user.id); router.replace('/chat'); }
        }
      }
    } catch (e: any) {
      Alert.alert(isAr ? 'خطأ' : 'Error', e.message);
    } finally { setLoading(false); }
  };

  const signInWithEmail = async () => {
    if (!email || !password) { Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'أدخل البريد وكلمة المرور' : 'Enter email and password'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert(isAr ? 'خطأ' : 'Error', error.message);
      else if (data.user) { setAuth(data.user.id); router.replace('/chat'); }
    } catch { Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'تعذر الاتصال' : 'Connection failed'); }
    finally { setLoading(false); }
  };

  const signUpWithEmail = async () => {
    if (!email || !password) { Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'أدخل البريد وكلمة المرور' : 'Enter email and password'); return; }
    if (password.length < 6) { Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'كلمة المرور 6 أحرف على الأقل' : 'Min 6 characters'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) Alert.alert(isAr ? 'خطأ' : 'Error', error.message);
      else Alert.alert(isAr ? 'تم ✅' : 'Done ✅', isAr ? 'تم إرسال رابط التأكيد' : 'Confirmation link sent');
    } catch { Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'تعذر الاتصال' : 'Connection failed'); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.langBtn} onPress={() => setLang(isAr ? 'en' : 'ar')}>
        <Text style={s.langText}>{isAr ? '🌐 English' : '🌐 العربية'}</Text>
      </TouchableOpacity>
      <Text style={s.heading}>MyTwin 💜</Text>
      <Text style={s.sub}>{isAr ? 'سجّل دخولك وابدأ رحلتك' : 'Sign in and start your journey'}</Text>
      <TouchableOpacity style={s.googleBtn} onPress={signInWithGoogle} disabled={loading}>
        <Text style={s.googleIcon}>G</Text>
        <Text style={s.googleText}>{isAr ? 'تسجيل الدخول عن طريق جوجل' : 'Sign in with Google'}</Text>
      </TouchableOpacity>
      <View style={s.divider}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>{isAr ? 'أو' : 'or'}</Text>
        <View style={s.dividerLine} />
      </View>
      <TextInput style={s.input} placeholder={isAr ? 'البريد الإلكتروني' : 'Email'} placeholderTextColor="#A09BB5" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" textAlign={isAr ? 'right' : 'left'} />
      <View style={s.passwordContainer}>
        <TextInput style={s.passwordInput} placeholder={isAr ? 'كلمة المرور' : 'Password'} placeholderTextColor="#A09BB5" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} textAlign={isAr ? 'right' : 'left'} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
          <Text style={s.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={s.button} onPress={signInWithEmail} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.buttonText}>{isAr ? 'تسجيل الدخول' : 'Sign In'}</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={[s.button, s.outline]} onPress={signUpWithEmail} disabled={loading}>
        <Text style={[s.buttonText, s.outlineText]}>{isAr ? 'إنشاء حساب جديد' : 'Create Account'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24, justifyContent: 'center' },
  langBtn: { position: 'absolute', top: 50, right: 24, backgroundColor: '#F3F0FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E0D9F5' },
  langText: { color: '#6B21A8', fontSize: 14, fontWeight: '600' },
  heading: { fontSize: 32, fontWeight: '800', color: '#1A1226', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 16, color: '#6B5B8A', textAlign: 'center', marginBottom: 32 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D0D5DD', padding: 14, borderRadius: 12, marginBottom: 8, gap: 10 },
  googleIcon: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleText: { fontSize: 16, fontWeight: '600', color: '#1A1226' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0D9F5' },
  dividerText: { color: '#A09BB5', fontSize: 14 },
  input: { backgroundColor: '#F8F6F2', color: '#1A1226', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E0D9F5', fontSize: 15 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F6F2', borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E0D9F5' },
  passwordInput: { flex: 1, color: '#1A1226', padding: 14, fontSize: 15 },
  eyeBtn: { padding: 12 },
  eyeIcon: { fontSize: 18 },
  button: { backgroundColor: '#6B21A8', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#6B21A8' },
  outlineText: { color: '#6B21A8' },
});
