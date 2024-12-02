import { Instance } from ".";

export default class InstanceManager {
  root: HTMLElement;
  instances: Instance[] = [];
  focusedInstance: number = -1;
  constructor(root: HTMLElement) {
    console.log("InstanceManager created");
    this.root = root;
  }

  createInstance() {
    const instance = new Instance(this.root);
    instance.root.style.display = "none";
    this.instances.push(instance);
    return this.instances.length - 1;
  }

  focusInstance(index: number) {
    if (this.focusedInstance != -1) {
      this.instances[this.focusedInstance].root.style.display = "none";
    }
    this.focusedInstance = index;
    this.instances[this.focusedInstance].root.style.display = "block";
  }

  nextInstance() {
    if (this.focusedInstance + 1 < this.instances.length) {
      this.focusInstance(this.focusedInstance + 1);
    } else {
      this.createInstance();
      this.focusInstance(this.focusedInstance + 1);
    }
  }

  prevInstance() {
    if (this.focusedInstance - 1 >= 0) {
      this.focusInstance(this.focusedInstance - 1);
    }
  }

  get focused() {
    return this.instances[this.focusedInstance];
  }

  clear() {
    this.instances.forEach((inst) => inst.destroy());
    this.instances = [];
    this.focusedInstance = -1;
  }
}
