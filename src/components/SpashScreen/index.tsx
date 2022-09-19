import { useAppDispatch } from 'hooks';
import React, { useEffect } from 'react';
import { sendEvent } from 'store';
import { Screens } from 'store/slices/splashscreen';

import Styles from './index.module.css';

export const SpashScreen: React.FC<{ data: Screens }> = ({ data }) => {
  const dispatch = useAppDispatch();
  const [index, setIndex] = React.useState<number>(0);

  useEffect(() => {
    if (index === data.length) {
      dispatch(sendEvent({ type: 'SHOWING_SPLASHCREEN_END' }));
    }
  }, [data.length, dispatch, index]);

  return (
    <div className={Styles.splashscreen}>
      {data[index] ? (
        <img
          key={index}
          src={data[index].img}
          style={{
            animationDuration: `${data[index].duration / 1000}s`,
          }}
          onAnimationEnd={() => {
            setIndex(index + 1);
          }}
        />
      ) : null}
    </div>
  );
};
