import { ILocalStorageService } from 'interfaces';
import md5 from 'md5';
import { LocalStorageService } from 'services/LocalStorageService';
import { logger } from 'utils/logger';

import { Collection, DistributionCfg, ExperimentsCfg, ExperimentsState, Groupmap, PlayerExperiment } from './types';

const experimentsContainerPersistKey = 'experiments';

const APP_VERSION = window.ENV.APP_VERSION || 'unknown';
const getCacheKey = (experiments: ExperimentsState) => md5(JSON.stringify(experiments) + '|' + APP_VERSION);

const getExperimentGroups = (data: ExperimentsCfg): Record<string, string> =>
  Object.values(data).reduce((acc, current) => {
    const getGroupsKeys = (groups: string[]) => groups.reduce((acc, key) => ({ ...acc, [key]: key }), {});
    return current?.groups?.length ? { ...acc, ...getGroupsKeys(current.groups) } : acc;
  }, {});

const ExperimentsService = (localStorage: ILocalStorageService) => {
  let serverCfg: ExperimentsState = {};

  const isExperimentEnabled = (state: ExperimentsState, experimentName: PlayerExperiment) =>
    state?.[experimentName] || false;

  const init = (cfg: ExperimentsCfg) => {
    logger.log('[ExperimentsService] init', cfg);

    let experiments: ExperimentsState = {};

    if (localStorage.getItem(experimentsContainerPersistKey)) {
      const f = localStorage.getItem<{
        experiments: ExperimentsState;
        distribution: DistributionCfg;
        config: ExperimentsState;
      }>(experimentsContainerPersistKey);

      serverCfg = f?.config || {};
      experiments = f?.experiments || {};
    }

    return invalidate(experiments, cfg, serverCfg);
  };

  const invalidate = (currentState: ExperimentsState, experimentsCfg: ExperimentsCfg, serverCfg: ExperimentsState) => {
    const testGroups = getExperimentGroups(experimentsCfg);

    const newState = Object.entries(experimentsCfg).reduce<ExperimentsState>((acc, [key, experiment]) => {
      if (!experiment) return acc;

      const group = isExperimentEnabled(currentState, key as PlayerExperiment);
      const isExpWasEnabled = serverCfg[key as PlayerExperiment] === 'experiment';

      const GroupMap = [...Object.keys(testGroups), 'false', 'control', 'experimental'].reduce<Groupmap>(
        (acc, groupName) => {
          return {
            ...acc,
            [groupName]: {
              ...testGroups,
              ['on']: 'experimental',
              ['off']: 'control',
              experiment: isExpWasEnabled && groupName !== 'false' ? groupName : null,
            },
          };
        },
        {}
      );

      const newGroup = GroupMap[`${group}`]?.[experiment.value];
      return newGroup ? { ...acc, [key]: newGroup } : acc;
    }, {});

    const distributionConfig = Object.entries(experimentsCfg).reduce(
      (acc: DistributionCfg, [key, value]) =>
        value?.distribution
          ? {
              ...acc,
              [key]: value.distribution,
            }
          : acc,
      {}
    );

    return updateState(newState, distributionConfig, experimentsCfg);
  };

  const parseDistribution = (distribution: Record<string, number>): Collection =>
    Object.entries(distribution).map(([key, value]) => ({ name: key, chance: value }));

  const selectGroup = (collection: Collection) => {
    const chances: number[] = [];
    let sum = 0;
    const collectionNew = [...collection];
    collection.forEach(({ chance }) => {
      sum += chance;
    });

    collection.forEach(({ chance }) => {
      if (chance === 0) {
        collectionNew.splice(chances.length, 1);
        return null;
      }
      return chances.push(chance / sum + (chances[chances.length - 1] || 0));
    });

    const random = Math.random() * chances[chances.length - 1];
    return collectionNew[chances.findIndex((el) => el > random)].name;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isBlacklisted = (experimentName: PlayerExperiment) => false;

  const engageExperiment = (
    experimentName: PlayerExperiment,
    experiments: ExperimentsState,
    distributionCfg: DistributionCfg
  ) => {
    const distribution = distributionCfg?.[experimentName];
    if (experiments[experimentName] || !distribution || isBlacklisted(experimentName)) return false;

    const group = selectGroup(parseDistribution(distribution));

    logger.log('[ExperimentsService] engageExperiment', { name: experimentName, group });

    return updateState(
      {
        ...experiments,
        [experimentName]: group,
      },
      distributionCfg
    ).experiments;
  };

  const updateState = (experiments: ExperimentsState, distribution: DistributionCfg, serverConfig?: ExperimentsCfg) => {
    if (serverConfig) {
      serverCfg = Object.keys(serverConfig).reduce((acc, expName) => {
        const exp = serverConfig[expName as PlayerExperiment];
        if (!exp?.value) return acc;

        return {
          ...acc,
          [expName]: exp.value,
        };
      }, {});
    }

    localStorage.setItem(experimentsContainerPersistKey, {
      experiments,
      distribution,
      config: serverCfg,
      cacheKey: getCacheKey(experiments),
    });

    return {
      experiments,
      distribution,
    };
  };

  return {
    init,
    engageExperiment,
  };
};

const instance = ExperimentsService(LocalStorageService);
export { instance as ExperimentsService };
