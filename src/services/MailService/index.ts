import { sendEmail } from 'api';

import { EmailBody, ProblemName } from './types';

const ALLOWED_BODY_KEYS = {
  LIST_PROBLEM: 'list_problem',
  PROJECT_NAME: 'project_name',
  SEASON_NAME: 'season_name',
  EPISODE_NAME: 'episode_name',
  TRACK_ID: 'track_id',
} as const;

export const ERROR_CODES_BY_PROBLEM_NAME = {
  not_play: 11001,
  freezes: 11002,
  wrong_name: 11003,
  sound_problems: 11004,
  poor_quality: 11005,
  other: 11000,
};

const allowedKeys = [
  'list_problem',
  'problem_description',
  'email',
  'track_id',
  'user_id',
  'videosession_id',
  'player_location',
  'web_version',
] as const;

const getBodyComplainLetter = (data: Omit<EmailBody, 'clientIp'>): string => {
  const templateByAllowedKeys = {
    list_problem: false,
    problem_description: 'Описание проблемы: ',
    email: 'E-mail: ',
    track_id: 'Идентификатор трека в ПАК: ',
    user_id: 'Идентификатор пользователя: ',
    videosession_id: 'Идентификатор сессии воспроизведения: ',
    player_location: 'Адрес плеереа: ',
    web_version: 'Версия Web: ',
  };

  return allowedKeys.reduce((template, allowedKey) => {
    if (!Object.hasOwnProperty.call(data, allowedKey) || !data[allowedKey]) return template;

    if (allowedKey === 'list_problem' && Array.isArray(data[allowedKey])) {
      const listProblemTemplate = data[allowedKey].reduce((nestedAcc, problem) => {
        return problem.checked ? `${nestedAcc}${problem.labelText}: + \n` : nestedAcc;
      }, '');

      return `${template}${listProblemTemplate}\n`;
    }

    return `${template}${templateByAllowedKeys[allowedKey]}${data[allowedKey]} \n`;
  }, '');
};

const getSubjectComplaintLetter = (data: Omit<EmailBody, 'clientIp'>): string => {
  const LIST = [...data[ALLOWED_BODY_KEYS.LIST_PROBLEM]].filter((i) => i.checked);

  if (!LIST.length && data.problem_description) {
    LIST.push({ name: 'other', labelText: '', checked: true });
  }

  const template = LIST.reduce((acc, { name }, idx, { length }) => {
    const isNext = idx < length - 1;
    return `${acc} ${ERROR_CODES_BY_PROBLEM_NAME[name as ProblemName]}${isNext ? ';' : '.'}`;
  }, 'Жалоба из плеера:');

  const content = [
    data[ALLOWED_BODY_KEYS.PROJECT_NAME],
    data[ALLOWED_BODY_KEYS.SEASON_NAME],
    data[ALLOWED_BODY_KEYS.EPISODE_NAME],
    data[ALLOWED_BODY_KEYS.TRACK_ID],
  ]
    .map((i) => `${i}`.trim())
    .filter(Boolean)
    .reduce((acc, item, idx, { length }) => {
      const isNext = idx < length - 1;
      return `${acc} ${item}${isNext ? ';' : ''}`;
    }, 'Контент:');

  return `${template} ${content}`;
};

const MailService = () => {
  const send = async ({ clientIp, ...data }: EmailBody) => {
    const body = getBodyComplainLetter(data);
    const subject = getSubjectComplaintLetter(data);

    await sendEmail({
      clientIp,
      from: data.email,
      subject,
      contents: body,
    });
  };

  return { send };
};

const instance = MailService();
export { instance as MailService };
