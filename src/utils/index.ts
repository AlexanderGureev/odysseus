export const isNil = <T>(value: T) => value === null || value === undefined;

export const toNum = (value: string | boolean | null | undefined) => {
  if (typeof value !== 'string') return value;
  if (value && !Number.isNaN(Number(value))) return Number(value);
  return value;
};
