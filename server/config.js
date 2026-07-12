export const FREE_RECIPE_LIMIT = 12;

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID
  || 'price_1TsOCpDbRc9nb2mVhLaqc9fk';

export const MASTER_SHEET_CSV_URL = process.env.MASTER_RECIPES_CSV_URL
  || 'https://docs.google.com/spreadsheets/d/1wxcQ28CslNUa_7-hrhkIKEuO6fF2HAkfSrKxRYmIRek/export?format=csv&gid=1571845576';

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
