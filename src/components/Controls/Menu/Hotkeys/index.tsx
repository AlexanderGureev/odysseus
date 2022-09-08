import cn from 'classnames';
import React from 'react';
import { BACKWARD_REWIND_STEP, FORWARD_REWIND_STEP, VOLUME_STEP } from 'store/slices/hotkeys/constants';

import Styles from './index.module.css';

export const Hotkeys = () => {
  return (
    <div className={Styles.wrapper}>
      <div className={Styles.content}>
        <h6 className={Styles.title}>Горячие клавиши</h6>
        <div className={Styles.wrapper}>
          <div className={Styles.main}>
            <div className={Styles['main-row']}>
              <span className={cn(Styles.description, Styles['stick-bottom'])}>
                <span className={Styles.text}>сделать громче на {VOLUME_STEP * 100}%</span>
                <span className={cn(Styles.stick, Styles.vertical)}></span>
              </span>
            </div>

            <div className={cn(Styles['main-row'], Styles['align-bottom'])}>
              <span className={cn(Styles.description, Styles['stick-right'])}>
                <span className={Styles.text}>
                  перемотка
                  <br />
                  на {BACKWARD_REWIND_STEP} секунд назад
                </span>
                <span className={cn(Styles.stick, Styles.horizontal)}></span>
              </span>

              <div className={Styles.arrows}>
                <span className={cn(Styles.arrow, Styles.top)}>
                  <span className={cn(Styles.icon, Styles['top-arrow'])}></span>
                </span>
                <div className={Styles['arrows-row']}>
                  <span className={cn(Styles.arrow, Styles.left)}>
                    <span className={cn(Styles.icon, Styles['left-arrow'])}></span>
                  </span>
                  <span className={cn(Styles.arrow, Styles.bottom)}>
                    <span className={cn(Styles.icon, Styles['bottom-arrow'])}></span>
                  </span>
                  <span className={cn(Styles.arrow, Styles.right)}>
                    <span className={cn(Styles.icon, Styles['right-arrow'])}></span>
                  </span>
                </div>
              </div>

              <span className={cn(Styles.description, Styles['stick-left'])}>
                <span className={Styles.text}>
                  перемотка
                  <br />
                  на {FORWARD_REWIND_STEP} секунд вперед
                </span>
                <span className={cn(Styles.stick, Styles.horizontal)}></span>
              </span>
            </div>

            <div className={Styles['main-row']}>
              <span className={cn(Styles.description, Styles['stick-top'])}>
                <span className={cn(Styles.text)}>сделать тише на {VOLUME_STEP * 100}%</span>
                <span className={cn(Styles.stick, Styles.vertical)}></span>
              </span>
            </div>
          </div>
          <div className={Styles.aside}>
            <div className={Styles['aside-column']}>
              <span className={cn(Styles['icon-container'], Styles.buffered)}>
                <span className={cn(Styles.icon, Styles.click)}></span>
              </span>
              <span className={Styles.description}>
                <span className={Styles.text}>
                  полноэкранный
                  <br />
                  режим по двойному
                  <br />
                  клику мыши
                </span>
              </span>
            </div>
            <div className={Styles['aside-column']}>
              <span className={cn(Styles['icon-container'], Styles.buffered)}>
                <span className={cn(Styles.icon, Styles.esc)}></span>
              </span>
              <span className={Styles.description}>
                <span className={Styles.text}>
                  выход
                  <br />
                  из полноэкранного
                  <br />
                  режима
                </span>
              </span>
            </div>
            <div className={Styles['aside-column']}>
              <span className={cn(Styles['icon-container'], Styles.buffered)}>
                <span className={cn(Styles.icon, Styles.space)}></span>
              </span>
              <span className={Styles.description}>
                <span className={cn(Styles.text, Styles['space-key'])}>воспроизведение/пауза</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
