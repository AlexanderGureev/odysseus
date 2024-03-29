function baseFindIndex<T>(
  array: T[],
  predicate: (item: T, idx: number, array: T[]) => boolean,
  fromIndex: number,
  fromRight: boolean
) {
  const { length } = array;
  let index = fromIndex + (fromRight ? 1 : -1);

  while (fromRight ? index-- : ++index < length) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

export function findLastIndex<T>(
  array: T[],
  predicate: (item: T, idx: number, array: T[]) => boolean,
  fromIndex?: number
) {
  const length = array == null ? 0 : array.length;
  if (!length) {
    return -1;
  }

  let index = length - 1;
  if (fromIndex !== undefined) {
    index = fromIndex;
    index = fromIndex < 0 ? Math.max(length + index, 0) : Math.min(index, length - 1);
  }

  return baseFindIndex(array, predicate, index, true);
}
