type Point = { x: number; y: number };

export default function isPointInPolygon(
  point: Point,
  polygon: Point[]
): boolean {
  let isInside = false;
  const { x, y } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    // Check if the point is on the edge
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      isInside = !isInside;
    }
  }

  return isInside;
}
