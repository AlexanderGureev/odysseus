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

const pad = (num: number | string) => `0${num}`.slice(-2);

export const secToHumanReadeable = (sec: number, padHours = true): string => {
  let secs = String(Math.floor(sec));
  let minutes = String(Math.floor(+secs / 60));
  secs = `${pad(+secs % 60)}`;

  let hours = String(Math.floor(+minutes / 60));
  minutes = `${pad(+minutes % 60)}:`;

  hours = +hours > 0 ? `${padHours ? pad(hours) : hours}:` : '';

  return `${hours}${minutes}${secs}`;
};

export const toFixed = (num: number, fractionDigits = 3) => Number(num.toFixed(fractionDigits));
