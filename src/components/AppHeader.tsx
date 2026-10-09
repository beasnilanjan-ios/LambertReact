import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes } from '../theme';

const backIcon = require('../assets/icon/back.png');
const menuIcon = require('../assets/imgs/menu-three-horizontal-lines-symbol.png');
const powerIcon = require('../assets/imgs/power.png');

/** Ionic toolbar height: iOS `44`, Android (Material) `56`. */
export const TOOLBAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

export interface AppHeaderProps {
  title: string;
  showMenu?: boolean;
  onMenu?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  showPower?: boolean;
  onPower?: () => void;
  right?: React.ReactNode;
  titleAlign?: 'center' | 'left';
  style?: ViewStyle;
}

/**
 * The single, global Lambert Parking header (port of Ionic `<ion-header><ion-navbar>`).
 *
 * Structure:
 *   container  → paddingTop: safe-area inset (status bar / notch / Dynamic Island)
 *   bar        → fixed Ionic toolbar height (44 iOS / 56 Android), content centred
 *
 * The safe area comes from `react-native-safe-area-context` (SafeAreaProvider is
 * mounted in App.tsx), so no device-specific padding is hardcoded anywhere.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showMenu = false,
  onMenu,
  showBack = false,
  onBack,
  showPower = false,
  onPower,
  right,
  titleAlign = 'center',
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }, style]}>
      <View style={styles.bar}>
        <View style={styles.side}>
          {showMenu ? (
            <Pressable onPress={onMenu} hitSlop={8} accessibilityLabel="Menu">
              <Image source={menuIcon} style={styles.menuIcon} />
            </Pressable>
          ) : null}
          {showBack ? (
            <Pressable onPress={onBack} hitSlop={8} accessibilityLabel="Back">
              <Image source={backIcon} style={styles.backIcon} />
            </Pressable>
          ) : null}
          {showPower && !showMenu && !showBack ? (
            <Pressable onPress={onPower} hitSlop={8} accessibilityLabel="Power">
              <Image source={powerIcon} style={styles.powerIcon} />
            </Pressable>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={[styles.title, titleAlign === 'left' ? styles.titleLeft : undefined]}>
          {title}
        </Text>
        <View style={[styles.side, styles.rightSide]}>{right}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.toolbarBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.toolbarBorderMd,
  },
  bar: {
    height: TOOLBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  side: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSide: {
    justifyContent: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#424242',
    fontSize: Platform.OS === 'ios' ? fontSizes.titleIos : fontSizes.titleMd,
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
  },
  titleLeft: {
    textAlign: 'left',
  },
  menuIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    tintColor: '#424242',
    opacity: 0.9,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#424242',
  },
  powerIcon: {
    width: 30,
    height: 30,
  },
});
