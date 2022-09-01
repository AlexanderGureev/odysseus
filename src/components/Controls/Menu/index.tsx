import menuIcon from 'assets/icons/icons-24-more-vertical.svg';
import React from 'react';

import Styles from './index.module.css';

export const Menu = () => {
  return (
    <div className={Styles.menu}>
      <img src={menuIcon} />
    </div>
  );
};
