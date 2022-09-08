import addFavIcon from 'assets/sprite/icons-24-favorites-simple-add.svg';
import removeFavIcon from 'assets/sprite/icons-24-favorites-simple-added.svg';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const FavouritesButton = () => {
  const dispatch = useAppDispatch();
  const { isFavourites } = useAppSelector((state) => state.favouritesController);

  const onClick = React.useCallback(() => {
    dispatch(sendEvent({ type: 'SET_FAVOURITES', meta: { isFavourites: !isFavourites } }));
  }, [dispatch, isFavourites]);

  return (
    <div className={Styles.favourites} onClick={onClick}>
      <img className={Styles.icon} src={isFavourites ? removeFavIcon : addFavIcon} />
      <span>{isFavourites ? 'В избранном' : 'В избранное'}</span>
    </div>
  );
};
