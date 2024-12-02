const state: any = {
  COLOR: "#000000",
  STROKE: 3,
  DASHLINE: [],
  SNAP_RIGHT: true,
  SHIFT: false,
  SHIFTTOOL: false,

  SNAP_DEG: 2.5,
  PEN_MIN_DIST: 1,
  TEXT_RES: 1.5,

  IMAGE_GLOBAL_PADDING: 50,
  MIN_SELECT_PERCENT: 0.1,

  EXPORT_IMAGE_SCALE: 3,
};
export function getState<T = any>(key: string) {
  return state[key] as T;
}

export function setState(key: string, value: any) {
  state[key] = value;
  console.log(`State updated: ${key} = ${value}`);
}

(window as any).getState = getState;
(window as any).setState = setState;
(window as any).state = state;

export function isShift() {
  return state.SHIFT || state.SHIFTTOOL;
}
