export type TokenCallback = (token: string) => void;
export type CompleteCallback<T> = (result: T) => void;
export type ErrorCallback = (error: Error) => void;

export class StreamHandler<T = string> {
  private tokenCallbacks: TokenCallback[] = [];
  private completeCallbacks: CompleteCallback<T>[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private aborted = false;
  private abortController: AbortController | null = null;

  constructor() {
    this.abortController = new AbortController();
  }

  onToken(callback: TokenCallback): this {
    this.tokenCallbacks.push(callback);
    return this;
  }

  onComplete(callback: CompleteCallback<T>): this {
    this.completeCallbacks.push(callback);
    return this;
  }

  onError(callback: ErrorCallback): this {
    this.errorCallbacks.push(callback);
    return this;
  }

  emitToken(token: string): void {
    if (this.aborted) return;
    this.tokenCallbacks.forEach((cb) => {
      try {
        cb(token);
      } catch (error) {
        console.error('Error in token callback:', error);
      }
    });
  }

  emitComplete(result: T): void {
    if (this.aborted) return;
    this.completeCallbacks.forEach((cb) => {
      try {
        cb(result);
      } catch (error) {
        console.error('Error in complete callback:', error);
      }
    });
  }

  emitError(error: Error): void {
    this.errorCallbacks.forEach((cb) => {
      try {
        cb(error);
      } catch (error) {
        console.error('Error in error callback:', error);
      }
    });
  }

  abort(): void {
    this.aborted = true;
    this.abortController?.abort();
  }

  isAborted(): boolean {
    return this.aborted;
  }

  getAbortSignal(): AbortSignal | undefined {
    return this.abortController?.signal;
  }
}
