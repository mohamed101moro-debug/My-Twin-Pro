import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // التوجيه الفوري إلى شاشة الترحيب (splash)
    // نستخدم setTimeout لضمان أن التنقل يحدث بعد تحميل مكونات التطبيق الأساسية
    const timeout = setTimeout(() => {
      router.replace('/splash');
    }, 100); // 100 مللي ثانية كافية لمنع التنقل المتكرر
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#5B4AE0" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
