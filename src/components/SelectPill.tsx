import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes } from '../theme';

export interface SelectPillProps {
  options: string[];
  value?: string;
  disabled?: boolean;
  onSelect: (value: string) => void;
  placeholder?: string;
}

/** Ionic `ion-select` dialog, styled like `.myCustomSelect` (pill, 2px grey border). */
export const SelectPill: React.FC<SelectPillProps> = ({
  options,
  value,
  disabled,
  onSelect,
  placeholder = 'Select',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        style={[styles.pill, disabled ? styles.disabled : undefined]}
        disabled={disabled}
        onPress={() => setOpen(true)}>
        <Text style={styles.value} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.dialog}>
            <FlatList
              data={options}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    setOpen(false);
                    onSelect(item);
                  }}>
                  <View style={[styles.radio, item === value ? styles.radioSelected : undefined]} />
                  <Text style={styles.optionText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pill: {
    maxWidth: '100%',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: 'grey',
    borderRadius: 64,
    width: '100%',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  value: {
    color: colors.text,
    fontSize: fontSizes.body,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: 4,
    maxHeight: '70%',
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.grey,
    marginRight: 14,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: fontSizes.body,
    color: colors.text,
    flexShrink: 1,
  },
});
