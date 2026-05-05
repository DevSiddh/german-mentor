import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { typography } from './theme';
import Mascot, { MascotState } from './Mascot';

interface MilaHeaderProps {
  title: string;
  subtitle: string;
  state: MascotState;
}

export default function MilaHeader({ title, subtitle, state }: MilaHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textGroup}>
        <Text style={typography.screenTitle}>{title}</Text>
        <Text style={typography.lede}>{subtitle}</Text>
      </View>
      <View style={styles.avatarWrap}>
        <Mascot state={state} size={60} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    marginTop: 0,
  },
  textGroup: {
    flex: 1,
  },
  avatarWrap: {
    alignItems: 'flex-end',
    width: 60,
  },
});
