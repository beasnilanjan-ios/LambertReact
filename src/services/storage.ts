import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalKeys, NativeKeys } from '../constants/storage';

export const localGet = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.error('localGet error', e);
    return null;
  }
};

export const localSet = async (key: string, value: string | null): Promise<void> => {
  try {
    if (value === null || value === undefined) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, String(value));
    }
  } catch (e) {
    console.error('localSet error', e);
  }
};

export const localClear = async (): Promise<void> => {
  try {
    for (const key of Object.values(LocalKeys)) {
      await AsyncStorage.removeItem(key);
    }
  } catch (e) {
    console.error('localClear error', e);
  }
};

export const nativeGet = async <T = any>(key: string): Promise<T> => {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null || raw === undefined) {
    throw new Error('Item not found');
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
};

export const nativeSet = async (key: string, value: any): Promise<void> => {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await AsyncStorage.setItem(key, serialized);
};

export const nativeClear = async (): Promise<void> => {
  try {
    for (const key of Object.values(NativeKeys)) {
      await AsyncStorage.removeItem(key);
    }
  } catch (e) {
    console.error('nativeClear error', e);
  }
};
