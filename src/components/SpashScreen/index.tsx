import { useAppDispatch } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';
import { Screens } from 'store/slices/splashscreen';
import { sleep } from 'utils/retryUtils';

import Styles from './index.module.css';

export const SpashScreen: React.FC<{ data: Screens }> = ({ data }) => {
  const dispatch = useAppDispatch();
  const [image, setImage] = React.useState<string | null>(null);

  React.useLayoutEffect(() => {
    const imageIterator = async () => {
      for (const { img, duration } of data) {
        setImage(img);
        await sleep(duration);
      }
    };

    imageIterator().then(() => {
      dispatch(sendEvent({ type: 'SHOWING_SPLASHCREEN_END' }));
    });
  }, [data, dispatch]);

  return image ? (
    <div className={Styles.splashscreen}>
      <img src={image} />
    </div>
  ) : null;
};
