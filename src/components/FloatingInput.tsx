import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../theme';

export interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  secureTextEntry?: boolean;
}

/** Ionic `ion-label floating` + `ion-input` item (black bottom border). */
export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChangeText,
  keyboardType,
  maxLength,
  secureTextEntry,
}) => {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;

  return (
    <View style={styles.item}>
      {floating ? <Text style={styles.floatingLabel}>{label}</Text> : null}
      <TextInput
        style={[styles.input, floating ? styles.inputWithLabel : undefined]}
        placeholder={floating ? '' : label}
        placeholderTextColor={colors.label}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        underlineColorAndroid="transparent"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingTop: 6,
    minHeight: 56,
    justifyContent: 'center',
  },
  floatingLabel: {
    color: 'black',
    fontSize: 12,
    marginBottom: 2,
  },
  input: {
    color: 'black',
    fontSize: 16,
    paddingVertical: 8,
  },
  inputWithLabel: {
    paddingVertical: 4,
  },
});
