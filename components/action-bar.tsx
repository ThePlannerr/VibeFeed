import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { VibeTheme } from '@/constants/vf-theme';

type ActionBarProps = {
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onSave: () => void;
  isSaved: boolean;
  disabled: boolean;
};

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  borderColor: string;
  size?: number;
  onPress: () => void;
  disabled: boolean;
  label: string;
  large?: boolean;
};

function ActionButton({
  icon,
  color,
  bgColor,
  borderColor,
  size = 24,
  onPress,
  disabled,
  label,
  large,
}: ActionButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        large ? styles.buttonLarge : undefined,
        { backgroundColor: bgColor, borderColor },
        pressed ? styles.pressed : undefined,
        disabled ? styles.disabled : undefined,
      ]}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function ActionBar({ onPass, onLike, onSuperLike, onSave, isSaved, disabled }: ActionBarProps) {
  return (
    <View style={styles.bar}>
      <ActionButton
        icon="close"
        color="#96A6C6"
        bgColor="rgba(150, 166, 198, 0.1)"
        borderColor="rgba(150, 166, 198, 0.3)"
        onPress={onPass}
        disabled={disabled}
        label="Pass"
      />
      <ActionButton
        icon="heart"
        color={VibeTheme.colors.accentAlt}
        bgColor="rgba(39, 232, 167, 0.1)"
        borderColor="rgba(39, 232, 167, 0.35)"
        size={28}
        onPress={onLike}
        disabled={disabled}
        label="Like"
        large
      />
      <ActionButton
        icon="flame"
        color={VibeTheme.colors.accent}
        bgColor="rgba(255, 42, 61, 0.12)"
        borderColor="rgba(255, 42, 61, 0.4)"
        size={28}
        onPress={onSuperLike}
        disabled={disabled}
        label="Super Like"
        large
      />
      <ActionButton
        icon={isSaved ? 'bookmark' : 'bookmark-outline'}
        color={isSaved ? '#FFD166' : '#96A6C6'}
        bgColor={isSaved ? 'rgba(255, 209, 102, 0.12)' : 'rgba(150, 166, 198, 0.1)'}
        borderColor={isSaved ? 'rgba(255, 209, 102, 0.4)' : 'rgba(150, 166, 198, 0.3)'}
        onPress={onSave}
        disabled={disabled}
        label={isSaved ? 'Unsave' : 'Save'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: VibeTheme.space.md,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLarge: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  pressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },
});
