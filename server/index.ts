import { bootstrap } from './server';

['PAK_HOST', 'HYDRA_HOST', 'BE_ENDPOINT', 'HORUS_SRC', 'SIREN_HOST', 'SIREN_CTC_HOST'].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Check environment variables ${key}`);
  }
});

bootstrap();
