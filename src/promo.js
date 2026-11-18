// Black Friday 2026: the first paid month of the monthly plan costs 1,99 € instead of 4,99 €.
// 27 to 30 November, Sofia time (UTC+2). The Stripe coupon CHERENPETAK2026 (3 € off once)
// can be redeemed until 1.12.2026 00:00 Sofia time, the same moment the offer ends here.
export const PROMO = {
  coupon: 'CHERENPETAK2026',
  plan: 'monthly',
  start: Date.UTC(2026, 10, 26, 22, 0),
  end: Date.UTC(2026, 10, 30, 22, 0),
  price: '€1.99',
  regularPrice: '€4.99',
};

export const promoActive = (now = Date.now()) => now >= PROMO.start && now < PROMO.end;

const COPY = {
  bg: {
    badge: 'Черен петък',
    headline: 'Първият месец за 1,99 € вместо 4,99 €',
    card: 'първия месец, после 4,99 € / месец',
    trialNote: '7 дни безплатно, без карта. После първият месец е 1,99 € вместо 4,99 €, а след това 4,99 € на месец. Ако не добавиш карта, пробата просто спира.',
  },
  en: {
    badge: 'Black Friday',
    headline: 'First month for €1.99 instead of €4.99',
    card: 'first month, then €4.99 / month',
    trialNote: '7 days free, no card. Then your first month is €1.99 instead of €4.99, and €4.99 a month after that. If you add no card, the trial simply ends.',
  },
};

export const promoCopy = (language) => COPY[language] || COPY.en;
