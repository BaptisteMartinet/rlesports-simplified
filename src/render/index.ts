import type { ReactElement } from 'react';
import satori from 'satori';
import sharp from 'sharp';
import type { DuePost } from '../rules.ts';
import { postImages } from './templates.tsx';
import { fonts } from './theme.ts';

/** Renders one template to a JPEG at the template's own size. */
export async function toJpeg(element: ReactElement): Promise<Buffer> {
  const { width, height } = element.props as { width: number; height: number };
  const svg = await satori(element, { width, height, fonts });
  return sharp(Buffer.from(svg)).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}

/** All JPEGs of a post (several for a carousel). */
export async function renderPost(post: DuePost, credits: string[]): Promise<Buffer[]> {
  return Promise.all(postImages(post, credits).map(toJpeg));
}
