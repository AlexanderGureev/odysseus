import { useTheme } from 'hooks';
import React from 'react';

const DEFAULT_SKIN_CONTROLS = 'skin-controls';

const SkinConstructor = ({ children }: React.PropsWithChildren) => {
  const theme = useTheme();

  return (
    <>
      {children}
      <div id={DEFAULT_SKIN_CONTROLS}></div>
    </>
  );
};

export { SkinConstructor };
