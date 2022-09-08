import { LocalStorageService } from 'services';

export const useLocalStorage = () => {
  return {
    ...LocalStorageService,
  };
};
