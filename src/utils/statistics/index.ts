/* eslint-disable @typescript-eslint/ban-ts-comment */
export const sendStat = (url: string) => {
  if (!url) return;

  let image = new Image();
  image.src = url;

  // @ts-ignore
  image = null;
};
