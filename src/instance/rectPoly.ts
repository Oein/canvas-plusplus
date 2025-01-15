interface Point {
  x: number;
  y: number;
}

/**
 * Generates a polygon representing the stroke area of a rectangle.
 * @param points - Array of four points representing the rectangle vertices (in clockwise or counterclockwise order).
 * @param strokeWidth - The width of the stroke.
 * @returns The vertices of the stroke polygon.
 */
export function generateRectangleStrokePolygon(
  points: [Point, Point, Point, Point],
  strokeWidth: number
): Point[] {
  strokeWidth /= 2;
  if (points.length !== 4) {
    throw new Error("Input must contain exactly four points.");
  }

  // Helper to normalize a vector
  const normalize = (x: number, y: number): { x: number; y: number } => {
    const length = Math.sqrt(x * x + y * y);
    return { x: x / length, y: y / length };
  };

  // Helper to calculate a perpendicular vector
  const perpendicular = (x: number, y: number): { x: number; y: number } => ({
    x: -y,
    y: x,
  });

  const outerPoints: Point[] = [];
  const innerPoints: Point[] = [];

  for (let i = 0; i < 4; i++) {
    const current = points[i];
    const prev = points[(i + 3) % 4];
    const next = points[(i + 1) % 4];

    // Vectors for adjacent edges
    const edgePrev = { x: current.x - prev.x, y: current.y - prev.y };
    const edgeNext = { x: next.x - current.x, y: next.y - current.y };

    // Perpendicular vectors for outward offset
    const normalPrev = normalize(
      perpendicular(edgePrev.x, edgePrev.y).x,
      perpendicular(edgePrev.x, edgePrev.y).y
    );
    const normalNext = normalize(
      perpendicular(edgeNext.x, edgeNext.y).x,
      perpendicular(edgeNext.x, edgeNext.y).y
    );

    // Average normal (aligned since it’s a rectangle)
    const averageNormal = {
      x: (normalPrev.x + normalNext.x) / 2,
      y: (normalPrev.y + normalNext.y) / 2,
    };

    // Scale to stroke width
    const offset = {
      x:
        (averageNormal.x * strokeWidth) /
        Math.sqrt(averageNormal.x ** 2 + averageNormal.y ** 2),
      y:
        (averageNormal.y * strokeWidth) /
        Math.sqrt(averageNormal.x ** 2 + averageNormal.y ** 2),
    };

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
