export class ThrottlingError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ThrottlingError';
    // (see note below)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
