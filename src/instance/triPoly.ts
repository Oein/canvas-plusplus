interface Point {
  x: number;
  y: number;
}

/**
 * Generates a polygon representing the stroke area of a triangle.
 * @param points - Array of three points representing the triangle vertices.
 * @param strokeWidth - The width of the stroke.
 * @returns The vertices of the stroke polygon.
 */
export function generateStrokePolygon(
  points: [Point, Point, Point],
  strokeWidth: number
): Point[] {
  strokeWidth /= 2;
  if (points.length !== 3) {
    throw new Error("Input must contain exactly three points.");
  }

  // Helper to normalize a vector
  const normalize = (x: number, y: number): { x: number; y: number } => {
    const length = Math.sqrt(x * x + y * y);
    return { x: x / length, y: y / length };
  };

  // Helper to calculate a vector from two points
  const vector = (from: Point, to: Point): { x: number; y: number } => ({
    x: to.x - from.x,
    y: to.y - from.y,
  });

  // Helper to scale a vector
  const scale = (
    v: { x: number; y: number },
    factor: number
  ): { x: number; y: number } => ({
    x: v.x * factor,
    y: v.y * factor,
  });

  // Helper to calculate the bisector of two vectors
  const bisector = (
    v1: { x: number; y: number },
    v2: { x: number; y: number }
  ): { x: number; y: number } => {
    const sum = { x: v1.x + v2.x, y: v1.y + v2.y };
    return normalize(sum.x, sum.y);
  };

  const outerPoints: Point[] = [];
  const innerPoints: Point[] = [];

  for (let i = 0; i < 3; i++) {
    const current = points[i];
    const prev = points[(i + 2) % 3];
    const next = points[(i + 1) % 3];

    // Vectors for adjacent edges
    const v1 = vector(current, prev);
    const v2 = vector(current, next);

    // Normalized bisector of the angle
    const angleBisector = bisector(
      normalize(v1.x, v1.y),
      normalize(v2.x, v2.y)
    );

    // Scale the bisector to account for the stroke width
    const offset = scale(
      angleBisector,
      strokeWidth /
        Math.sin(
          Math.acos(
            (v1.x * v2.x + v1.y * v2.y) /
              (Math.sqrt(v1.x ** 2 + v1.y ** 2) *
                Math.sqrt(v2.x ** 2 + v2.y ** 2))
          ) / 2
        )
    );

    // Offset the current point outward and inward
    outerPoints.push({
      x: current.x + offset.x,
      y: current.y + offset.y,
    });
    innerPoints.unshift({
      x: current.x - offset.x,
      y: current.y - offset.y,
    });
  }

  // Combine outer and inner points into a single polygon
  const strokePolygon = [
    ...outerPoints.reverse(),
    outerPoints[0],
    innerPoints[0],
    ...innerPoints.reverse(),
  ];

  return strokePolygon;
}
