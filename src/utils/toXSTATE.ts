/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FSMConfig } from 'store';

export const toXSTATE = <S extends string, E extends string>(
  name: string,
  initialState: S,
  definition: FSMConfig<S, E>
) => {
  const states = Object.keys(definition).reduce((acc, state) => {
    const transitions = definition[state as S];
    const on = Object.keys(transitions!).reduce((acc, event) => {
      if (!transitions![event as E]) return acc;

      return {
        ...acc,
        [event]: transitions![event as E],
      };
    }, {});

    return {
      ...acc,
      [state]: {
        on,
      },
    };
  }, {});

  return {
    id: name,
    initial: initialState,
    context: {},
    states,
  };
};
