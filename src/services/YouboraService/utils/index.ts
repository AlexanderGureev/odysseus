import { isNil } from 'lodash';

import { TOptions } from '..';

export const filterOptions = (options: TOptions, nullable = true): TOptions =>
  Object.keys(options).reduce((acc: TOptions, k) => {
    const key = k as keyof TOptions;

    if (isNil(options[key]) || options[key] === '') return nullable ? { ...acc, [key]: null } : acc;

    if (Array.isArray(options[key])) return { ...acc, [key]: JSON.stringify(options[key]) };
    if (typeof options[key] === 'object') return { ...acc, [key]: filterOptions(options[key] as TOptions, nullable) };

    return { ...acc, [key]: options[key] };
  }, {});
