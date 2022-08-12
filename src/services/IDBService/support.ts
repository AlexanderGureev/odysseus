export const isIndexedDBSupported = () =>
  Boolean(window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB);
