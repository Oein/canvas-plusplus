import "./toast.css";

type ToastType = "success" | "info" | "error" | "loading";

interface ToastOptions {
  message: string;
  duration?: number; // Duration in milliseconds, default 3000ms
  autoRemove?: boolean; // Whether the toast should be removed automatically (default: true)
}

class ToastManager {
  private toasts: Map<string, HTMLDivElement> = new Map();
  private toastCounter: number = 0;
  private currentTopPosition: number = 20; // Initial vertical position for the first toast

  // Method to create a unique ID for each toast
  private generateToastId(): string {
    this.toastCounter += 1;
    return `toast-${this.toastCounter}`;
  }

  // Method to create a toast and return its ID
  private createToast(
    type: ToastType,
    message: string,
    duration: number,
    autoRemove: boolean
  ): { id: string; toast: HTMLDivElement } {
    const id = this.generateToastId();
    const toast = document.createElement("div");
    toast.classList.add("toast", type);
    toast.id = id; // Set unique ID for the toast

    // Create spinner for loading type
    if (type === "loading") {
      const spinner = document.createElement("div");
      spinner.classList.add("spinner");
      toast.appendChild(spinner);
    }

    // Create the message
    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    toast.appendChild(messageElement);

    // Set initial position of the toast
    toast.style.position = "fixed";
    toast.style.top = `${this.currentTopPosition}px`;
    toast.style.right = "20px"; // Align to the top-right corner
    toast.style.zIndex = "9999"; // Ensure the toast is on top of other content
    toast.style.transition =
      "top 0.25s cubic-bezier(0.165, 0.84, 0.44, 1), opacity 0.25s cubic-bezier(0.165, 0.84, 0.44, 1)"; // Custom cubic-bezier easing

    // Add slide-in animation
    toast.classList.add("slide-in");

    // Set responsive and fixed width for the toast
    toast.style.width = "90%"; // Set width to 90% of the screen (can adjust)
    toast.style.maxWidth = "400px"; // Set a max width (optional for better UI)
    toast.style.boxSizing = "border-box"; // Include padding and border in the element's total width

    // Automatically remove the toast after the specified duration if autoRemove is true
    if (autoRemove) {
      setTimeout(() => {
        toast.classList.remove("slide-in"); // Remove slide-in before applying slide-out
        toast.classList.add("slide-out"); // Apply slide-out animation
        setTimeout(() => {
          toast.remove();
          this.toasts.delete(id);
          this.updatePositions(); // Recalculate positions after toast removal
        }, 250); // Remove after slide-out animation
      }, duration); // Use the specified duration
    }

    // Store the toast in the map using its ID as the key
    this.toasts.set(id, toast);

    // Append to the DOM and calculate its bounding rectangle
    document.body.appendChild(toast);
    const rect = toast.getBoundingClientRect();
    this.currentTopPosition += rect.height + 10; // Add a margin of 10px between toasts

    return { id, toast };
  }

  // Show a success toast
  success(options: ToastOptions): string {
    const { id } = this.showToast("success", options);
    return id;
  }

  // Show an info toast
  info(options: ToastOptions): string {
    const { id } = this.showToast("info", options);
    return id;
  }

  // Show an error toast
  error(options: ToastOptions): string {
    const { id } = this.showToast("error", options);
    return id;
  }

  // Show a loading toast
  loading(options: ToastOptions): string {
    const { id } = this.showToast("loading", options);
    return id;
  }

  // Generic method to show a toast
  private showToast(
    type: ToastType,
    { message, duration = 3000, autoRemove = true }: ToastOptions
  ): { id: string } {
    const { id } = this.createToast(type, message, duration, autoRemove);
    return { id };
  }

  // Manually remove a toast by ID
  removeToast(id: string): void {
    const toast = this.toasts.get(id);
    if (toast) {
      toast.classList.add("slide-out");
      setTimeout(() => {
        toast.remove();
        this.toasts.delete(id);
        this.updatePositions(); // Recalculate positions after toast removal
      }, 300); // Wait for the slide-out animation to complete before removing
    }
  }

  // Update the positions of all remaining toasts
  private updatePositions(): void {
    let topPosition = 20; // Reset starting position
    this.toasts.forEach((toast) => {
      // Calculate the real height of each toast using getBoundingClientRect
      const rect = toast.getBoundingClientRect();
      toast.style.top = `${topPosition}px`; // Set the new top position
      topPosition += rect.height + 10; // Update the next top position with a margin
    });

    // Update the current top position for the next toast
    this.currentTopPosition = topPosition;
  }

  // Update the content of a toast by its ID
  updateToast(id: string, newContent: string): void {
    const toast = this.toasts.get(id);
    if (toast) {
      toast.textContent = newContent; // Update the content of the toast
      this.updatePositions(); // Recalculate the positions to adjust after content update
    } else {
      console.warn(`Toast with ID ${id} not found.`);
    }
  }
}

const toastManager = new ToastManager();

export default toastManager;
