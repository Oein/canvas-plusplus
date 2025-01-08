import { getState } from "./state";

export default function getFillColor() {
  return need2fill() ? getState("COLOR") : "transparent";
}

export function need2fill() {
  return getState("FILLTOOL");
}
