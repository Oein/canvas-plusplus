import { addUpListener } from "../utils/listener";

export default class SelectModal {
  private modal: HTMLDivElement;
  private confirmButton: HTMLButtonElement;
  private cancelButton: HTMLButtonElement;
  private selectedOption: number | null = null;

  constructor(
    private options: string[],
    private onDone: (result: number | null) => void,
    heading?: string,
    description?: string
  ) {
    // Create the modal container
    this.modal = document.createElement("div");
    this.modal.className = "modalWRP";

    // Create the modal content box
    const contentBox = document.createElement("div");
    contentBox.className = "modalCTT";
    contentBox.style.textAlign = "center";

    if (heading) {
      const headingElement = document.createElement("h2");
      headingElement.textContent = heading;
      headingElement.style.marginBottom = ".5rem";
      headingElement.style.marginTop = "0";
      headingElement.style.padding = "0";
      headingElement.style.textAlign = "center";
      contentBox.appendChild(headingElement);
    }

    if (description) {
      const descriptionElement = document.createElement("p");
      descriptionElement.innerHTML = description;
      descriptionElement.style.marginBottom = "10px";
      descriptionElement.style.marginTop = "0";
      descriptionElement.style.padding = "0";
      descriptionElement.style.fontSize = "14px";
      descriptionElement.style.color = "#666";
      descriptionElement.style.textAlign = "center";
      contentBox.appendChild(descriptionElement);
    }

    // Create buttons for each option
    this.options.forEach((option, i) => {
      const optionButton = document.createElement("button");
      optionButton.textContent = option;
      optionButton.style.marginRight = "10px";
      optionButton.style.padding = "10px 20px";
      optionButton.style.border = "none";
      optionButton.style.color = "#000";
      // optionButton.style.borderRadius = "4px";
      optionButton.style.cursor = "pointer";
      optionButton.style.width = "100%";
      addUpListener(optionButton, () => this.selectOption(i));
      contentBox.appendChild(optionButton);

      if (i == 0) {
        optionButton.style.borderRadius = "4px 4px 0 0";
      }
      if (i == this.options.length - 1) {
        optionButton.style.borderRadius = "0 0 4px 4px";
      }

      if (this.options.length === 1) {
        optionButton.style.borderRadius = "4px";
      }
    });

    const padding = document.createElement("div");
    padding.style.height = "1rem";
    contentBox.appendChild(padding);

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
    this.confirmButton.disabled = true;
    this.confirmButton.style.opacity = "0.5";
    addUpListener(this.confirmButton, () => this.onConfirm());

    // Create the cancel button
    this.cancelButton = document.createElement("button");
    this.cancelButton.textContent = "Cancel";
    this.cancelButton.style.padding = "10px 20px";
    this.cancelButton.style.border = "none";
    this.cancelButton.style.backgroundColor = "#ccc";
    this.cancelButton.style.color = "#000";
    this.cancelButton.style.borderRadius = "4px";
    this.cancelButton.style.cursor = "pointer";
    addUpListener(this.cancelButton, () => this.onCancel());

    contentBox.appendChild(this.confirmButton);
    contentBox.appendChild(this.cancelButton);
    this.modal.appendChild(contentBox);
  }

  private selectOption(option: number): void {
    this.selectedOption = option;
    this.confirmButton.disabled = false;
    this.confirmButton.style.opacity = "1";

    // Update button styles to indicate selection
    Array.from(this.modal.querySelectorAll("button")).forEach((button, i) => {
      if (i == option) {
        button.style.backgroundColor = "#007bff";
        button.style.color = "#fff";
      } else if (
        button !== this.confirmButton &&
        button !== this.cancelButton
      ) {
        button.style.backgroundColor = "";
        button.style.color = "#000";
      }
    });
  }

  private onConfirm(): void {
    if (this.selectedOption == null) {
      alert("Please select an option.");
      return;
    }

    this.onDone(this.selectedOption);
    this.close();
  }

  private onCancel(): void {
    this.onDone(null);
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
