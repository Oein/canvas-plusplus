export default function computeEllipsePolygon(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  numPoints: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const angleIncrement = (2 * Math.PI) / numPoints;

  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleIncrement;
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);
    points.push({ x, y });
  }

  return points;
}
