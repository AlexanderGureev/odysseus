import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { getFavouritesMeta } from 'store/selectors';
import { Nullable } from 'types';
import { logger } from 'utils/logger';

let timer: Nullable<NodeJS.Timeout> = null;
const TIMEOUT = 500;

const clearTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

let initialState: boolean | null = null;

const sync = async (
  projectId: number,
  prevState: boolean,
  newState: boolean,
  { getState, dispatch, services }: EffectOpts
) => {
  const {
    root: {
      meta: { trackId },
      session: { videosession_id },
    },
    favourites: { mode },
    playback: { currentTime },
  } = getState();

  const meta = getFavouritesMeta(getState());

  const data = {
    id: projectId,
    isFavourites: newState ? 1 : 0,
    isStoredInGondwana: 0,
    source: 'player',
  } as const;

  try {
    if (newState) {
      await services.favouritesService.createFavourites({
        data: [
          {
            type: 'project',
            externalId: projectId,
            ...meta,
          },
        ],
      });
    } else {
      await services.favouritesService.deleteFavouriteById({
        id: projectId,
        type: 'project',
        meta,
      });
    }

    services.postMessageService.emit('set_favorites', {
      payload: {
        isFavorites: newState,
        projectId: projectId,
        redirect: true,
        time_cursor: currentTime || 0,
        track_id: trackId,
        videosession_id,
      },
    });

    await services.favouritesService.putFavourites([{ ...data, isStoredInGondwana: 1, updatedAt: Date.now() }]);
  } catch (err) {
    logger.error('[sync favourites failed]', err?.message);

    if (mode === 'AUTHORIZED_MODE_WITHOUT_DB') {
      await services.favouritesService.putFavourites([
        { ...data, isFavourites: prevState ? 1 : 0, updatedAt: Date.now() },
      ]);

      dispatch(sendEvent({ type: 'ROLLBACK_FAVOURITES_STATE', payload: { isFavourites: prevState } }));
    }
  }
};

export const syncFavourites = (
  prevState: boolean,
  newState: boolean,
  { getState, dispatch, services, ...rest }: EffectOpts
) => {
  clearTimer();
  if (initialState === null) initialState = prevState;

  const {
    root: {
      config: { trackInfo },
    },
  } = getState();

  if (!trackInfo) return;

  timer = setTimeout(async () => {
    clearTimer();

    if (initialState === newState) return;
    initialState = null;

    await sync(trackInfo.project.id, prevState, newState, { getState, dispatch, services, ...rest });
  }, TIMEOUT);

  dispatch(
    sendEvent({
      type: 'SYNC_FAVOURITES_RESOLVE',
    })
  );
};
