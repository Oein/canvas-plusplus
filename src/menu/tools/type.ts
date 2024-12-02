export type Destructor = () => void;
export interface Tool {
  callEvenSelected?: boolean;
  apply: (isRecall: boolean) => Destructor;
}
