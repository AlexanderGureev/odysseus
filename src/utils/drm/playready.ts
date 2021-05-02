export const handlePlayreadySource = (licenseServerUrl: string) => {
  return {
    'com.microsoft.playready': licenseServerUrl,
  };
};
