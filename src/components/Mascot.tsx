import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

export type MascotState = 'idle' | 'listening' | 'encouraging' | 'correcting' | 'celebrating' | 'reviewing';

const mascots: Record<MascotState, ImageSourcePropType> = {
  idle: require('../../assets/mila/mila-idle.png'),
  listening: require('../../assets/mila/mila-listening.png'),
  encouraging: require('../../assets/mila/mila-encouraging.png'),
  correcting: require('../../assets/mila/mila-correcting.png'),
  celebrating: require('../../assets/mila/mila-celebrating.png'),
  reviewing: require('../../assets/mila/mila-reviewing.png'),
};

interface MascotProps {
  state: MascotState;
  size: number;
  centered?: boolean;
}

export default function Mascot({ state, size, centered }: MascotProps) {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    motion.setValue(0);
    const duration = state === 'listening' ? 760 : state === 'correcting' ? 420 : 2000;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [motion, state]);

  const translateY = motion.interpolate({
    inputRange: [0, 1],
    outputRange: state === 'correcting' ? [0, 0] : [0, -2],
  });
  const translateX = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: state === 'correcting' ? [-1, 1, -1] : [0, 0, 0],
  });
  const scale = motion.interpolate({
    inputRange: [0, 1],
    outputRange: state === 'listening' ? [1, 1.02] : state === 'celebrating' ? [1, 1.02] : [1, 1],
  });

  return (
    <Animated.View
      style={[
        centered && styles.center,
        {
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    >
      <View style={[styles.frame, { width: size, height: size }]}>
        <Image source={mascots[state]} style={[styles.image, { width: size, height: size }]} resizeMode="contain" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignSelf: 'center',
  },
  frame: {
    backgroundColor: '#F3EEE6',
    borderRadius: 20,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 20,
  },
});
