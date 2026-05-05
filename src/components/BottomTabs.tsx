import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from './theme';

const tabs = [
  { key: 'Today', label: 'Today', icon: 'T' },
  { key: 'Practice', label: 'Practice', icon: 'P' },
  { key: 'Roleplay', label: 'Roleplay', icon: 'R' },
  { key: 'Notebook', label: 'Notebook', icon: 'N' },
] as const;

function TabIcon({ active, icon }: { active: boolean; icon: string }) {
  return (
    <View style={[styles.icon, active && styles.iconActive]}>
      <Text style={[styles.iconText, active && styles.iconTextActive]}>{icon}</Text>
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
          <TabIcon active={active === tab.key} icon={tab.icon} />
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
  iconText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  iconTextActive: {
    color: '#ffffff',
  },
  tabText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  tabTextActive: {
    color: colors.primary,
  },
});
