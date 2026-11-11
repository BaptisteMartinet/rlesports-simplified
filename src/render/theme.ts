import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

export const colors = {
  night: '#0B1026',
  nightLight: '#16204A',
  blue: '#2F7BFF',
  orange: '#FF7A1A',
  gold: '#FFC83D',
  text: '#FFFFFF',
  muted: '#A9B4D0',
} as const;

export const STORY = { width: 1080, height: 1920 } as const;
export const FEED = { width: 1080, height: 1350 } as const;

export const HANDLE = '@rlesports_simplified';

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) => readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`));

/** Fonts given to satori. Latin + Latin Extended covers team names with accents. */
export const fonts = [
  ...(['latin', 'latin-ext'] as const).flatMap((subset) => [
    { name: 'Barlow Condensed', weight: 600 as const, data: font('barlow-condensed', `barlow-condensed-${subset}-600-normal.woff`) },
    { name: 'Barlow Condensed', weight: 800 as const, data: font('barlow-condensed', `barlow-condensed-${subset}-800-normal.woff`) },
    { name: 'Inter', weight: 400 as const, data: font('inter', `inter-${subset}-400-normal.woff`) },
    { name: 'Inter', weight: 600 as const, data: font('inter', `inter-${subset}-600-normal.woff`) },
  ]),
].map((f) => ({ ...f, style: 'normal' as const }));
