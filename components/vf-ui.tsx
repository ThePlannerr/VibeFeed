import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

import { VibeTheme } from '@/constants/vf-theme';

const DEFAULT_SAFE_AREA_EDGES: Edge[] = ['top', 'bottom'];
const NARROW_BREAKPOINT = 420;

const useReduceMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) {
          setReduced(value);
        }
      })
      .catch(() => {
        // Ignore and keep default.
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
};

export function AppShell({
  title,
  subtitle,
  children,
  keyboardAware = true,
  safeAreaEdges = DEFAULT_SAFE_AREA_EDGES,
  contentWidth = 760,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  keyboardAware?: boolean;
  safeAreaEdges?: Edge[];
  contentWidth?: number;
}) {
  const insets = useSafeAreaInsets();
  const topInset = safeAreaEdges.includes('top') ? insets.top : 0;
  const bottomInset = safeAreaEdges.includes('bottom') ? insets.bottom : 0;
  const sideInsetLeft = safeAreaEdges.includes('left') ? insets.left : 0;
  const sideInsetRight = safeAreaEdges.includes('right') ? insets.right : 0;

  const scrollContent = (
    <ScrollView
      style={styles.root}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topInset + VibeTheme.space.lg,
          paddingBottom: bottomInset + VibeTheme.space.xl,
          paddingLeft: sideInsetLeft + VibeTheme.space.md,
          paddingRight: sideInsetRight + VibeTheme.space.md,
        },
      ]}>
      <View style={[styles.contentInner, { maxWidth: contentWidth }]}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[VibeTheme.colors.backgroundAlt, VibeTheme.colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={styles.shell}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 6 : 0}>
          {scrollContent}
        </KeyboardAvoidingView>
      ) : (
        scrollContent
      )}
    </View>
  );
}

export function Section({
  title,
  children,
  delayMs = 0,
}: {
  title: string;
  children: React.ReactNode;
  delayMs?: number;
}) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: VibeTheme.motion.normal,
      delay: delayMs,
      useNativeDriver: true,
    }).start();
  }, [delayMs, progress, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
            },
          ],
        },
      ]}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </Animated.View>
  );
}

export function Row({
  children,
  stackOnNarrow,
  wrap = true,
}: {
  children: React.ReactNode;
  stackOnNarrow?: boolean;
  wrap?: boolean;
}) {
  const { width } = useWindowDimensions();
  const shouldStack = Boolean(stackOnNarrow && width < NARROW_BREAKPOINT);

  return (
    <View
      style={[
        styles.row,
        shouldStack ? styles.rowStack : undefined,
        !wrap || shouldStack ? styles.rowNoWrap : undefined,
      ]}>
      {children}
    </View>
  );
}

export function FormRow({ children }: { children: React.ReactNode }) {
  return <Row stackOnNarrow wrap={false}>{children}</Row>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function InlineValue({ children }: { children: React.ReactNode }) {
  return <Text style={styles.inlineValue}>{children}</Text>;
}

export function BodyText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.bodyText}>{children}</Text>;
}

export function MutedText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.mutedText}>{children}</Text>;
}

export function Pill({
  label,
  selected,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const blocked = Boolean(disabled);
  if (!onPress) {
    return (
      <View style={[styles.pill, selected ? styles.pillSelected : undefined]} accessible={false}>
        <Text style={[styles.pillText, selected ? styles.pillTextSelected : undefined]}>{label}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, selected: Boolean(selected) }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.pill,
        selected ? styles.pillSelected : undefined,
        pressed ? styles.pillPressed : undefined,
        blocked ? styles.pillDisabled : undefined,
      ]}>
      <Text style={[styles.pillText, selected ? styles.pillTextSelected : undefined]}>{label}</Text>
    </Pressable>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
};

export function PrimaryButton({ label, onPress, disabled, loading, accessibilityLabel }: ButtonProps) {
  const blocked = Boolean(disabled || loading);
  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.buttonBase,
        styles.primaryButton,
        pressed ? styles.buttonPressed : undefined,
        blocked ? styles.buttonDisabled : undefined,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={VibeTheme.colors.onAccent} />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function GhostButton({ label, onPress, disabled, loading, accessibilityLabel }: ButtonProps) {
  const blocked = Boolean(disabled || loading);
  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.buttonBase,
        styles.ghostButton,
        pressed ? styles.buttonPressed : undefined,
        blocked ? styles.buttonDisabled : undefined,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={VibeTheme.colors.text} />
      ) : (
        <Text style={styles.ghostButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function RouteButton({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href as never} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.buttonBase, styles.ghostButton, pressed ? styles.buttonPressed : undefined]}>
        <Text style={styles.ghostButtonText}>{label}</Text>
      </Pressable>
    </Link>
  );
}

export function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  disabled,
  secureTextEntry,
  autoCapitalize,
  autoCorrect,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  disabled?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      accessibilityLabel={accessibilityLabel ?? placeholder}
      placeholderTextColor={VibeTheme.textMuted}
      selectionColor={VibeTheme.accent}
      editable={!disabled}
      style={[styles.input, disabled ? styles.inputDisabled : undefined]}
    />
  );
}

export const panelStyles = StyleSheet.create({
  panel: {
    borderWidth: VibeTheme.stroke.thin,
    borderColor: VibeTheme.border,
    backgroundColor: VibeTheme.panel,
    borderRadius: VibeTheme.radius.md,
    padding: VibeTheme.space.md,
    gap: VibeTheme.space.sm,
  },
});

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: VibeTheme.bg,
  },
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flexGrow: 1,
  },
  contentInner: {
    alignSelf: 'center',
    width: '100%',
    gap: VibeTheme.space.md,
  },
  title: {
    fontSize: VibeTheme.type.size.xxl,
    lineHeight: VibeTheme.type.lineHeight.xxl,
    color: VibeTheme.text,
    fontFamily: VibeTheme.type.family.display,
    letterSpacing: 0.4,
  },
  subtitle: {
    color: VibeTheme.textMuted,
    fontSize: VibeTheme.type.size.md,
    lineHeight: VibeTheme.type.lineHeight.md,
    fontFamily: VibeTheme.type.family.body,
  },
  section: {
    borderWidth: VibeTheme.stroke.thin,
    borderColor: VibeTheme.border,
    backgroundColor: VibeTheme.panelStrong,
    borderRadius: VibeTheme.radius.lg,
    padding: VibeTheme.space.md,
    gap: VibeTheme.space.sm,
  },
  sectionTitle: {
    fontSize: VibeTheme.type.size.lg,
    lineHeight: VibeTheme.type.lineHeight.lg,
    color: VibeTheme.text,
    fontFamily: VibeTheme.type.family.bodyStrong,
  },
  row: {
    flexDirection: 'row',
    gap: VibeTheme.space.sm,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  rowStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  rowNoWrap: {
    flexWrap: 'nowrap',
  },
  label: {
    color: VibeTheme.text,
    fontSize: VibeTheme.type.size.sm,
    lineHeight: VibeTheme.type.lineHeight.sm,
    fontFamily: VibeTheme.type.family.bodyStrong,
  },
  inlineValue: {
    color: VibeTheme.textMuted,
    fontFamily: VibeTheme.type.family.bodyStrong,
  },
  bodyText: {
    color: VibeTheme.text,
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.md,
    lineHeight: VibeTheme.type.lineHeight.md,
  },
  mutedText: {
    color: VibeTheme.textMuted,
    fontFamily: VibeTheme.type.family.body,
    fontSize: VibeTheme.type.size.sm,
    lineHeight: VibeTheme.type.lineHeight.sm,
  },
  pill: {
    borderWidth: VibeTheme.stroke.thin,
    borderColor: VibeTheme.border,
    minHeight: 44,
    paddingVertical: VibeTheme.space.sm,
    paddingHorizontal: VibeTheme.space.md,
    borderRadius: VibeTheme.radius.pill,
    backgroundColor: VibeTheme.panel,
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: VibeTheme.accent,
    borderColor: VibeTheme.accent,
  },
  pillPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  pillDisabled: {
    opacity: 0.5,
  },
  pillText: {
    color: VibeTheme.text,
    fontSize: VibeTheme.type.size.sm,
    lineHeight: VibeTheme.type.lineHeight.sm,
    fontFamily: VibeTheme.type.family.bodyStrong,
  },
  pillTextSelected: {
    color: VibeTheme.colors.onAccent,
  },
  buttonBase: {
    minHeight: 48,
    borderRadius: VibeTheme.radius.md,
    paddingVertical: VibeTheme.space.sm,
    paddingHorizontal: VibeTheme.space.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  primaryButton: {
    backgroundColor: VibeTheme.accent,
  },
  primaryButtonText: {
    color: VibeTheme.colors.onAccent,
    fontSize: VibeTheme.type.size.md,
    lineHeight: VibeTheme.type.lineHeight.md,
    fontFamily: VibeTheme.type.family.bodyStrong,
  },
  ghostButton: {
    borderWidth: VibeTheme.stroke.thin,
    borderColor: VibeTheme.border,
    backgroundColor: VibeTheme.panel,
  },
  ghostButtonText: {
    color: VibeTheme.text,
    fontSize: VibeTheme.type.size.md,
    lineHeight: VibeTheme.type.lineHeight.md,
    fontFamily: VibeTheme.type.family.bodyStrong,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  input: {
    borderWidth: VibeTheme.stroke.thin,
    borderColor: VibeTheme.border,
    backgroundColor: VibeTheme.panel,
    borderRadius: VibeTheme.radius.sm,
    paddingHorizontal: VibeTheme.space.md,
    minHeight: 48,
    color: VibeTheme.text,
    fontSize: VibeTheme.type.size.md,
    lineHeight: VibeTheme.type.lineHeight.md,
    fontFamily: VibeTheme.type.family.body,
    flex: 1,
  },
  inputDisabled: {
    opacity: 0.5,
  },
});
