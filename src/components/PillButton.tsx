import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, ctaHeight, fontSizes, pillRadius } from '../theme';

export interface PillButtonProps {
  label: string;
  color?: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: any;
  disabled?: boolean;
}

export const PillButton: React.FC<PillButtonProps> = ({
  label,
  color = colors.primary,
  onPress,
  style,
  textStyle,
  disabled,
}) => {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: color, opacity: pressed ? 0.85 : disabled ? 0.6 : 1 },
        style,
      ]}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </Pressable>
  );
};

export interface IconButtonProps {
  source: ImageSourcePropType;
  onPress: () => void;
  style?: ViewStyle;
  imageStyle?: any;
  accessibilityLabel?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  source,
  onPress,
  style,
  imageStyle,
  accessibilityLabel,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    hitSlop={8}
    style={[styles.iconButton, style]}>
    <Image source={source} style={imageStyle} />
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: ctaHeight,
    borderRadius: pillRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  label: {
    color: colors.white,
    fontSize: fontSizes.body,
    fontWeight: '600',
    textTransform: 'none',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
