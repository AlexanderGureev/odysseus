import randomstring from 'randomstring';

export const randomHash32 = (opts: randomstring.GenerateOptions = {}) =>
  randomstring.generate({ length: 32, charset: 'alphanumeric', capitalization: 'lowercase', ...opts });
export const randomHash12 = (opts: randomstring.GenerateOptions = {}) =>
  randomstring.generate({ length: 12, charset: 'alphanumeric', capitalization: 'lowercase', ...opts });
export const randomUnit32 = () => Math.round(Math.random() * 4294967295);
