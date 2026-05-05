import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, typography } from './theme';
import TrainerAvatar from './TrainerAvatar';

interface MilaCoachRowProps {
  label?: string;
  message?: string;
  style?: ViewStyle;
}

export default function MilaCoachRow({ label = 'Mila sagt', message, style }: MilaCoachRowProps) {
  return (
    <View style={[styles.row, style]}>
      <TrainerAvatar size={28} />
      <Text style={styles.name}>{label}</Text>
      {message ? <Text style={typography.muted}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  name: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
});
