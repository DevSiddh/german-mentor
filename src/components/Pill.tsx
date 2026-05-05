import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

interface PillProps {
  label: string;
  tone?: 'mint' | 'warm' | 'danger';
}

export default function Pill({ label, tone = 'mint' }: PillProps) {
  return (
    <View style={[styles.pill, tone === 'warm' && styles.pillWarm, tone === 'danger' && styles.pillDanger]}>
      <Text style={[styles.text, tone === 'warm' && styles.textWarm, tone === 'danger' && styles.textDanger]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentTint,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillWarm: {
    backgroundColor: colors.goldTint,
  },
  pillDanger: {
    backgroundColor: colors.dangerTint,
  },
  text: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  textWarm: {
    color: colors.primaryDark,
  },
  textDanger: {
    color: colors.danger,
  },
});
