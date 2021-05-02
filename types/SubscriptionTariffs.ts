import { Nullable } from '.';

export enum Currency {
  'RUB' = 'RUB',
  'USD' = 'USD',
}

export type Price = {
  currency: Currency;
  amount: number;
};

export type Image = {
  aspectRatio: number;
  width: number;
  height: number;
  url: string;
};

export type IMGTypeGallery = 'JPEG' | 'PNG' | 'WEBP' | 'SVG' | 'MPEG';
export type ImageRecord = Record<string, Image>;
export type Gallery = Partial<Record<IMGTypeGallery, ImageRecord>>;

export enum ContentType {
  VOD = 'VOD',
  LIVE = 'Live',
  LK = 'LK',
  UFC = 'UFC',
}

export enum SubscriptionServiceState {
  'UNAVAILABLE' = 'UNAVAILABLE', // недоступно для покупки
  'AVAILABLE' = 'AVAILABLE', // доступно для покупки
  'AVAILABLE_EXCHANGE' = 'AVAILABLE_EXCHANGE', // доступно для перехода (upsale/downsale)
  'ACTIVE' = 'ACTIVE', // куплено
  'DEFERRED' = 'DEFERRED', // куплено, переход будет после окончания текущей
  'ACTIVE_OTHER_PLATFORM' = 'ACTIVE_OTHER_PLATFORM', // куплено на другой платформе
  'DEFERRED_OTHER_PLATFORM' = 'DEFERRED_OTHER_PLATFORM', // куплено на другой платформе, переход будет после окончания текущей
}

export type PayButton = {
  isActive: boolean;
  payButtonColor: Nullable<string>;
  payButtonText: Nullable<string>;
  payButtonTextColor: Nullable<string>;
};

export type AdvantagesByType = Partial<{
  title: string;
  items: string[];
  payButton: Nullable<PayButton>;
  gallery: Gallery;
  price: Price;
  paymentMethod?: PaymentMethod;
}>;

export type AdvantagesType = {
  type: ContentType;
  description: string;
  items: Array<{ title: string }>;
  payButton: Nullable<PayButton>;
  substrateGallery: Gallery;
};

export enum SubscriptionOptionLabel {
  INCLUDED = 'INCLUDED',
  NOT_INCLUDED = 'NOT_INCLUDED',
}

export type SubscriptionTariffsOption = {
  title: string;
  label: SubscriptionOptionLabel;
};

export enum PaymentMethodType {
  GOOGLE_PLAY = 'GOOGLE_PLAY',
  APP_STORE = 'APP_STORE',
  MAP_PAYMENTS = 'MAP_PAYMENTS',
}

export type PaymentMethod = {
  id: number;
  name: string;
  paymentSystemId: number;
  type: PaymentMethodType;
  trial: Nullable<{ duration: number }>;
};

export type SubscriptionServiceTariffs = {
  id: number;
  name: string;
  price: Price;
  changePrice: Nullable<Price>;
  duration: number;
  productId: string;
  isAutoRenewing: boolean;
  paymentMethods: PaymentMethod[];
  tariffModifiers: {
    googleFreeTrialEligible?: boolean;
    appleIntroductoryOfferEligible?: boolean;
    mapFreeTrialEligible?: boolean;
  };
};

export type SubscriptionTariffs = {
  id: number;
  name: string;
  options: SubscriptionTariffsOption[];
  tariffs: SubscriptionServiceTariffs[];
  state: Nullable<SubscriptionServiceState>;
  advantages: AdvantagesType[];
};
