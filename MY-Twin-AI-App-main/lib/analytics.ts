import { PostHog } from 'posthog-react-native';
import { Platform } from 'react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = 'https://app.posthog.com';

let posthog: PostHog | null = null;

export const initPostHog = () => {
  if (!POSTHOG_KEY) {
    console.warn('PostHog key missing, analytics disabled.');
    return;
  }
  try {
    posthog = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      disableGeoip: false,
    });
    console.log('PostHog initialized');
  } catch (e) {
    console.error('Failed to initialize PostHog:', e);
  }
};

export const track = (event: string, properties?: Record<string, unknown>) => {
  if (!posthog) return;
  try {
    posthog.capture(event, properties);
  } catch (e) {
    console.warn('Failed to track event:', e);
  }
};

export const identifyUser = (userId: string, properties?: Record<string, unknown>) => {
  if (!posthog) return;
  try {
    posthog.identify(userId, properties);
  } catch (e) {
    console.warn('Failed to identify user:', e);
  }
};

export const resetUser = () => {
  if (!posthog) return;
  try {
    posthog.reset();
  } catch (e) {
    console.warn('Failed to reset user:', e);
  }
};

export default posthog;
