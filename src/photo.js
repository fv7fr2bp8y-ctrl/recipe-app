// Recipe photos live in Google Drive. drive.google.com/thumbnail?…&sz=w1200 answers with a
// PNG of about 1.6 MB, which made the recipe list slow on phones. The same file from
// lh3.googleusercontent.com with "-rj" comes back as JPEG: about 77 KB at 600 px.
// Other addresses (uploads, local files) are returned unchanged.
const DRIVE_ID = /drive\.google\.com\/thumbnail\?(?:.*&)?id=([\w-]+)/;

export function photo(url, width = 1200) {
  if (!url) return url;
  const match = DRIVE_ID.exec(url);
  return match ? `https://lh3.googleusercontent.com/d/${match[1]}=w${width}-rj` : url;
}

// Widths per place: a list card is up to ~370 px wide on a phone, so 600 covers 2x screens.
export const PHOTO = { thumb: 300, card: 600, hero: 1200 };
