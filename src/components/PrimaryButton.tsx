import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, shadows, spacing } from './theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  compact?: boolean;
}

export default function PrimaryButton({ label, onPress, compact }: PrimaryButtonProps) {
  return (
    <Pressable
      style={[styles.button, compact && styles.compact]}
      onPress={onPress}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 22,
    minHeight: spacing.buttonMinHeight,
    paddingHorizontal: 18,
    ...shadows.button,
  },
  compact: {
    flex: 1,
    marginTop: 0,
    minHeight: spacing.compactButtonMinHeight,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
