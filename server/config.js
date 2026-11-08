export const FREE_RECIPE_LIMIT = 12;

export const FREE_RECIPE_IDS = [
  'BR-E001',
  'BR-E004',
  'BR-E008',
  'BR-E011',
  'BR-C001',
  'BR-C002',
  'BR-C003',
  'BR-C005',
  'BR-C008',
  'BR-C012',
  'FF-C003',
  'FF-C004',
];

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_1UZBGrDbRc9nb2mVCxePCUMc',
  yearly: process.env.STRIPE_PRICE_YEARLY || 'price_1UZBGsDbRc9nb2mVCuBEFHFf',
};

export const TRIAL_DAYS = 7;

export const PLAY_PACKAGE = 'eu.tastemaster365.twa';
export const PLAY_PRODUCTS = { monthly: 'tastemaster_monthly', yearly: 'tastemaster_yearly' };

export const MASTER_SHEET_CSV_URL = process.env.MASTER_RECIPES_CSV_URL
  || 'https://docs.google.com/spreadsheets/d/1wxcQ28CslNUa_7-hrhkIKEuO6fF2HAkfSrKxRYmIRek/export?format=csv&gid=1571845576';

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
