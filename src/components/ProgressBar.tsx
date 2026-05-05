import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from './theme';

interface ProgressBarProps {
  active: number;
}

export default function ProgressBar({ active }: ProgressBarProps) {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map((item) => (
        <View
          key={item}
          style={[
            styles.segment,
            item >= active && styles.segmentOff,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 22,
    marginTop: 10,
  },
  segment: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    flex: 1,
    height: 6,
  },
  segmentOff: {
    backgroundColor: colors.surfaceAlt,
  },
});
