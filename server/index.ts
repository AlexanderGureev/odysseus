import { PlayerError } from '../src/utils/errors';
import { logger } from '../src/utils/logger';
import { request } from '../src/utils/request';
import { ERROR_CODES } from '../types/errors';
import { bootstrap } from './bootstrap';
import { IProcessEnv } from './custom_typings/express/process';

for (const { name, required } of [
  { name: 'NODE_ENV', required: false },
  { name: 'PORT', required: false },
  { name: 'PAK_HOST', required: true },
  { name: 'BE_ENDPOINT', required: true },
  { name: 'PUBLIC_BE_ENDPOINT', required: true },
  { name: 'CTC_BE_ENDPOINT', required: true },
  { name: 'TURMS_ENDPOINT', required: true },
  { name: 'MORPHEUS_ENDPOINT', required: true },
  { name: 'SIREN_HOST', required: true },
  { name: 'SIREN_PUBLIC_HOST', required: true },
  { name: 'SIREN_CTC_HOST', required: true },
  { name: 'SIREN_CTC_PUBLIC_HOST', required: true },
  { name: 'AD_FOX_OWNER_ID', required: true },
  { name: 'INDEXED_DB_LIMIT', required: false },
  { name: 'LOG_LEVEL', required: false },
  { name: 'HORUS_ENABLED', required: false },
  { name: 'YMID', required: false },
  { name: 'SENTRY_EVENT_RATE', required: false },
  { name: 'DEBUG_PAGE', required: false },
  { name: 'DATA_CACHE_TIME', required: false },
  { name: 'DATA_REQUEST_TIMEOUT', required: false },
  { name: 'CANARY_RELEASE', required: false },
  { name: 'SAURON_API_URL', required: false },
  { name: 'SIREN_API_TOKEN', required: false },
  { name: 'PAK_API_TOKEN', required: false },
  { name: 'CDN_HOSTNAME', required: false },
  { name: 'DEBUG_MODE', required: false },
  { name: 'LINKED_AUDIO_TRACKS_CONFIG_PATH', required: false },
  { name: 'APP_STATIC_ENDPOINT', required: false },
] as Array<{ name: keyof IProcessEnv; required: boolean }>) {
  const value = process.env[name];
  logger.info('[SERVICE]', `env: ${name} = ${value}`);
  if (!value && required) throw new Error(`Check environment variables ${name}`);
}

(async () => {
  logger.info('[SERVICE]', 'bootstrap');

  request.setup({
    networkCheck: false,
  });

  // TODO добавить bi для этих ошибок
  request.addHook('beforeResponse', async (response) => {
    if (response.status === 403) {
      const text = await response.text();

      if (text.toLowerCase().includes('access to resource was blocked')) {
        throw new PlayerError(ERROR_CODES.WAF_ERROR);
      }
    }

    if (response.status === 429) {
      throw new PlayerError(ERROR_CODES.NETWORK_TIMEOUT_ERROR);
    }

    if (response.status === 451) {
      throw new PlayerError(ERROR_CODES.STORMWALL_GEOBLOCK_ERROR);
    }
  });

  try {
    await bootstrap();
  } catch (err) {
    logger.error('[SERVICE]', 'bootstrap failed', err);
    process.exit(1);
  }
})();
