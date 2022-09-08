import circleCloseIcon from 'assets/icons/close-in-circle.svg';
import closeIcon from 'assets/sprite/icons-24-cross.svg';
import cn from 'classnames';
import { useAppDispatch } from 'hooks';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { sendEvent } from 'store';

import Styles from './index.module.css';

type ModalOpts = {
  closable: boolean;
};

const ModalApiContext = React.createContext<{ setOptions: (opts: ModalOpts) => void }>({
  setOptions: () => {
    return;
  },
});

export const useModal = () => useContext(ModalApiContext);

const initialOpts = { closable: true };

export const Modal = ({ children }: React.PropsWithChildren) => {
  const dispatch = useAppDispatch();
  const [opts, setOpts] = useState<ModalOpts>(initialOpts);

  useEffect(() => {
    setOpts(initialOpts);
  }, [children]);

  const onClose = () => {
    dispatch(sendEvent({ type: 'CLOSE_OVERLAY' }));
  };

  const setOptions = useCallback((opts: ModalOpts) => {
    setOpts((p) => ({ ...p, ...opts }));
  }, []);

  const value = useMemo(() => ({ setOptions }), [setOptions]);

  return (
    <ModalApiContext.Provider value={value}>
      <div className={cn(Styles.wrapper, Boolean(children) && Styles.visible)}>
        <div className={Styles.modal}>
          {opts.closable && (
            <img onClick={onClose} className={Styles.close} src={isMobile ? circleCloseIcon : closeIcon} />
          )}
          {children}
        </div>
      </div>
    </ModalApiContext.Provider>
  );
};
