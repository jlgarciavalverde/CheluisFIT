import Svg, { Polygon, Polyline } from "react-native-svg";
import { colors, withOpacity } from "../theme/tokens";

export function MiniSparkline({
  values,
  color = colors.lime,
  width = 80,
  height = 28,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;

  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * w;
    const y = padding + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const linePoints = points.join(" ");
  const areaPoints = `${padding},${height} ${linePoints} ${width - padding},${height}`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polygon points={areaPoints} fill={withOpacity(color, 0.08)} />
      <Polyline points={linePoints} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
