import randomstring from 'randomstring';

export const randomHash32 = () => randomstring.generate({ length: 32, charset: 'alphanumeric' });
export const randomHash12 = () =>
  randomstring.generate({ length: 12, charset: 'alphanumeric', capitalization: 'lowercase' });
export const randomUnit32 = () => Math.round(Math.random() * 4294967295);
