export default class TextInputModal {
  private modal: HTMLDivElement;
  private textarea: HTMLTextAreaElement;
  private confirmButton: HTMLButtonElement;
  private cancelButton: HTMLButtonElement;

  constructor(private onDone: (result: string | null) => void) {
    // Create the modal container
    this.modal = document.createElement("div");
    this.modal.style.position = "fixed";
    this.modal.style.top = "0";
    this.modal.style.left = "0";
    this.modal.style.width = "100%";
    this.modal.style.height = "100%";
    this.modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    this.modal.style.display = "flex";
    this.modal.style.justifyContent = "center";
    this.modal.style.alignItems = "center";
    this.modal.style.zIndex = "1000000000";

    // Create the modal content box
    const contentBox = document.createElement("div");
    contentBox.style.backgroundColor = "#fff";
    contentBox.style.padding = "20px";
    contentBox.style.borderRadius = "8px";
    contentBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    contentBox.style.maxWidth = "400px";
    contentBox.style.width = "100%";
    contentBox.style.boxSizing = "border-box";

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
    this.confirmButton.addEventListener("click", () => this.onConfirm());
    this.cancelButton.addEventListener("click", () => this.onCancel());
  }

  private onConfirm(): void {
    const inputValue = this.textarea.value;
    this.onDone(inputValue); // Pass the input value to the callback
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
