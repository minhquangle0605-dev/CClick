import manifest from './catalog-artwork.json';

// Eager URL mapping does not fetch every image; <img loading="lazy"> loads on demand.
const files = import.meta.glob<string>('./images/catalog/**/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
});
export const catalogArtwork: Readonly<Record<string, string>> = Object.fromEntries(
  manifest.map((entry) => {
    const source = files[`./images/catalog/${entry.file.slice('images/'.length)}`];
    if (!source) throw new Error(`Missing catalog artwork: ${entry.id}`);
    return [entry.id, source];
  }),
);
export const catalogArtworkManifest = manifest;
