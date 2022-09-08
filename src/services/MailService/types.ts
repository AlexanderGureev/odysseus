import { ERROR_CODES_BY_PROBLEM_NAME } from '.';

export type Problem = {
  name: ProblemName;
  labelText: string;
  // checked: boolean;
};

export type EmailBody = {
  email?: string;
  list_problem: Problem[];
  problem_description?: string;
  track_id: number | null;
  videosession_id: string;
  user_id: number | null;
  player_location: string | null;
  app_version: string | null;
  web_version: string | null;
  project_name: string;
  season_name: string;
  episode_name: string;
};

export type ProblemName = keyof typeof ERROR_CODES_BY_PROBLEM_NAME;
