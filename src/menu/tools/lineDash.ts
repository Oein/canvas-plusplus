import { registerTool } from "..";
import CoordinateInputModal from "../../modal/xyInputModal";
import { setState } from "../../utils/state";
import { LineTool } from "./line";
import type { Destructor, Tool } from "./type";

class LineDashTool implements Tool {
  lineDash: number[] = [12, 18];
  lineDestructor: Destructor | null = null;
  lineTool: LineTool;

  callEvenSelected = true;
  selected = false;

  constructor() {
    this.lineTool = new LineTool();
  }

  setLineDash(dashArray: number[]) {
    this.lineDash = dashArray;
  }

  apply(recall: boolean) {
    if (recall) {
      const ldashBind = this.setLineDash.bind(this);
      const dashModal = new CoordinateInputModal(
        (dashArray) => {
          if (!dashArray) return;
          setState("DASHLINE", [dashArray.x, dashArray.y]);
          ldashBind([dashArray.x, dashArray.y]);
        },
        "간격 설정",
        "기본값 (12, 18)<br />(그려지는 길이, 빈 길이) 순서 입니다."
      );
      dashModal.open();
    }

    setState("DASHLINE", this.lineDash);
    this.lineDestructor = this.lineTool.apply();
    this.selected = true;
    return () => {
      this.selected = false;
      setState("DASHLINE", []);
      if (this.lineDestructor) {
        this.lineDestructor();
      }
    };
  }
}

registerTool("LINE-DASH", new LineDashTool());
