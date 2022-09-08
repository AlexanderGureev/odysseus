import { MenuContext, MenuState } from 'context';
import React, { useMemo, useState } from 'react';

export const MenuProvider = ({ children }: React.PropsWithChildren) => {
  const [state, setState] = useState<MenuState>({});

  const value = useMemo(() => ({ state, setState }), [state]);

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};
