import { addUpListener } from "../utils/listener";
import { setState } from "../utils/state";
import setupColor from "./color";
import setupPage from "./page";
import setupStroke from "./stroke";
import type { Destructor, Tool } from "./tools/type";

export let functions: { [key: string]: () => void } = {};
export function registerFunction(id: string, callback: () => void) {
  console.log(`Function registered: ${id}`);
  functions[id] = callback;
}

export let tools: { [key: string]: Tool } = {};
let __destructor: Destructor | null = null;
export function registerTool(id: string, tool: Tool, applySelf = false) {
  console.log(`Tool registered: ${id}`);
  tools[id] = tool;
  if (applySelf) applyTool(id);
}

export function applyTool(id: string, isRecall = false) {
  console.log(`Tool applied: ${id}`);
  if (__destructor) __destructor();
  __destructor = tools[id].apply(isRecall);
}

let selectedTool = 0;

export function applyToolExternal(id: string) {
  const button = document.querySelector(`.tool-button[data-tool="${id}"]`);
  if (!button) return;
  (button as any).dispatchEvent(
    new PointerEvent("pointerup", {
      clientX: 0,
      clientY: 0,
    })
  );
}

export default function setupTool() {
  setupColor();
  setupStroke();
  setupPage();

  const toolButtons = document.querySelectorAll(".tool-button");
  toolButtons.forEach((button, idx) => {
    const toolID = button.getAttribute("data-tool");
    if (!toolID) return;
    addUpListener(button, () => {
      if (selectedTool === idx && !tools[toolID].callEvenSelected) return;
      toolButtons[selectedTool].classList.remove("active");
      button.classList.add("active");
      console.log(`Tool selected: ${toolID}`);

      applyTool(toolID, selectedTool === idx);
      selectedTool = idx;
    });
  });

  document.querySelectorAll(".function-button").forEach((button) => {
    const functionID = button.getAttribute("data-function");
    if (!functionID) return;
    addUpListener(button, () => {
      console.log(`Function selected: ${functionID}`);
      functions[functionID]();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.keyCode === 16) setState("SHIFT", true);
  });

  document.addEventListener("keyup", (e) => {
    if (e.keyCode === 16) setState("SHIFT", false);
  });
}

import("./functions");
import("./tools");
