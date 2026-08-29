export const colors = {
  background: "#070A0F",
  surface: "#10151F",
  surface2: "#171D29",
  border: "#263244",
  text: "#F8FAFC",
  muted: "#94A3B8",
  lime: "#A3E635",
  cyan: "#22D3EE",
  error: "#FB7185",
  warning: "#FACC15",
  success: "#34D399",
  overlay: "rgba(0,0,0,0.72)",
} as const;

export const setTypeColors = {
  NORMAL: colors.lime,
  WARMUP: colors.cyan,
  SUPERSET: colors.warning,
  DROPSET: colors.error,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 8,
} as const;

export const typography = {
  display: 34,
  title: 22,
  body: 15,
  caption: 12,
} as const;

export const opacity = {
  disabled: 0.55,
  pressed: 0.82,
  subtle: 0.72,
} as const;

export const shadow = {
  floating: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
} as const;
