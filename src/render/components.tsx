import type { CSSProperties, ReactNode } from 'react';
import { colors, HANDLE } from './theme.ts';

/** Satori only supports flexbox: every box is a flex container. */
export function Box({ style, children }: { style?: CSSProperties; children?: ReactNode }) {
  return <div style={{ display: 'flex', ...style }}>{children}</div>;
}

/**
 * Font size so `text` fits on one line in `maxWidth` pixels.
 * `ratio` is the average character width relative to the font size (≈0.5 for Barlow Condensed ExtraBold).
 */
export function fitSize(text: string, maxWidth: number, max: number, ratio = 0.5): number {
  return Math.min(max, Math.floor(maxWidth / (Math.max(text.length, 1) * ratio)));
}

export const headline = (size: number, color: string = colors.text): CSSProperties => ({
  fontFamily: 'Barlow Condensed',
  fontWeight: 800,
  fontSize: size,
  lineHeight: 1,
  color,
  textTransform: 'uppercase',
});

export const body = (size: number, color: string = colors.text, weight: 400 | 600 = 600): CSSProperties => ({
  fontFamily: 'Inter',
  fontWeight: weight,
  fontSize: size,
  color,
});

interface FrameProps {
  width: number;
  height: number;
  /** Short label at the top: BIG MATCH, GRAND FINAL, IN 7 DAYS... */
  label: string;
  labelColor?: string;
  title: string;
  subtitle?: string;
  /** The beginner explanation line. */
  why?: string;
  /** Times in every display zone, already formatted. */
  times?: { heading: string; values: string[] };
  credits: string[];
  children: ReactNode;
}

/** Shared layout of every image: label, event, content, "why it matters", times, footer. */
export function Frame({ width, height, label, labelColor = colors.blue, title, subtitle, why, times, credits, children }: FrameProps) {
  const pad = 80;
  const inner = width - 2 * pad;
  const compact = height < 1600;
  // Width/height exclude padding (CSS content-box), so the padding is a margin
  // on an inner box with an explicit size instead.
  return (
    <Box
      style={{
        width,
        height,
        backgroundColor: colors.night,
        backgroundImage: `radial-gradient(circle at 0% 0%, rgba(47,123,255,0.35), rgba(11,16,38,0) 55%), radial-gradient(circle at 100% 100%, rgba(255,122,26,0.30), rgba(11,16,38,0) 55%)`,
      }}
    >
    <Box style={{ width: inner, height: height - 2 * pad, margin: pad, flexDirection: 'column' }}>
      <Box style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <Box
          style={{
            ...headline(compact ? 38 : 46, colors.night),
            backgroundColor: labelColor,
            padding: '10px 28px',
            borderRadius: 999,
            letterSpacing: 3,
          }}
        >
          {label}
        </Box>
        <Box style={{ ...headline(fitSize(title, inner, compact ? 72 : 84, 0.48)), marginTop: 36 }}>{title}</Box>
        {subtitle ? <Box style={{ ...body(compact ? 32 : 38, colors.muted), marginTop: 16 }}>{subtitle}</Box> : null}
      </Box>

      <Box style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch' }}>{children}</Box>

      {why ? (
        <Box
          style={{
            ...body(compact ? 32 : 40),
            justifyContent: 'center',
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 24,
            padding: compact ? '24px 32px' : '32px 40px',
            marginBottom: times ? 40 : 0,
          }}
        >
          {why}
        </Box>
      ) : null}

      {times ? (
        <Box style={{ flexDirection: 'column', alignItems: 'center' }}>
          <Box style={{ ...body(compact ? 28 : 32, colors.muted), textTransform: 'uppercase', letterSpacing: 2 }}>
            {times.heading}
          </Box>
          {/* Two per row: "GMT · Paris" then "New York · LA". */}
          {[times.values.slice(0, 2), times.values.slice(2)].filter((row) => row.length > 0).map((row) => (
            <Box key={row.join()} style={{ justifyContent: 'center', marginTop: 12 }}>
              {row.map((t, i) => (
                <Box key={t} style={body(compact ? 34 : 42)}>
                  {i > 0 ? <Box style={{ color: colors.muted, margin: '0 18px' }}>·</Box> : null}
                  {t}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      ) : null}

      <Box style={{ ...body(compact ? 24 : 28, colors.muted, 400), justifyContent: 'center', marginTop: 40 }}>
        {[HANDLE, ...credits.map((c) => `Data: ${c}`)].join('  ·  ')}
      </Box>
    </Box>
    </Box>
  );
}

/** A team on its colour side, with its world rank when known. */
export function TeamCard({ name, color, rank, width, height }: { name: string; color: string; rank?: number; width: number; height: number }) {
  return (
    <Box
      style={{
        width,
        height,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: color,
        borderRadius: 32,
      }}
    >
      <Box style={headline(fitSize(name, width - 80, 150))}>{name}</Box>
      {rank !== undefined ? (
        <Box style={{ ...body(height > 300 ? 38 : 30, 'rgba(255,255,255,0.85)'), marginTop: 16 }}>#{rank} in the world</Box>
      ) : null}
    </Box>
  );
}

/** Team A (blue) vs team B (orange), stacked. */
export function Versus({ teams, ranks, width, cardHeight }: { teams: [string, string]; ranks?: [number, number]; width: number; cardHeight: number }) {
  const gap = 24;
  const badge = 150;
  // The VS badge is drawn last, positioned over the gap, so it sits on top of both cards.
  return (
    <Box style={{ position: 'relative', flexDirection: 'column', alignItems: 'center', width, height: 2 * cardHeight + gap }}>
      <TeamCard name={teams[0]} color={colors.blue} rank={ranks?.[0]} width={width} height={cardHeight} />
      <Box style={{ height: gap }} />
      <TeamCard name={teams[1]} color={colors.orange} rank={ranks?.[1]} width={width} height={cardHeight} />
      <Box
        style={{
          ...headline(64, colors.night),
          position: 'absolute',
          top: cardHeight + gap / 2 - badge / 2,
          left: width / 2 - badge / 2,
          width: badge,
          height: badge,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.text,
          borderRadius: 999,
          border: `10px solid ${colors.night}`,
        }}
      >
        VS
      </Box>
    </Box>
  );
}
