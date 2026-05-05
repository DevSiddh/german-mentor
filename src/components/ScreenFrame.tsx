import React from 'react';
import { Platform, ScrollView, StatusBar as NativeStatusBar, StyleSheet, View } from 'react-native';
import { colors, spacing } from './theme';
import BottomTabs from './BottomTabs';

interface ScreenFrameProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

export default function ScreenFrame({ children, activeTab, onTabPress }: ScreenFrameProps) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {activeTab ? <BottomTabs active={activeTab} onTabPress={onTabPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.horizontal,
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: spacing.scrollBottomPadding,
  },
});
