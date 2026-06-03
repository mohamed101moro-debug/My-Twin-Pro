import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Animated } from 'react-native';
import { API } from '../lib/api';

let recording: Audio.Recording | null = null;
export const waveAnim = new Animated.Value(0);

const playBreath = async () => {
  try {
    const breath = require('../assets/breath.mp3');
    const { sound } = await Audio.Sound.createAsync(breath, { volume: 0.3 });
    await sound.playAsync();
    sound.unloadAsync();
  } catch {
    // الملف غير موجود – تجاهل
  }
};

export const startRecordingVoice = async (): Promise<boolean> => {
  try {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) throw new Error('Permission denied');

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recording = rec;

    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return true;
  } catch (err) {
    console.error('فشل بدء التسجيل:', err);
    return false;
  }
};

export const stopRecordingVoice = async (): Promise<string | null> => {
  if (!recording) return null;

  try {
    await recording.stopAndUnloadAsync();
    waveAnim.stopAnimation();
    waveAnim.setValue(0);

    const uri = recording.getURI();
    recording = null;

    if (!uri) return null;

    const formData = new FormData();
    const audioFile: { uri: string; type: string; name: string } = {
      uri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    };
    formData.append('file', audioFile as unknown as Blob);

    const { data } = await API.post('/api/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data.text;
  } catch (err) {
    console.error('فشل إيقاف التسجيل:', err);
    return null;
  }
};

// إضافة دالة لتصفية الإيموجي من النص
export const filterEmojis = (text: string): string => {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
};

// تحديث دالة speakResponse لاستخدام filterEmojis قبل النطق (النسخة المعدلة)
export const speakResponse = (text: string, tts: { pitch: number; rate: number }, provider: string = 'edge') => {
  const cleanText = filterEmojis(text);
  Speech.stop();
  setTimeout(() => {
    // هنا سيتم إضافة دعم Google TTS و ElevenLabs لاحقًا
    Speech.speak(cleanText, {
      language: 'ar',
      pitch: tts.pitch,
      rate: tts.rate,
    });
  }, 200);
};

export const stopSpeaking = () => {
  Speech.stop();
};
