import { addUpListener } from "../utils/listener";

export default class TextInputModal {
  private modal: HTMLDivElement;
  private textarea: HTMLTextAreaElement;
  private confirmButton: HTMLButtonElement;
  private cancelButton: HTMLButtonElement;

  constructor(private onDone: (result: number | null) => void) {
    // Create the modal container
    this.modal = document.createElement("div");
    this.modal.className = "modalWRP";

    // Create the modal content box
    const contentBox = document.createElement("div");
    contentBox.className = "modalCTT";

    // Create the textarea
    this.textarea = document.createElement("textarea");
    this.textarea.style.width = "100%";
    this.textarea.style.height = "100px";
    this.textarea.style.marginBottom = "20px";
    this.textarea.style.padding = "10px";
    this.textarea.style.border = "1px solid #ccc";
    this.textarea.style.borderRadius = "4px";
    this.textarea.style.boxSizing = "border-box";

    // Create the confirm button
    this.confirmButton = document.createElement("button");
    this.confirmButton.textContent = "Confirm";
    this.confirmButton.style.marginRight = "10px";
    this.confirmButton.style.padding = "10px 20px";
    this.confirmButton.style.border = "none";
    this.confirmButton.style.backgroundColor = "#007bff";
    this.confirmButton.style.color = "#fff";
    this.confirmButton.style.borderRadius = "4px";
    this.confirmButton.style.cursor = "pointer";

    // Create the cancel button
    this.cancelButton = document.createElement("button");
    this.cancelButton.textContent = "Cancel";
    this.cancelButton.style.padding = "10px 20px";
    this.cancelButton.style.border = "none";
    this.cancelButton.style.backgroundColor = "#ccc";
    this.cancelButton.style.color = "#000";
    this.cancelButton.style.borderRadius = "4px";
    this.cancelButton.style.cursor = "pointer";

    // Append elements
    contentBox.appendChild(this.textarea);
    contentBox.appendChild(this.confirmButton);
    contentBox.appendChild(this.cancelButton);
    this.modal.appendChild(contentBox);

    // Add event listeners
    const cfrmBind = this.onConfirm.bind(this);
    addUpListener(this.confirmButton, () => cfrmBind());

    const cnclBind = this.onCancel.bind(this);
    addUpListener(this.cancelButton, () => cnclBind());
  }

  private onConfirm(): void {
    const inputValue = this.textarea.value;
    this.onDone(parseInt(inputValue)); // Pass the input value to the callback
    this.close();
  }

  private onCancel(): void {
    this.onDone(null); // Pass null to the callback when canceled
    this.close();
  }

  private close(): void {
    if (this.modal.parentElement) {
      this.modal.parentElement.removeChild(this.modal);
    }
  }

  public open(): void {
    document.body.appendChild(this.modal);
    this.textarea.focus();
  }
}
