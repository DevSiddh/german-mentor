import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from './theme';

const tabs = [
  { key: 'Today', label: 'Today' },
  { key: 'Practice', label: 'Practice' },
  { key: 'Roleplay', label: 'Roleplay' },
  { key: 'Notebook', label: 'Notebook' },
] as const;

function TabIcon({ active }: { active: boolean }) {
  return (
    <View style={[styles.icon, active && styles.iconActive]}>
      <View style={[styles.dot, active && styles.dotActive]} />
    </View>
  );
}

interface BottomTabsProps {
  active: string;
  onTabPress?: (tab: string) => void;
}

export default function BottomTabs({ active, onTabPress }: BottomTabsProps) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <Pressable key={tab.key} onPress={() => onTabPress?.(tab.key)} style={styles.tabItem}>
          <TabIcon active={active === tab.key} />
          <Text style={[styles.tabText, active === tab.key && styles.tabTextActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(253, 251, 247, 0.94)',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    height: 62,
    justifyContent: 'space-around',
    marginBottom: 14,
    marginTop: 8,
    ...shadows.card,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    gap: 4,
    justifyContent: 'center',
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  iconActive: {
    backgroundColor: colors.primary,
  },
  dot: {
    backgroundColor: colors.muted,
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  tabTextActive: {
    color: colors.primary,
  },
});
