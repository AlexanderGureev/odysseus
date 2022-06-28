export const handlePlayreadySource = (licenseServerUrl: string) => {
  return {
    keySystems: {
      'com.microsoft.playready': licenseServerUrl,
    },
  };
};
