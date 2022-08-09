import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { BeholderTokenResponse } from 'types/beholder';
import { logger } from 'utils/logger';
import { request } from 'utils/request';
import { getTokenExpiredTime } from 'utils/token';

export const fetchBeholderToken = async ({ getState, dispatch }: EffectOpts) => {
  const {
    root: {
      meta: { userToken },
    },
    beholder: { hostname, serviceId },
  } = getState();

  try {
    const response = await request.get(`${hostname}/token`, {
      params: {
        service_id: serviceId,
      },
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`failed to fetch beholder token: ${response.status}, ${response.statusText}`);
    }

    const { data }: BeholderTokenResponse = await response.json();
    const token = data.attributes.player_token;

    if (!token) {
      throw new Error('beholder token is undefined (data.attributes.player_token)');
    }

    dispatch(
      sendEvent({
        type: 'FETCH_BEHOLDER_TOKEN_RESOLVE',
        payload: {
          token,
          tokenExpiredAt: getTokenExpiredTime(token),
        },
      })
    );
  } catch (err) {
    logger.error('[fetch beholder token]', err?.message);

    dispatch(
      sendEvent({
        type: 'FETCH_BEHOLDER_TOKEN_REJECT',
      })
    );
  }
};
