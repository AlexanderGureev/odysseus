import { usePlayerConfig, useQueryParams } from 'hooks';
import React from 'react';

export const AgeConfirmationPopup = ({ children }: React.PropsWithChildren) => {
  const { config } = usePlayerConfig();
  const { adult = true } = useQueryParams();

  const minAge = config?.playlist?.items?.[0]?.min_age;
  const isConfirmed = (minAge && minAge < 18) || adult;

  return <>{children}</>;
};
