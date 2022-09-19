export type PlayerExperiment = 'EXP_TEST1' | 'EXP_TEST2' | 'EXP_TEST3' | 'EXP_TEST4' | 'EXP_ACTI_73';

export type Collection = Array<{ name: string; chance: number }>;
export type DistributionCfg = { [key in PlayerExperiment]?: Record<string, number> };

export type EmbedType = 'resource' | 'embedded' | 'all';
export type ExperimentCfg = {
  description: string;
  value: string;
  groups: string[];
  distribution: Record<string, number>;
  partners?: string[];
  embedType?: EmbedType;
};

export type ExperimentsState = { [key in PlayerExperiment]?: string };
export type ExperimentsCfg = { [key in PlayerExperiment]?: ExperimentCfg };
export type Groupmap = { [key in string]: Record<string, string | null> };
