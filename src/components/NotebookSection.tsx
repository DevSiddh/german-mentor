import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from './theme';
import Card from './Card';

export type SectionAccent = 'sage' | 'amber' | 'gold' | 'coral';

const accentMap: Record<SectionAccent, string> = {
  sage: colors.accent,
  amber: colors.primary,
  gold: colors.gold,
  coral: colors.danger,
};

interface NotebookSectionProps {
  title: string;
  accent: SectionAccent;
  children: React.ReactNode;
}

export default function NotebookSection({ title, accent, children }: NotebookSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={typography.sectionTitle}>{title}</Text>
      <Card style={[styles.card, { borderLeftColor: accentMap[accent], borderLeftWidth: 4 }]}>
        {children}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  card: {
    marginTop: 8,
  },
});
