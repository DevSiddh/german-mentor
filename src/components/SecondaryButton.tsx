import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from './theme';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  dark?: boolean;
}

export default function SecondaryButton({ label, onPress, dark }: SecondaryButtonProps) {
  return (
    <Pressable
      style={[styles.button, dark && styles.dark]}
      onPress={onPress}
    >
      <Text style={[styles.text, dark && styles.darkText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  dark: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  text: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '900',
  },
  darkText: {
    color: '#ffffff',
  },
});
