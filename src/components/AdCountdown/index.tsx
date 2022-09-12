import React from 'react';
import { declOfNum } from 'utils/declOfNum';

import Styles from './index.module.css';

export const AdCountdown: React.FC<{ time: number }> = ({ time }) => {
  return (
    <div className={Styles.countdown}>
      Реклама начнётся через {time} {declOfNum(time, ['секунду', 'секунды', 'секунд'])}
    </div>
  );
};
