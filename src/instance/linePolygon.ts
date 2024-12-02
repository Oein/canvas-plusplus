interface Point {
  x: number;
  y: number;
}
// 두 점을 이은 선분에 두께를 적용한 Polygon을 구하는 함수
export default function computeLinePolygon(
  p1: Point,
  p2: Point,
  strokeWidth: number
): Point[] {
  const halfStroke = strokeWidth / 2;

  // 선분의 방향 벡터 계산
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // 선분의 길이 계산
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    // 두 점이 같은 경우 처리 불가
    return [];
  }

  // 법선 벡터 (선분에 수직인 단위 벡터)
  const nx = -dy / length;
  const ny = dx / length;

  // 오프셋 벡터 계산
  const offsetX = nx * halfStroke;
  const offsetY = ny * halfStroke;

  // 스트로크가 적용된 네 개의 점 계산
  const p1_outer = { x: p1.x + offsetX, y: p1.y + offsetY };
  const p1_inner = { x: p1.x - offsetX, y: p1.y - offsetY };
  const p2_outer = { x: p2.x + offsetX, y: p2.y + offsetY };
  const p2_inner = { x: p2.x - offsetX, y: p2.y - offsetY };

  // 폴리곤을 구성하는 점들의 배열 반환
  return [p1_outer, p2_outer, p2_inner, p1_inner];
}
