import { initBilling, getSubscriptions, purchase, restorePurchases as restore } from '../google-play-billing/src';

export const TIER_MAP: Record<string, string> = {
  plus_monthly: 'plus',
  premium_monthly: 'premium',
  pro_semiannual: 'pro',
  yearly_annual: 'yearly',
};

export async function initIAP() {
  await initBilling();
}

export async function getProducts() {
  return getSubscriptions();
}

export async function purchaseSubscription(productId: string) {
  return purchase(productId);
}

export async function restorePurchases() {
  return restore();
}

export function disconnectIAP() {}
