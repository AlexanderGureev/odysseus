import ReactGA from 'react-ga';
import { logger } from 'utils/logger';

const GAID = 'UA-110454006-1';

export const GAService = {
  initialized: false,
  init: async () => {
    if (GAService.initialized || typeof window === 'undefined') return;

    logger.log('[GAService]', 'init');

    ReactGA.initialize(GAID);
    GAService.initialized = true;
  },
};
