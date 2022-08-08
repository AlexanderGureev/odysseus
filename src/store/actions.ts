import { createAction } from '@reduxjs/toolkit';

import type { EventPayload } from './types';

export const FSM_EVENT = '@fsm/EVENT';

export const sendEvent = createAction<EventPayload>(FSM_EVENT);
