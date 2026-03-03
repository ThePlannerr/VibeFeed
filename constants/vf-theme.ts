const baseTheme = {
  colors: {
    background: '#04050A',
    backgroundAlt: '#0E1728',
    surface: '#101728',
    surfaceStrong: '#142039',
    surfaceElevated: '#1E2F50',
    text: '#F7FAFF',
    textMuted: '#96A6C6',
    accent: '#FF2A3D',
    accentAlt: '#27E8A7',
    border: '#2A3C60',
    danger: '#FF6D6D',
    success: '#37D39D',
    onAccent: '#FFFFFF',
    onAccentAlt: '#07120E',
  },
  type: {
    family: {
      display: 'PlayfairDisplay-Bold',
      body: 'SourceSans3-Regular',
      bodyStrong: 'SourceSans3-SemiBold',
    },
    size: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 26,
      xxl: 38,
      hero: 48,
      mega: 56,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 29,
      xl: 37,
      xxl: 46,
      hero: 54,
      mega: 62,
    },
  },
  space: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 30,
    xxl: 42,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 24,
    pill: 999,
  },
  stroke: {
    thin: 1,
    regular: 2,
  },
  motion: {
    fast: 140,
    normal: 260,
    slow: 360,
  },
};

/** Reanimated spring presets for gesture physics */
export const springs = {
  /** Snappy card snap-back / settle */
  snappy: { damping: 20, stiffness: 300, mass: 0.8 },
  /** Gentle float for overlays and badges */
  gentle: { damping: 15, stiffness: 120, mass: 1 },
  /** Bouncy for fun micro-interactions */
  bouncy: { damping: 12, stiffness: 180, mass: 0.6 },
} as const;

/** Gradient presets for cards and backgrounds */
export const gradients = {
  /** Card overlays — bottom-to-top fade over poster */
  cardOverlay: ['transparent', 'rgba(4, 5, 10, 0.6)', 'rgba(4, 5, 10, 0.95)'] as const,
  /** Fire / super-like swipe tint */
  fire: ['rgba(255, 42, 61, 0.0)', 'rgba(255, 42, 61, 0.35)'] as const,
  /** Like swipe tint */
  like: ['rgba(39, 232, 167, 0.0)', 'rgba(39, 232, 167, 0.3)'] as const,
  /** Pass swipe tint */
  pass: ['rgba(150, 166, 198, 0.0)', 'rgba(150, 166, 198, 0.2)'] as const,
  /** Onboarding hero glow */
  heroGlow: ['rgba(255, 42, 61, 0.3)', 'rgba(93, 74, 255, 0.24)', 'rgba(39, 232, 167, 0.22)'] as const,
} as const;

/** Glow / shadow presets for elevated elements */
export const glows = {
  accent: {
    shadowColor: '#FF2A3D',
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
    elevation: 8,
  },
  accentAlt: {
    shadowColor: '#27E8A7',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
    elevation: 6,
  },
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 30,
    elevation: 10,
  },
} as const;

export const VibeTheme = {
  ...baseTheme,
  bg: baseTheme.colors.background,
  panel: baseTheme.colors.surface,
  panelStrong: baseTheme.colors.surfaceStrong,
  text: baseTheme.colors.text,
  textMuted: baseTheme.colors.textMuted,
  accent: baseTheme.colors.accent,
  accentAlt: baseTheme.colors.accentAlt,
  border: baseTheme.colors.border,
  danger: baseTheme.colors.danger,
};
