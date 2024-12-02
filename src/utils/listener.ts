export default function XYfromEvent(e: MouseEvent | TouchEvent | PointerEvent) {
  if ("targetTouches" in e) {
    if (!e.targetTouches.item(0)) return { x: -1, y: -1 };
    else e.preventDefault();
    return {
      x: e.targetTouches.item(0)!.pageX,
      y: e.targetTouches.item(0)!.pageY,
    };
  } else {
    return {
      x: e.pageX || e.offsetX || e.clientX,
      y: e.pageY || e.offsetY || e.clientY,
    };
  }
}

export function addMoveListener(
  element: any,
  callback: (pos: { x: number; y: number }, e: PointerEvent) => void
) {
  const pointerMove = (event: PointerEvent) => {
    callback(XYfromEvent(event), event);
  };
  const touchMove = (event: TouchEvent) => {
    event.preventDefault();
  };

  element.addEventListener("pointermove", pointerMove);
  element.addEventListener("touchmove", touchMove);

  return () => {
    element.removeEventListener("pointermove", pointerMove);
    element.removeEventListener("touchmove", touchMove);
  };
}

export function addDownListener(
  element: any,
  callback: (pos: { x: number; y: number }, e: PointerEvent) => void
) {
  const pointerDown = (event: PointerEvent) => {
    callback(XYfromEvent(event), event);
  };
  const touchStart = (event: TouchEvent) => {
    event.preventDefault();
  };

  element.addEventListener("pointerdown", pointerDown);
  element.addEventListener("touchstart", touchStart);

  return () => {
    element.removeEventListener("pointerdown", pointerDown);
    element.removeEventListener("touchstart", touchStart);
  };
}

export function addUpListener(
  element: any,
  callback: (pos: { x: number; y: number }, e: PointerEvent) => void
) {
  const pointerUp = (event: PointerEvent) => {
    callback(XYfromEvent(event), event);
  };
  const touchEnd = (event: TouchEvent) => {
    event.preventDefault();
  };

  element.addEventListener("pointerup", pointerUp);
  element.addEventListener("touchend", touchEnd);

  return () => {
    element.removeEventListener("pointerup", pointerUp);
    element.removeEventListener("touchend", touchEnd);
  };
}
