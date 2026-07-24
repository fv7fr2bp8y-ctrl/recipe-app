export default function Footer({ messages }) {
  return (
    <footer className="mx-auto mt-12 max-w-6xl border-t border-orange-200 px-4 py-10 text-center text-stone-600">
      <div className="mx-auto mb-5 flex max-w-48 items-center gap-3 text-orange-500" aria-hidden="true">
        <span className="h-px flex-1 bg-orange-200" />
        <span className="text-sm">◆</span>
        <span className="h-px flex-1 bg-orange-200" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-700">{messages.contact}</p>
      <a href="mailto:support@tastemaster.eu" className="mt-2 inline-block font-serif text-lg text-stone-800 hover:text-orange-700">
        support@tastemaster.eu
      </a>
      <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
        <a href="/privacy.html" className="hover:text-orange-700">{messages.privacy}</a>
        <a href="/account-deletion.html" className="hover:text-orange-700">{messages.deleteAccount}</a>
      </div>
      <p className="mt-5 text-[10px] uppercase tracking-[0.18em] text-stone-500">{messages.rights}</p>
      <p className="mx-auto mt-3 max-w-lg font-serif text-sm italic leading-6 text-stone-500">{messages.note}</p>
    </footer>
  );
}
