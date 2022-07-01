import { Nullable } from '.';

export enum PaymentMethodType {
  GOOGLE_PLAY = 'GOOGLE_PLAY',
  APP_STORE = 'APP_STORE',
  MAP_PAYMENTS = 'MAP_PAYMENTS',
}

export enum StateType {
  NEW_FULL_PRICE = 'NEW_FULL_PRICE',
  NEW_TRIAL = 'NEW_TRIAL',
  NEW_PROMOCODE = 'NEW_PROMOCODE',
  RENEWED = 'RENEWED',
  BILLING_RETRY = 'BILLING_RETRY',
}

export enum IpsType {
  UNKNOWN = 'UNKNOWN',
  VISA = 'VISA',
  MASTER = 'MASTER',
  AMEX = 'AMEX',
  JCB = 'JCB',
  DINERS = 'DINERS',
  MIR = 'MIR',
}

export enum AppliedTariffModifiers {
  MAP_FREE_TRIAL = 'MAP_FREE_TRIAL',
  GOOGLE_FREE_TRIAL = 'GOOGLE_FREE_TRIAL',
  APPLE_FREE_TRIAL = 'APPLE_FREE_TRIAL',
  GOOGLE_INTRODUCTORY_PRICE = 'GOOGLE_INTRODUCTORY_PRICE',
  APPLE_INTRODUCTORY_PRICE = 'APPLE_INTRODUCTORY_PRICE',
}

export type SubscriptionType = 'unknown' | 'none' | 'trial' | 'introductory_price' | 'full_price' | 'promocode';

export type UserSubscription = {
  id: number;
  state: StateType;
  beginAt: string;
  endAt: string;
  tariffId: number;
  productId: Nullable<string>;
  paymentMethodId: number;
  paymentMethodType: PaymentMethodType;
  isAutoRenewing: boolean;
  paymentPending: boolean;
  servicePackage: {
    id: number;
    name: string;
    shortName: string;
  };
  promocodeActivatedId: Nullable<number>;
  card: Nullable<{
    cardNumber: string;
    cardId: number;
    ips: IpsType;
  }>;
  appliedTariffModifiers: AppliedTariffModifiers[];
  receiptUrl: string;
  receiptText: string;
};
