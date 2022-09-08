import { useCallback, useState } from 'react';

import { useCopyToClipboard } from './useCopyToClipboard';

const RESET_TIMEOUT = 3000;

export const useCopy = () => {
  const { isSupported, copy } = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState(false);

  const onCopy = useCallback(
    async (value: string) => {
      setIsCopied(false);

      const result = await copy(value);
      setIsCopied(result);
      setTimeout(() => {
        setIsCopied(false);
      }, RESET_TIMEOUT);
    },
    [copy]
  );

  return {
    isCopied,
    isSupported,
    onCopy,
  };
};
