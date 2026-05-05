import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

interface ChatBubbleProps {
  side: 'left' | 'right';
  text: string;
}

export default function ChatBubble({ side, text }: ChatBubbleProps) {
  return (
    <View style={[styles.bubble, side === 'right' && styles.bubbleRight]}>
      <Text style={[styles.text, side === 'right' && styles.textRight]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    maxWidth: '82%',
    padding: 14,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  textRight: {
    color: '#ffffff',
  },
});
