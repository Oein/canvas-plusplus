import { addUpListener } from "../utils/listener";

export default class SavePathInputModal {
  private modal: HTMLDivElement;
  private cfmBtn: HTMLButtonElement;
  private autoBtn: HTMLButtonElement;
  private cancelBtn: HTMLButtonElement;

  constructor(private onDone: (result: "file" | "auto" | "cancel") => void) {
    // Create the modal container
    this.modal = document.createElement("div");
    this.modal.className = "modalWRP";

    // Create the modal content box
    const contentBox = document.createElement("div");
    contentBox.className = "modalCTT";
    contentBox.style.textAlign = "center";

    const headingElement = document.createElement("h2");
    headingElement.textContent = "파일 위치 선택";
    headingElement.style.marginBottom = ".5rem";
    headingElement.style.marginTop = "0";
    headingElement.style.padding = "0";
    headingElement.style.textAlign = "center";
    contentBox.appendChild(headingElement);

    // Create the confirm button
    this.cfmBtn = document.createElement("button");
    this.cfmBtn.textContent = "File";
    this.cfmBtn.style.padding = "10px 20px";
    this.cfmBtn.style.border = "none";
    this.cfmBtn.style.backgroundColor = "#007bff";
    this.cfmBtn.style.color = "#fff";
    this.cfmBtn.style.borderRadius = "4px 0px 0px 4px";
    this.cfmBtn.style.cursor = "pointer";
    this.cfmBtn.style.minWidth = "80px";

    // Create the cancel button
    this.autoBtn = document.createElement("button");
    this.autoBtn.textContent = "자동 저장";
    this.autoBtn.style.padding = "10px 20px";
    this.autoBtn.style.border = "none";
    this.autoBtn.style.backgroundColor = "#ccc";
    this.autoBtn.style.color = "#000";
    this.autoBtn.style.minWidth = "80px";
    this.autoBtn.style.cursor = "pointer";

    this.cancelBtn = document.createElement("button");
    this.cancelBtn.textContent = "취소";
    this.cancelBtn.style.padding = "10px 20px";
    this.cancelBtn.style.border = "none";
    this.cancelBtn.style.backgroundColor = "#f44336";
    this.cancelBtn.style.color = "#fff";
    this.cancelBtn.style.borderRadius = "0px 4px 4px 0px";
    this.cancelBtn.style.cursor = "pointer";
    this.cancelBtn.style.minWidth = "80px";

    contentBox.appendChild(this.cfmBtn);
    contentBox.appendChild(this.autoBtn);
    contentBox.appendChild(this.cancelBtn);
    this.modal.appendChild(contentBox);

    // Add event listeners
    const fileBind = this.onFile.bind(this);
    addUpListener(this.cfmBtn, () => fileBind());
    const atoBind = this.onAuto.bind(this);
    addUpListener(this.autoBtn, () => atoBind());
    const cancelBind = this.onCancel.bind(this);
    addUpListener(this.cancelBtn, () => cancelBind());
  }

  private onFile(): void {
    this.onDone("file");
    this.close();
  }

  private onAuto(): void {
    this.onDone("auto");
    this.close();
  }

  private onCancel(): void {
    this.onDone("cancel");
    this.close();
  }

  private close(): void {
    if (this.modal.parentElement) {
      this.modal.parentElement.removeChild(this.modal);
    }
  }

  public open(): void {
    document.body.appendChild(this.modal);
  }
}
