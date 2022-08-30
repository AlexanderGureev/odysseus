export class BaseError extends Error {
  status = 500;

  constructor(message?: string) {
    super(message);
  }
}
