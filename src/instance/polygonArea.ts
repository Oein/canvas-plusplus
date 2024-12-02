export type Point = {
  x: number;
  y: number;
};

export default function polygonArea(p: Point[]) {
  var len = p.length;
  var s = 0;
  for (var i = 0; i < len; i++) {
    s += p[i % len].x * p[(i + 1) % len].y - p[i % len].y * p[(i + 1) % len].x;
  }
  return Math.abs(s / 2);
}
