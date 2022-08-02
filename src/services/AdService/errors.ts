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

export class AdPodError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'AdPodError';
  }
}
