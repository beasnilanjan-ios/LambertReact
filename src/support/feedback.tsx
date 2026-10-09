import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { colors, fontSizes } from '../theme';

export interface AlertButton {
  text: string;
  role?: 'cancel' | 'destructive' | 'ok';
  onPress?: () => void;
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons: AlertButton[];
  backdropDismiss?: boolean;
}

export const showAlertWithButtons = (title: string, message: string | undefined, buttons: AlertButton[]): void => {
  if (globalShowAlert) {
    globalShowAlert({ title, message, buttons });
  } else {
    console.log(`[alert] ${title}: ${message ?? ''}`, buttons.map(b => b.text));
    buttons.forEach(b => b.onPress?.());
  }
};

interface FeedbackContextValue {
  showAlert: (title: string, message?: string) => void;
  showConfirm: (
    title: string,
    message: string | undefined,
    cancelText: string,
    okText: string,
    onOk: () => void,
    onCancel?: () => void,
  ) => void;
  showError: (message: string) => void;
  showToast: (message: string, durationMs?: number) => void;
  presentLoading: (content?: string) => void;
  dismissLoading: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

export const useFeedback = (): FeedbackContextValue => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return ctx;
};

let globalShowAlert: ((options: AlertOptions) => void) | null = null;
let globalLoadingSetter: ((visible: boolean, text: string) => void) | null = null;
let loadingTimer: ReturnType<typeof setTimeout> | null = null;

/** AlertCustom.showAlert(title, msg) — backdrop-locked, single OK (optional handler). */
export const showAlert = (title: string, message?: string, onOk?: () => void): void => {
  if (globalShowAlert) {
    globalShowAlert({ title, message, buttons: [{ text: 'OK', role: 'ok', onPress: onOk }] });
  } else {
    console.log(`[alert] ${title}: ${message ?? ''}`);
  }
};

/** Per-page confirm pattern (Cancel / Yes). */
export const showConfirm = (
  title: string,
  message: string | undefined,
  cancelText: string,
  okText: string,
  onOk: () => void,
  onCancel?: () => void,
): void => {
  if (globalShowAlert) {
    globalShowAlert({
      title,
      message,
      buttons: [
        { text: cancelText, role: 'cancel', onPress: onCancel },
        { text: okText, role: 'ok', onPress: onOk },
      ],
    });
  } else {
    console.log(`[confirm] ${title}: ${message}`);
    onOk();
  }
};

/** Page showError(e) — alert `Error` + `Dismiss`. */
export const showError = (message: string): void => {
  if (globalShowAlert) {
    globalShowAlert({
      title: 'Error',
      message,
      buttons: [{ text: 'Dismiss', role: 'cancel' }],
    });
  } else {
    console.error(`[error] ${message}`);
  }
};

/** Page showToast(msj) — 1000 ms ToastAndroid on Android, RN Toast fallback iOS. */
export const showToast = (message: string, durationMs = 1000): void => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, durationMs > 1000 ? ToastAndroid.LONG : ToastAndroid.SHORT);
  } else {
    console.log(`[toast] ${message}`);
  }
};

/** ActivityLoader.presentLoading — "Please wait...", circles spinner, orange text, 50 s auto-dismiss. */
export const presentLoading = (content = 'Please wait...'): void => {
  globalLoadingSetter?.(true, content);
  if (loadingTimer) {
    clearTimeout(loadingTimer);
  }
  loadingTimer = setTimeout(() => {
    globalLoadingSetter?.(false, content);
  }, 50000);
};

export const dismissLoading = (): void => {
  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }
  globalLoadingSetter?.(false, 'Please wait...');
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const [loading, setLoading] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: 'Please wait...',
  });
  const alertRef = useRef<AlertOptions | null>(null);
  alertRef.current = alert;

  useEffect(() => {
    globalShowAlert = (options: AlertOptions) => {
      setAlert(options);
    };
    globalLoadingSetter = (visible: boolean, text: string) => {
      setLoading({ visible, text });
    };
    return () => {
      globalShowAlert = null;
      globalLoadingSetter = null;
    };
  }, []);

  const handleButton = useCallback((button: AlertButton) => {
    button.onPress?.();
    console.log(`${button.text} clicked`);
    setAlert(null);
  }, []);

  const ctx: FeedbackContextValue = {
    showAlert,
    showConfirm,
    showError,
    showToast,
    presentLoading,
    dismissLoading,
  };

  return (
    <FeedbackContext.Provider value={ctx}>
      {children}
      <Modal
        transparent
        visible={alert !== null}
        animationType="fade"
        onRequestClose={() => {
          const cancel = alert?.buttons.find(b => b.role === 'cancel');
          if (cancel) {
            handleButton(cancel);
          }
        }}>
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (alert?.backdropDismiss) {
              setAlert(null);
            }
          }}>
          <Pressable style={styles.alertBox} onPress={() => {}}>
            {alert?.title ? <Text style={styles.title}>{alert.title}</Text> : null}
            {alert?.message ? <Text style={styles.message}>{alert.message}</Text> : null}
            <View style={styles.buttonRow}>
              {alert?.buttons.map((button, index) => (
                <Pressable
                  key={`${button.text}-${index}`}
                  style={styles.button}
                  onPress={() => handleButton(button)}>
                  <Text
                    style={[
                      styles.buttonText,
                      button.role === 'cancel' ? styles.cancelText : undefined,
                    ]}>
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal transparent visible={loading.visible} animationType="fade">
        <View style={styles.loadingBackdrop}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.loadingText} />
            <Text style={styles.loadingText}>{loading.text}</Text>
          </View>
        </View>
      </Modal>
    </FeedbackContext.Provider>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBox: {
    maxWidth: 280,
    width: 280,
    backgroundColor: colors.alertBackground,
    borderRadius: 2,
    paddingTop: 22,
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  title: {
    color: 'rgba(0,0,0,0.87)',
    fontSize: 22,
    fontWeight: '500',
    marginBottom: 10,
  },
  message: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginLeft: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.primary,
    fontSize: fontSizes.body,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cancelText: {
    color: colors.primary,
    opacity: 0.9,
  },
  loadingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.loadingText,
    fontSize: fontSizes.body,
  },
});
