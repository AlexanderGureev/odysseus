export class PreloadTimeoutExpired extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'PreloadTimeoutExpired';
  }
}

export class PlayTimeoutExpired extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'PlayTimeoutExpired';
  }
}

export class NotFoundAdCreative extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'NotFoundAdCreative';
  }
}

export class AdPodError extends Error {
  code: string;

  constructor(code: string, message?: string) {
    super(message);
    this.name = 'AdPodError';
    this.code = code || 'UNKNOWN';
  }
}
