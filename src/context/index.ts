import React from 'react';

export type MenuState = { [key in string]: 'enter' | 'leave' | null };

export type MenuCtx = {
  state: MenuState;
  setState: React.Dispatch<React.SetStateAction<MenuState>>;
};

export const MenuContext = React.createContext<MenuCtx>({} as MenuCtx);
