import cn from 'classnames';
import { Checkbox } from 'components/UIKIT/Checkbox';
import { Input, Textarea } from 'components/UIKIT/Input';
import { LoadingDots } from 'components/UIKIT/LoadingDots';
import { useModal } from 'components/UIKIT/Modal';
import { useAppDispatch, useAppSelector } from 'hooks';
import React, { useCallback, useEffect, useState } from 'react';
import { Problem, ProblemName } from 'services/MailService/types';
import { sendEvent } from 'store';

import Styles from './index.module.css';

type FormField = ProblemName | 'email';

const Promblems: { [key in FormField]?: string } = {
  not_play: 'Не воспроизводится',
  freezes: 'Постоянно зависает',
  wrong_name: 'Неправильное название',
  sound_problems: 'Звук не совпадает или отсутствует',
  poor_quality: 'Плохое качество',
};

const PROBLEM_DESCRIPTION_REGEXP = /^[a-zA-Zа-яА-Я0-9\s.,!?\-_+=;:@()"]+$/;
const EMAIL_REGEXP = /^\S+@\S+\.\S+$/;

const DEFAULT_ERROR_TEXT = 'Что-то пошло не так';

const ValidateRules: { [key in FormField]?: (value: string) => { isValid: boolean; error?: string } } = {
  other: (v) => ({
    isValid: v.match(PROBLEM_DESCRIPTION_REGEXP) !== null && v.length <= 1000,
  }),
  email: (v) => ({
    isValid: v === '' || (v.match(EMAIL_REGEXP) !== null && v.length <= 254),
    error: 'Некорректный email',
  }),
};

type FormValue<T> = {
  value: T;
  isValid: boolean;
  error?: string;
};

export type FormState = Partial<{
  not_play: FormValue<boolean>;
  freezes: FormValue<boolean>;
  wrong_name: FormValue<boolean>;
  sound_problems: FormValue<boolean>;
  poor_quality: FormValue<boolean>;
  email: FormValue<string>;
  other: FormValue<string>;
}>;

export const createProblemList = (state: FormState) => {
  const { other, email, ...rest } = state;

  return Object.keys(rest).reduce((acc: Problem[], k) => {
    const name = k as ProblemName;
    if (!state[name]?.value) return acc;

    return [
      ...acc,
      {
        name,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        labelText: Promblems[name]!,
      },
    ];
  }, []);
};

export const Complain = () => {
  const dispatch = useAppDispatch();
  const [formState, setState] = useState<FormState>({});
  const step = useAppSelector((state) => state.errorReportsForm.step);
  const { setOptions } = useModal();

  useEffect(() => {
    if (step === 'EMAIL_STEP') setOptions({ closable: false });
  }, [dispatch, setOptions, step]);

  useEffect(() => {
    if (step === 'SENDING_REPORT_STEP') {
      const { other, email } = formState;
      const problems = createProblemList(formState);

      dispatch(
        sendEvent({
          type: 'SEND_ERROR_REPORT',
          meta: {
            problems,
            description: other?.value,
            email: email?.value,
          },
        })
      );
    }
  }, [dispatch, formState, step]);

  useEffect(() => {
    if (step === 'END') dispatch(sendEvent({ type: 'CLOSE_OVERLAY' }));
    if (step === 'ERROR_STEP') setOptions({ closable: true });
  }, [dispatch, step, setOptions]);

  const onChange = useCallback(
    (name: FormField) => (value: string | boolean) => {
      setState((prev) => ({
        ...prev,
        [name]: {
          value,
          isValid: true,
        },
      }));
    },
    []
  );

  const onSubmit = () => {
    let isInvalid = false;

    const data = Object.keys(formState).reduce((acc: FormState, k) => {
      const field = k as FormField;
      const { isValid, error } = ValidateRules[field]?.(`${formState[field]?.value}`) ?? { isValid: true };

      if (!isValid) isInvalid = true;

      return {
        ...acc,
        [field]: {
          ...formState[field],
          isValid,
          error: !isValid ? error : undefined,
        },
      };
    }, {});

    setState(data);
    dispatch(
      sendEvent({ type: step === 'IDLE' ? 'CLICK_REPORT_BUTTON' : 'CLICK_SEND_REPORT_BUTTON', meta: formState })
    );

    if (!isInvalid) dispatch(sendEvent({ type: 'NEXT_STEP' }));
  };

  const isActive = Object.values(formState).filter(({ value }) => Boolean(value)).length > 0;

  return (
    <div className={cn(Styles.wrapper, Styles[step.toLowerCase()])}>
      <div className={Styles.content}>
        {step === 'IDLE' && (
          <>
            <h6 className={Styles.title}>В чём проблема с этим видео?</h6>
            <div className={Styles.form}>
              {Object.keys(Promblems).map((key) => {
                return (
                  <Checkbox
                    key={key}
                    label={Promblems[key as FormField]}
                    value={key}
                    onChange={onChange(key as FormField)}
                  />
                );
              })}

              <Textarea
                isValid={formState.other?.isValid}
                className={Styles.textarea}
                placeholder="Если хочешь, дополни описание"
                maxHeight={120}
                showCount
                maxLength={1000}
                onChange={onChange('other')}
              />
            </div>
            <button disabled={!isActive} className={cn(Styles.button, 'button')} onClick={onSubmit}>
              Сообщить об ошибке
            </button>
          </>
        )}

        {step !== 'IDLE' && (
          <>
            <h6 className={Styles.title}>Спасибо, мы все проверим.</h6>
            <div className={Styles.form}>
              <p className={Styles.description}>Если ты хочешь, чтобы мы связались с тобой, укажи свой email</p>
              <Input
                size="s-size"
                placeholder="Email (необязательно)"
                onChange={onChange('email')}
                isValid={formState.email?.isValid}
                error={formState.email?.error}
              />
            </div>
            <div className={Styles.group}>
              <button className={cn(Styles.button, 'button')} onClick={onSubmit}>
                {step === 'SENDING_REPORT_STEP' ? <LoadingDots /> : 'ок'}
              </button>
              {step === 'ERROR_STEP' && <div className={Styles.error}>{DEFAULT_ERROR_TEXT}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
