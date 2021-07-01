import React from 'react';
import { useTheme } from 'hooks';

const DEFAULT_SKIN_CONTROLS = 'skin-controls';

const SkinConstructor: React.FC = ({ children }) => {
  const theme = useTheme();

  return (
    <>
      {children}
      <div id={DEFAULT_SKIN_CONTROLS}></div>
    </>
  );
};

export { SkinConstructor };
