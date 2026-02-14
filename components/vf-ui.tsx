import { Link } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { VibeTheme } from '@/constants/vf-theme';

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </ScrollView>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function InlineValue({ children }: { children: React.ReactNode }) {
  return <Text style={styles.inlineValue}>{children}</Text>;
}

export function Pill({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pill,
        selected ? styles.pillSelected : undefined,
        pressed ? styles.pillPressed : undefined,
        disabled ? styles.pillDisabled : undefined,
      ]}>
      <Text style={[styles.pillText, selected ? styles.pillTextSelected : undefined]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed ? styles.primaryButtonPressed : undefined,
        disabled ? styles.primaryButtonDisabled : undefined,
      ]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.ghostButton,
        pressed ? styles.ghostButtonPressed : undefined,
        disabled ? styles.ghostButtonDisabled : undefined,
      ]}>
      <Text style={styles.ghostButtonText}>{label}</Text>
    </Pressable>
  );
}

export function RouteButton({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href as never} asChild>
      <Pressable style={({ pressed }) => [styles.ghostButton, pressed ? styles.ghostButtonPressed : undefined]}>
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
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  disabled?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
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
      placeholderTextColor={VibeTheme.textMuted}
      editable={!disabled}
      style={[styles.input, disabled ? styles.inputDisabled : undefined]}
    />
  );
}

export const panelStyles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: VibeTheme.border,
    backgroundColor: VibeTheme.panel,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: VibeTheme.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 40,
    gap: 14,
  },
  title: {
    fontSize: 29,
    lineHeight: 33,
    fontWeight: '700',
    color: VibeTheme.text,
    fontFamily: 'Georgia',
  },
  subtitle: {
    color: VibeTheme.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  section: {
    borderWidth: 1,
    borderColor: VibeTheme.border,
    backgroundColor: VibeTheme.panelStrong,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: VibeTheme.text,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  label: {
    color: VibeTheme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  inlineValue: {
    color: VibeTheme.textMuted,
    fontSize: 14,
  },
  pill: {
    borderWidth: 1,
    borderColor: VibeTheme.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: VibeTheme.panel,
  },
  pillSelected: {
    backgroundColor: VibeTheme.accent,
    borderColor: VibeTheme.accent,
  },
  pillPressed: {
    opacity: 0.85,
  },
  pillDisabled: {
    opacity: 0.45,
  },
  pillText: {
    color: VibeTheme.text,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: '#fff',
  },
  primaryButton: {
    borderRadius: 12,
    backgroundColor: VibeTheme.accent,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  ghostButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: VibeTheme.border,
    backgroundColor: VibeTheme.panel,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  ghostButtonPressed: {
    opacity: 0.9,
  },
  ghostButtonDisabled: {
    opacity: 0.45,
  },
  ghostButtonText: {
    color: VibeTheme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: VibeTheme.border,
    backgroundColor: VibeTheme.panel,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: VibeTheme.text,
  },
  inputDisabled: {
    opacity: 0.5,
  },
});
