import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

interface TrainerAvatarProps {
  source?: ImageSourcePropType;
  size?: number;
  pulse?: boolean;
  centered?: boolean;
}

export default function TrainerAvatar({ source, size = 48, pulse = false, centered }: TrainerAvatarProps) {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(motion, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [motion, pulse]);

  const scale = motion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <Animated.View style={[centered && styles.center, { transform: [{ scale }] }]}>
      <View style={[styles.ring, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}>
        {source ? (
          <Image source={source} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} resizeMode="cover" />
        ) : (
          <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.initial, { fontSize: size * 0.4 }]}>M</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignSelf: 'center' },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  image: { overflow: 'hidden' },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  initial: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
