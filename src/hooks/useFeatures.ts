import { useAppSelector } from './store';

export const useFeatures = () => {
  return useAppSelector((state) => state.root.features);
};
