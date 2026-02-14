import {Vibration, Platform} from 'react-native';
import {storageService, STORAGE_KEYS} from '../services/storageService';

type HapticType =
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';

const HAPTIC_DURATIONS = {
  selection: 10,
  impactLight: 10,
  impactMedium: 15,
  impactHeavy: 20,
  notificationSuccess: 20,
  notificationWarning: 25,
  notificationError: 30,
};

let hapticsEnabled = true;

export const initHapticsPreference = async (): Promise<void> => {
  const saved = await storageService.getItem<boolean>(
    STORAGE_KEYS.HAPTICS_ENABLED,
  );
  hapticsEnabled = saved !== null ? saved : true;
};

export const setHapticsEnabled = (enabled: boolean): void => {
  hapticsEnabled = enabled;
};

export const isHapticsEnabled = (): boolean => hapticsEnabled;

export const haptic = (type: HapticType = 'impactLight'): void => {
  if (!hapticsEnabled) {
    return;
  }

  if (Platform.OS === 'android') {
    Vibration.vibrate(HAPTIC_DURATIONS[type]);
  } else {
    Vibration.vibrate(HAPTIC_DURATIONS[type]);
  }
};

export const hapticSelection = (): void => haptic('selection');

export const hapticImpact = (
  intensity: 'light' | 'medium' | 'heavy' = 'light',
): void => {
  const typeMap = {
    light: 'impactLight',
    medium: 'impactMedium',
    heavy: 'impactHeavy',
  } as const;
  haptic(typeMap[intensity]);
};

export const hapticNotification = (
  type: 'success' | 'warning' | 'error' = 'success',
): void => {
  const typeMap = {
    success: 'notificationSuccess',
    warning: 'notificationWarning',
    error: 'notificationError',
  } as const;
  haptic(typeMap[type]);
};

initHapticsPreference();
