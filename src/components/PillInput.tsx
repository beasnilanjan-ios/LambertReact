import React from 'react';
import {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { colors, pillRadius } from '../theme';

export interface PillInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  style?: ViewStyle;
}

export const PillInput: React.FC<PillInputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  style,
}) => (
  <View style={[styles.control, style]}>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={colors.label}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      maxLength={maxLength}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      underlineColorAndroid="transparent"
    />
  </View>
);

const styles = StyleSheet.create({
  control: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: 'transparent',
    borderRadius: pillRadius,
    marginVertical: 20,
    width: '100%',
    height: 40,
    minHeight: 40,
    justifyContent: 'center',
  },
  input: {
    color: colors.text,
    paddingHorizontal: 11,
    paddingVertical: 11,
    width: '100%',
  },
});
