import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuKind, MenuPage } from '../navigation/types';
import { citizenMenu, guestMenu } from '../navigation/menuConfig';
import { colors, fontSizes } from '../theme';

export interface DrawerMenuProps {
  visible: boolean;
  menuKind: MenuKind;
  onClose: () => void;
  onSelect: (page: MenuPage) => void;
}

/** Port of Ionic `<ion-menu swipeEnabled="false">` (left drawer, menu closed by tap). */
const DrawerMenu: React.FC<DrawerMenuProps> = ({ visible, menuKind, onClose, onSelect }) => {
  const pages = menuKind === 'guest' ? guestMenu : citizenMenu;
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-280)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -280,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [translateX, visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[styles.panel, { paddingTop: insets.top, transform: [{ translateX }] }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
          </View>
          <ScrollView>
            {pages.map(page => (
              <Pressable
                key={page.title}
                style={styles.row}
                android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                onPress={() => onSelect(page)}>
                <Image source={page.icon} style={styles.icon} />
                <Text style={styles.label}>{page.title}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: colors.white,
    zIndex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: fontSizes.titleMd,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.87)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  icon: {
    width: 32,
    height: 32,
    marginRight: 16,
    resizeMode: 'contain',
  },
  label: {
    fontSize: fontSizes.body,
    color: 'rgba(0,0,0,0.87)',
  },
});

export default DrawerMenu;
