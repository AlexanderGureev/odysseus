import React from 'react';

import Styles from './index.module.css';

export const LoadingDots = () => (
  <span className={Styles.loading}>
    <i className={Styles.left} />
    <i className={Styles.center} />
    <i className={Styles.right} />
  </span>
);
