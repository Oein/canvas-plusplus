type Point = { x: number; y: number };

/**
 * Generate a stroked polygon based on the user's drawn line points and stroke width.
 * @param points - Array of points defining the user's line.
 * @param strokeWidth - Width of the stroke.
 * @returns - Array of points representing the stroked polygon.
 */
export default function generateStrokedPolygon(
  points: Point[],
  strokeWidth: number
): Point[] {
  if (points.length < 2) {
    throw new Error(
      "At least two points are required to create a stroked polygon."
    );
  }

  const halfStroke = strokeWidth / 2;
  const leftSide: Point[] = [];
  const rightSide: Point[] = [];

  function calculateOffset(
    p1: Point,
    p2: Point,
    offset: number
  ): { left: Point; right: Point } {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      // If length is 0, return the point itself with the offset applied
      return {
        left: { x: p1.x, y: p1.y },
        right: { x: p1.x, y: p1.y },
      };
    }

    const nx = -dy / length;
    const ny = dx / length;

    return {
      left: { x: p1.x + nx * offset, y: p1.y + ny * offset },
      right: { x: p1.x - nx * offset, y: p1.y - ny * offset },
    };
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const { left, right } = calculateOffset(p1, p2, halfStroke);

    leftSide.push(left);
    rightSide.push(right);

    if (i > 0) {
      const prevLeft = leftSide[leftSide.length - 2];
      const prevRight = rightSide[rightSide.length - 2];

      const intersectionLeft = {
        x: (prevLeft.x + left.x) / 2,
        y: (prevLeft.y + left.y) / 2,
      };
      const intersectionRight = {
        x: (prevRight.x + right.x) / 2,
        y: (prevRight.y + right.y) / 2,
      };

      leftSide[leftSide.length - 2] = intersectionLeft;
      rightSide[rightSide.length - 2] = intersectionRight;
    }

    if (i === points.length - 2) {
      const { left: lastLeft, right: lastRight } = calculateOffset(
        p2,
        p1,
        halfStroke
      );
      leftSide.push(lastLeft);
      rightSide.push(lastRight);
    }
  }

  // Combine left and right sides to form a closed polygon
  return [...leftSide, ...rightSide.reverse()];
}
