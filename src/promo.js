// Black Friday 2026: the first year of the yearly plan costs 19,99 € instead of 29,99 €.
// 27 to 30 November, Sofia time (UTC+2). The Stripe coupon TM_BF2026_YEAR (10 € off,
// TasteMaster365 Premium only) can be redeemed until 30.11.2026 23:59:59 Sofia time.
// The server adds it only to the yearly price and only on these dates, never as a code.
// It lasts one month (not "once"): a new account first gets 7 free days, and the
// discount has to reach the first paid invoice after them.
export const PROMO = {
  coupon: 'TM_BF2026_YEAR',
  plan: 'yearly',
  start: Date.UTC(2026, 10, 26, 22, 0),
  end: Date.UTC(2026, 10, 30, 22, 0),
  price: '€19.99',
  regularPrice: '€29.99',
};

// PROMO_PREVIEW shows the offer outside its dates, for a preview deployment only.
const preview = () => (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PROMO_PREVIEW === '1')
  || globalThis.process?.env?.PROMO_PREVIEW === '1';

export const promoActive = (now = Date.now()) => preview() || (now >= PROMO.start && now < PROMO.end);

const COPY = {
  bg: {
    badge: 'Черен петък',
    headline: 'Една година за 19,99 € вместо 29,99 €',
    banner: 'Черен петък: TasteMaster365 за цяла година за 19,99 € вместо 29,99 €. Само до 30 ноември.',
    bannerButton: 'Вземи годината',
    pitch: 'Постите, Коледа и Нова година с пълен достъп до всички рецепти. Една година за 19,99 €, по-малко от 1,70 € на месец.',
    card: 'първата година, после 29,99 € / година',
    trialNote: '7 дни безплатно, без карта. После първата година е 19,99 € вместо 29,99 €, а след това 29,99 € на година. Ако не добавиш карта, пробата просто спира.',
  },
  en: {
    badge: 'Black Friday',
    headline: 'One year for €19.99 instead of €29.99',
    banner: 'Black Friday: a whole year of TasteMaster365 for €19.99 instead of €29.99. Until 30 November only.',
    bannerButton: 'Get the year',
    pitch: 'Full access to every recipe through the holidays. One year for €19.99, less than €1.70 a month.',
    card: 'first year, then €29.99 / year',
    trialNote: '7 days free, no card. Then your first year is €19.99 instead of €29.99, and €29.99 a year after that. If you add no card, the trial simply ends.',
  },
};

export const promoCopy = (language) => COPY[language] || COPY.en;
