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

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID
  || 'price_1TsOCpDbRc9nb2mVhLaqc9fk';

export const MASTER_SHEET_CSV_URL = process.env.MASTER_RECIPES_CSV_URL
  || 'https://docs.google.com/spreadsheets/d/1wxcQ28CslNUa_7-hrhkIKEuO6fF2HAkfSrKxRYmIRek/export?format=csv&gid=1571845576';

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
