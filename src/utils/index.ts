export const isNil = <T>(value: T) => value === null || value === undefined;

export const toNum = (value: string | boolean | null | undefined) => {
  if (typeof value !== 'string') return value;
  if (value && !Number.isNaN(Number(value))) return Number(value);
  return value;
};

export const getCurrentTime = () => {
  const d = new Date();
  const hh = ('0' + d.getDate()).slice(-2);
  const mm = ('0' + d.getMinutes()).slice(-2);
  const ss = ('0' + d.getSeconds()).slice(-2);
  const mmm = ('00' + d.getMilliseconds()).slice(-3);
  return '[' + hh + ':' + mm + ':' + ss + '.' + mmm + ']';
};
