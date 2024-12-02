export default class CoordinateInputModal {
  private modal: HTMLDivElement;
  private xInput: HTMLInputElement;
  private yInput: HTMLInputElement;
  private keypad: HTMLDivElement;
  private confirmButton: HTMLButtonElement;
  private cancelButton: HTMLButtonElement;
  private keypadVisible: boolean = false;

  private activeInput!: HTMLInputElement; // Active input is explicitly non-null

  constructor(
    private onDone: (result: { x: number; y: number } | null) => void,
    heading?: string,
    description?: string
  ) {
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
    contentBox.style.width = "300px";
    contentBox.style.boxSizing = "border-box";
    contentBox.style.position = "relative";

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

    // Create the x-coordinate input
    const xContainer = document.createElement("div");
    xContainer.style.display = "flex";
    xContainer.style.alignItems = "center";
    xContainer.style.marginBottom = "15px";

    const xLabel = document.createElement("label");
    xLabel.textContent = "X:";
    xLabel.style.marginRight = "10px";

    this.xInput = document.createElement("input");
    this.xInput.type = "text";
    this.xInput.style.flex = "1";
    this.xInput.style.padding = "10px";
    this.xInput.style.border = "1px solid #ccc";
    this.xInput.style.borderRadius = "4px";
    this.xInput.style.boxSizing = "border-box";

    const xKeyboardIcon = document.createElement("button");
    xKeyboardIcon.textContent = "⌨️";
    xKeyboardIcon.style.marginLeft = "10px";
    xKeyboardIcon.style.padding = "5px";
    xKeyboardIcon.style.border = "1px solid #ccc";
    xKeyboardIcon.style.borderRadius = "4px";
    xKeyboardIcon.style.cursor = "pointer";
    xKeyboardIcon.style.height = "40px";
    xKeyboardIcon.style.width = "40px";
    xKeyboardIcon.style.textAlign = "center";
    xKeyboardIcon.addEventListener("click", () =>
      this.toggleKeypad(this.xInput)
    );

    xContainer.appendChild(xLabel);
    xContainer.appendChild(this.xInput);
    xContainer.appendChild(xKeyboardIcon);

    // Create the y-coordinate input
    const yContainer = document.createElement("div");
    yContainer.style.display = "flex";
    yContainer.style.alignItems = "center";
    yContainer.style.marginBottom = "15px";

    const yLabel = document.createElement("label");
    yLabel.textContent = "Y:";
    yLabel.style.marginRight = "10px";

    this.yInput = document.createElement("input");
    this.yInput.type = "text";
    this.yInput.style.flex = "1";
    this.yInput.style.padding = "10px";
    this.yInput.style.border = "1px solid #ccc";
    this.yInput.style.borderRadius = "4px";
    this.yInput.style.boxSizing = "border-box";

    const yKeyboardIcon = document.createElement("button");
    yKeyboardIcon.textContent = "⌨️";
    yKeyboardIcon.style.marginLeft = "10px";
    yKeyboardIcon.style.padding = "5px";
    yKeyboardIcon.style.border = "1px solid #ccc";
    yKeyboardIcon.style.borderRadius = "4px";
    yKeyboardIcon.style.cursor = "pointer";
    yKeyboardIcon.style.height = "40px";
    yKeyboardIcon.style.width = "40px";
    yKeyboardIcon.style.textAlign = "center";
    yKeyboardIcon.addEventListener("click", () =>
      this.toggleKeypad(this.yInput)
    );

    yContainer.appendChild(yLabel);
    yContainer.appendChild(this.yInput);
    yContainer.appendChild(yKeyboardIcon);

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

    // Create the keypad
    this.keypad = document.createElement("div");
    this.keypad.style.position = "absolute";
    this.keypad.style.right = "-150px";
    this.keypad.style.top = "20px";
    this.keypad.style.width = "150px";
    this.keypad.style.backgroundColor = "#fff";
    this.keypad.style.border = "1px solid #ccc";
    this.keypad.style.borderRadius = "8px";
    this.keypad.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    this.keypad.style.display = "none";
    this.keypad.style.gridTemplateColumns = "repeat(3, 1fr)";
    this.keypad.style.gap = "10px";
    this.keypad.style.padding = "10px";
    this.keypad.style.boxSizing = "border-box";
    this.keypad.style.gridAutoRows = "40px";

    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "0", "←"].forEach(
      (key) => {
        const button = document.createElement("button");
        button.textContent = key;
        button.style.padding = "10px";
        button.style.border = "1px solid #ccc";
        button.style.borderRadius = "4px";
        button.style.cursor = "pointer";

        button.addEventListener("click", () => {
          if (key === "←") {
            this.activeInput!.value = this.activeInput!.value.slice(0, -1);
          } else {
            this.activeInput!.value += key;
          }
        });

        this.keypad.appendChild(button);
      }
    );

    // Append elements
    contentBox.appendChild(xContainer);
    contentBox.appendChild(yContainer);
    contentBox.appendChild(this.confirmButton);
    contentBox.appendChild(this.cancelButton);
    contentBox.appendChild(this.keypad);
    this.modal.appendChild(contentBox);

    // Add event listeners
    this.confirmButton.addEventListener("click", () => this.onConfirm());
    this.cancelButton.addEventListener("click", () => this.onCancel());
  }

  private toggleKeypad(input: HTMLInputElement): void {
    this.activeInput = input;
    this.keypadVisible = !this.keypadVisible;
    this.keypad.style.display = this.keypadVisible ? "grid" : "none";
  }

  private onConfirm(): void {
    const xValue = parseFloat(this.xInput.value);
    const yValue = parseFloat(this.yInput.value);

    // Validate input
    if (isNaN(xValue) || isNaN(yValue)) {
      alert("Please enter valid numbers for both coordinates.");
      return;
    }

    this.onDone({ x: xValue, y: yValue });
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
    this.xInput.focus();
  }
}
