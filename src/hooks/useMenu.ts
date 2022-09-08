import { MenuContext } from 'context';
import { useContext } from 'react';

export const useMenu = () => {
  return useContext(MenuContext);
};
