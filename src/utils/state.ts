const svc = document.getElementById("stateViewerContent")! as HTMLTableElement;

const ORIGINAL_STATE = {
  COLOR: "#000000",
  STROKE: 3,
  DASHLINE: [],
  SNAP_RIGHT: true,
  SHIFT: false,
  SHIFTTOOL: false,
  RCLICK2ERASE: true,

  SNAP_DEG: 2.5,
  PEN_MIN_DIST: 1,
  TEXT_RES: 1.5,

  IMAGE_GLOBAL_PADDING: Math.min(window.innerWidth, window.innerHeight) * 0.25,
  MIN_SELECT_PERCENT: 0.1,

  EXPORT_IMAGE_SCALE: 3,
  LITTLE_MOVE_MULTIPLIER: 0.4,

  CLIPBOARD_PREFIX: "[aris_is_love]!",
  SAVE_EXTENSION: ".aris",
};

let state: any = { ...ORIGINAL_STATE };

const stateDesc: any = {
  COLOR: "팬의 색상",
  STROKE: "팬의 굵기",
  SNAP_RIGHT: "45도 단위로 가까워질 경우 선을 45도로 스냅",
  SNAP_DEG: "스냅 허용 오차 각도",
  RCLICK2ERASE: "펜모드에서 우클릭으로 지우기",
  PEN_MIN_DIST: "펜의 최소 이동 거리",
  TEXT_RES: "텍스트 이미지 해상도",
  IMAGE_GLOBAL_PADDING: "이미지/텍스트 추가 시 화면 가장자리와의 최소 간격",
  MIN_SELECT_PERCENT: "선택 영역 최소 크기 비율",
  EXPORT_IMAGE_SCALE: "내보낼 이미지의 배율",
  LITTLE_MOVE_MULTIPLIER: "Shift이동시 이동 거리 배율",
  CLIPBOARD_PREFIX: "클립보드에 복사할 때 사용할 접두어",
  SAVE_EXTENSION: "저장할 파일의 확장자",
};

function createSVCEelment(key: string, val: string | boolean | number) {
  const tr = document.createElement("tr");
  const td1 = document.createElement("td");
  const td2 = document.createElement("td");

  const input = document.createElement("input");
  input.style.width = "100%";
  if (typeof val == "string") {
    input.type = "text";
    input.value = val;
  } else if (typeof val == "boolean") {
    input.type = "checkbox";
    input.checked = val;
  } else if (typeof val == "number") {
    input.type = "number";
    input.value = val.toString();
  } else {
    return null;
  }

  td1.innerText = key;
  td1.style.fontSize = ".8rem";
  td1.style.fontFamily = "monospace";
  input.oninput = () => {
    state[key] =
      input.type == "text"
        ? input.value
        : input.type == "number"
        ? parseFloat(input.value)
        : input.checked;
  };
  input.setAttribute("data-svc-key", key);
  td2.appendChild(input);

  tr.appendChild(td1);
  tr.appendChild(td2);

  if (key in stateDesc) {
    const td1div = document.createElement("div");
    // as flex
    td1div.style.display = "flex";
    td1div.style.flexDirection = "column";
    td1div.style.alignItems = "flex-start";
    td1div.style.justifyContent = "center";

    const title = document.createElement("span");
    title.innerText = key;

    const hint = document.createElement("span");
    hint.innerText = stateDesc[key];
    hint.style.fontSize = ".6rem";
    hint.style.color = "#666";
    hint.style.fontFamily = "var(--Font-base)";
    // hint.style.paddingLeft = "5px";

    td1div.appendChild(title);
    td1div.appendChild(hint);
    td1.innerHTML = "";
    td1.appendChild(td1div);
  }

  return tr;
}

export function getState<T = any>(key: string) {
  return state[key] as T;
}

export function setState(key: string, value: any) {
  state[key] = value;
  console.log(`State updated: ${key} = ${value}`);
  const input = svc.querySelector(
    `input[data-svc-key="${key}"]`
  ) as HTMLInputElement;
  if (input) {
    if (typeof value == "string") {
      input.value = value;
    } else if (typeof value == "boolean") {
      input.checked = value;
    } else if (typeof value == "number") {
      input.value = value.toString();
    }
  }

  localStorage.setItem("state", JSON.stringify(state));
}

if (localStorage.getItem("state")) {
  try {
    state = JSON.parse(localStorage.getItem("state")!);
  } catch (e) {
    state = { ...ORIGINAL_STATE };
  }
}

(window as any).getState = getState;
(window as any).setState = setState;
(window as any).state = state;

export function isShift() {
  return state.SHIFT || state.SHIFTTOOL;
}

for (const key in state) {
  const svel = createSVCEelment(key, state[key]);
  if (!svel) continue;
  for (const el of [svel]) {
    svc.appendChild(el);
  }
}

document.getElementById("st-saf")?.addEventListener("click", () => {
  // download state as file
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(state)], { type: "application/json" })
  );
  a.download = "canvas_config.json";
  a.click();
});

document.getElementById("st-lff")?.addEventListener("click", () => {
  // load state from file
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.addEventListener("change", (e) => {
    const tar = e.target as HTMLInputElement;
    if (!tar) return;
    const files = tar.files;
    if (!files) return;
    if (files.length == 0) return;
    const file = files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const res = e.target?.result;
      if (!res) return;
      try {
        const newState = JSON.parse(res as string);
        for (const key in newState) {
          setState(key, newState[key]);
        }
      } catch (e) {
        console.error(e);
        alert("파일을 읽는 중 오류가 발생했습니다.");
      }
    };

    reader.readAsText(file);
  });

  input.click();
});
