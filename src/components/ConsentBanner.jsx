import { useState } from 'react';
import { adsEnabled, readConsent, setConsent } from '../ads';

const TEXT = {
  bg: {
    body: 'Ползваме бисквитки на Google Ads, за да разберем кои реклами водят до нас. Без тях сайтът работи по същия начин.',
    accept: 'Приемам',
    decline: 'Отказвам',
    more: 'Поверителност',
  },
  en: {
    body: 'We use Google Ads cookies to learn which ads bring visitors here. The site works the same without them.',
    accept: 'Accept',
    decline: 'Decline',
    more: 'Privacy',
  },
  de: {
    body: 'Wir verwenden Google-Ads-Cookies, um zu sehen, welche Anzeigen Besucher bringen. Die Seite funktioniert auch ohne sie.',
    accept: 'Akzeptieren',
    decline: 'Ablehnen',
    more: 'Datenschutz',
  },
  es: {
    body: 'Usamos cookies de Google Ads para saber qué anuncios traen visitas. El sitio funciona igual sin ellas.',
    accept: 'Aceptar',
    decline: 'Rechazar',
    more: 'Privacidad',
  },
  fr: {
    body: 'Nous utilisons des cookies Google Ads pour savoir quelles annonces amènent des visiteurs. Le site fonctionne de la même façon sans eux.',
    accept: 'Accepter',
    decline: 'Refuser',
    more: 'Confidentialité',
  },
  ru: {
    body: 'Мы используем cookie Google Ads, чтобы понять, какая реклама приводит посетителей. Сайт работает так же и без них.',
    accept: 'Принять',
    decline: 'Отклонить',
    more: 'Конфиденциальность',
  },
};

export default function ConsentBanner({ language }) {
  const [open, setOpen] = useState(() => adsEnabled() && !readConsent());
  if (!open) return null;
  const text = TEXT[language] || TEXT.bg;
  const choose = (value) => {
    setConsent(value);
    setOpen(false);
  };
  return (
    <div role="dialog" aria-live="polite" aria-label={text.more} className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm leading-5 text-stone-700">
          {text.body}{' '}
          <a href="/privacy.html" className="underline hover:text-orange-700">{text.more}</a>
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => choose('denied')} className="flex-1 bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 sm:flex-none">
            {text.decline}
          </button>
          <button type="button" onClick={() => choose('granted')} className="flex-1 bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 sm:flex-none">
            {text.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
