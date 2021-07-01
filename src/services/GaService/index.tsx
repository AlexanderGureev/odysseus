import React from 'react';
import { GAService } from './service';

export const GAContainer: React.FC = () => {
  React.useEffect(() => {
    GAService.init();
  }, []);

  return <></>;
};
