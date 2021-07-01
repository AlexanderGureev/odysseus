export const createCounter = () => {
  let counter = 0;

  return () => {
    counter++;
    return counter;
  };
};
