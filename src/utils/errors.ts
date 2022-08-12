import { ERROR_CODES, ERROR_ITEM_MAP, ERROR_TYPE, RawPlayerError } from '../../types/errors';

export class PlayerError extends Error {
  code: number;
  details: string | undefined;
  title: ERROR_TYPE;

  constructor(code: number, details?: string) {
    const err = ERROR_ITEM_MAP[code] || ERROR_ITEM_MAP[ERROR_CODES.UNKNOWN];
    super(details || `code: ${err.code}, title: ${err.title}`);

    this.code = err.code;
    this.details = details || err.details;
    this.title = err.title;
  }

  serialize(): RawPlayerError {
    return {
      code: this.code,
      title: this.title,
      details: this.details,
    };
  }
}
