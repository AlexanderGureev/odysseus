import React from 'react';
import { usePlayerConfig, useQueryParams } from 'hooks';

export const AgeConfirmationPopup: React.FC = ({ children }) => {
  const { config } = usePlayerConfig();
  const { adult = true } = useQueryParams();

  const minAge = config?.playlist?.items?.[0]?.min_age;
  const isConfirmed = (minAge && minAge < 18) || adult;

  return <>{children}</>;
};
