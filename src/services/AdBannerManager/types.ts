export type BannerOptions = {
  bannerStates: Array<'desktop' | 'tablet' | 'phone'>;
  adaptiveOptions: Partial<{
    tabletWidth: number;
    phoneWidth: number;
    isAutoReloads: boolean;
  }>;
};
