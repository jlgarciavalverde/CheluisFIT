export const colors = {
  background: "#060B11",
  backgroundElevated: "#08111B",
  surface: "#0E1725",
  surface2: "#121D2B",
  surface3: "#182534",
  border: "#233246",
  borderStrong: "#324B6A",
  text: "#F3F8FF",
  textSoft: "#D7E4F5",
  muted: "#8EA5BF",
  lime: "#B7F35B",
  limeStrong: "#A3E635",
  cyan: "#5EE7FA",
  error: "#FF6B7A",
  warning: "#F8C75E",
  success: "#4ADE80",
  overlay: "rgba(2,6,14,0.72)",
  primary: "#B7F35B",
  primaryOn: "#07120E",
  accent: "#5EE7FA",
  white: "#FFFFFF",
} as const;

export const setTypeColors = {
  NORMAL: colors.limeStrong,
  WARMUP: colors.cyan,
  SUPERSET: colors.warning,
  DROPSET: colors.error,
} as const;

export const setTypeBackgrounds = {
  NORMAL: `${setTypeColors.NORMAL}1F`,
  WARMUP: `${setTypeColors.WARMUP}1F`,
  SUPERSET: `${setTypeColors.SUPERSET}1F`,
  DROPSET: `${setTypeColors.DROPSET}1F`,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
} as const;

export const typography = {
  display: 34,
  title: 22,
  section: 16,
  body: 15,
  meta: 12,
  caption: 11,
} as const;

export const opacity = {
  disabled: 0.55,
  pressed: 0.82,
  subtle: 0.72,
} as const;

export const stateColors = {
  active: colors.lime,
  rest: colors.cyan,
  ready: colors.warning,
  idle: colors.muted,
} as const;

export const shadow = {
  floating: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 12,
  },
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const motion = {
  fast: 140,
  normal: 220,
  slow: 320,
} as const;
