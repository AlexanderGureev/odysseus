import ReactGA from 'react-ga';

const GAID = 'UA-110454006-1';

export const GAService = {
  initialized: false,
  init: () => {
    if (GAService.initialized || typeof window === 'undefined') return;
    ReactGA.initialize(GAID);
    GAService.initialized = true;
  },
};
