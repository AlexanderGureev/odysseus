export type State = 'IDLE';

export type Event = 'DO_INIT';

export type EventPayload = {
  type: Event;
  payload?: null;
};

export type FSMState = {
  step: State;
};
