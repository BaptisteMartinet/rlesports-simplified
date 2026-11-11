import type { ReactElement } from 'react';
import type { RlEvent } from '../data/types.ts';
import type { DuePost, Milestone, PostContent, PostFormat } from '../rules.ts';
import { formatDateRange, formatMonth, formatTimes } from '../time.ts';
import { Box, body, fitSize, Frame, headline, Versus } from './components.tsx';
import { colors, FEED, STORY } from './theme.ts';

const PAD = 80;

export function eventSubtitle(e: RlEvent): string {
  const dates = e.startDate && e.endDate ? formatDateRange(e.startDate, e.endDate) : 'Dates TBA';
  const where = e.online ? `Online${e.region ? ` · ${e.region}` : ''}` : (e.location?.city ?? 'Location TBA');
  return `${dates} · ${where}`;
}

/** One plain sentence telling a new fan why this event matters. */
export function whyEvent(e: RlEvent): string {
  switch (e.kind) {
    case 'kickoff':
      return `The first big LAN of the season${e.teamCount ? `: ${e.teamCount} teams` : ''}${e.location ? ` in ${e.location.city}` : ''}`;
    case 'major':
      return 'A Major: one of the biggest tournaments of the season';
    case 'worlds':
      return 'The World Championship: the biggest title in Rocket League';
    case 'finale':
      return 'The season finale: the best clubs fight for the title';
    case 'open':
      return 'An online regional tournament';
  }
}

const COUNTDOWN: Record<Milestone, { label: string; big: string; small: string }> = {
  '2-months': { label: 'COMING SOON', big: '2', small: 'MONTHS TO GO' },
  '1-month': { label: 'COMING SOON', big: '1', small: 'MONTH TO GO' },
  '7-days': { label: 'NEXT WEEK', big: '7', small: 'DAYS TO GO' },
  '3-days': { label: 'THIS WEEK', big: '3', small: 'DAYS TO GO' },
  'start-day': { label: 'STARTS TODAY', big: 'TODAY', small: "LET'S GO" },
};

function Facts({ event, compact }: { event: RlEvent; compact: boolean }) {
  const facts = [
    event.teamCount ? `${event.teamCount} teams` : undefined,
    event.online ? 'Online' : event.location?.city,
    event.prizePoolUsd ? `$${event.prizePoolUsd.toLocaleString('en-US')}` : undefined,
  ].filter((f): f is string => Boolean(f));
  return (
    <Box style={{ justifyContent: 'center', marginTop: compact ? 32 : 56 }}>
      {facts.map((f) => (
        <Box
          key={f}
          style={{
            ...body(compact ? 30 : 36),
            margin: '0 12px',
            padding: compact ? '14px 26px' : '18px 32px',
            borderRadius: 999,
            border: `3px solid rgba(255,255,255,0.25)`,
          }}
        >
          {f}
        </Box>
      ))}
    </Box>
  );
}

function size(format: PostFormat) {
  return format === 'story' ? STORY : FEED;
}

function announcement(c: Extract<PostContent, { type: 'announcement' }>, format: PostFormat, credits: string[]) {
  const { width, height } = size(format);
  const compact = format === 'feed';
  const cd = COUNTDOWN[c.milestone];
  return (
    <Frame
      width={width}
      height={height}
      label={cd.label}
      labelColor={c.milestone === 'start-day' ? colors.orange : colors.blue}
      title={c.event.name}
      subtitle={eventSubtitle(c.event)}
      why={whyEvent(c.event)}
      times={c.firstMatchAt ? { heading: 'First match', values: formatTimes(c.firstMatchAt) } : undefined}
      credits={credits}
    >
      <Box style={{ flexDirection: 'column', alignItems: 'center' }}>
        <Box style={headline(fitSize(cd.big, width - 2 * PAD, compact ? 300 : 420, 0.55), colors.orange)}>{cd.big}</Box>
        <Box style={{ ...headline(compact ? 56 : 72), letterSpacing: 4, marginTop: 8 }}>{cd.small}</Box>
        <Facts event={c.event} compact={compact} />
      </Box>
    </Frame>
  );
}

function bigMatch(c: Extract<PostContent, { type: 'big-match' }>, credits: string[]) {
  const at = new Date(c.match.scheduledAt!);
  return (
    <Frame
      {...STORY}
      label="BIG MATCH"
      title={c.event.name}
      subtitle={eventSubtitle(c.event)}
      why={`#${c.ranks[0]} vs #${c.ranks[1]} in the RLCS rankings`}
      times={{ heading: 'Match time', values: formatTimes(at, { approx: c.approx }) }}
      credits={credits}
    >
      <Versus teams={c.teams} ranks={c.ranks} width={STORY.width - 2 * PAD} cardHeight={380} />
    </Frame>
  );
}

function grandFinal(c: Extract<PostContent, { type: 'grand-final' }>, credits: string[]) {
  const at = c.match.scheduledAt ? new Date(c.match.scheduledAt) : undefined;
  return (
    <Frame
      {...STORY}
      label={c.phase === 'soon' ? 'GRAND FINAL · SOON' : 'GRAND FINAL'}
      labelColor={colors.gold}
      title={c.event.name}
      subtitle={eventSubtitle(c.event)}
      why={c.phase === 'soon' ? 'Starting soon. The winner lifts the trophy!' : 'The final is set! The winner lifts the trophy.'}
      times={at ? { heading: 'Start time', values: formatTimes(at, { approx: c.approx }) } : undefined}
      credits={credits}
    >
      <Versus teams={c.teams} width={STORY.width - 2 * PAD} cardHeight={380} />
    </Frame>
  );
}

const WINNER_WHY: Partial<Record<RlEvent['kind'], string>> = {
  major: 'A Major title: one of the biggest wins of the season',
  worlds: 'World champions: the biggest title in Rocket League',
  finale: 'Season champions: the biggest title of the year',
};

function winner(c: Extract<PostContent, { type: 'winner' }>, format: PostFormat, credits: string[]) {
  const { width, height } = size(format);
  const compact = format === 'feed';
  const inner = width - 2 * PAD;
  return (
    <Frame
      width={width}
      height={height}
      label="CHAMPIONS"
      labelColor={colors.gold}
      title={c.event.name}
      subtitle={eventSubtitle(c.event)}
      why={WINNER_WHY[c.event.kind]}
      credits={credits}
    >
      <Box style={{ flexDirection: 'column', alignItems: 'center' }}>
        <Box
          style={{
            width: inner,
            height: compact ? 300 : 460,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.gold,
            borderRadius: 32,
          }}
        >
          <Box style={headline(fitSize(c.winner, inner - 80, compact ? 150 : 190), colors.night)}>{c.winner}</Box>
        </Box>
        <Box style={{ ...body(compact ? 34 : 42), marginTop: compact ? 32 : 48, textAlign: 'center' }}>
          {`Beat ${c.runnerUp} ${c.score[0]}–${c.score[1]} in the grand final`}
        </Box>
      </Box>
    </Frame>
  );
}

function roundupCover(c: Extract<PostContent, { type: 'roundup' }>, format: PostFormat, credits: string[]) {
  const { width, height } = size(format);
  const compact = format === 'feed';
  return (
    <Frame
      width={width}
      height={height}
      label="RLCS CALENDAR"
      title={formatMonth(c.month)}
      subtitle={`${c.events.length} big event${c.events.length > 1 ? 's' : ''} this month`}
      why={format === 'feed' ? 'Swipe for the details' : 'Follow so you never miss a big match'}
      credits={credits}
    >
      <Box style={{ flexDirection: 'column' }}>
        {c.events.map((e) => (
          <Box
            key={e.id}
            style={{
              flexDirection: 'column',
              padding: compact ? '24px 32px' : '32px 40px',
              marginBottom: 24,
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderLeft: `12px solid ${e.kind === 'worlds' || e.kind === 'finale' ? colors.gold : colors.orange}`,
            }}
          >
            <Box style={body(compact ? 30 : 36, colors.muted)}>{eventSubtitle(e)}</Box>
            <Box style={{ ...headline(fitSize(e.name, width - 2 * PAD - 100, compact ? 56 : 68, 0.48)), marginTop: 10 }}>
              {e.name}
            </Box>
          </Box>
        ))}
      </Box>
    </Frame>
  );
}

function roundupEventSlide(e: RlEvent, credits: string[]) {
  return (
    <Frame {...FEED} label="THIS MONTH" title={e.name} subtitle={eventSubtitle(e)} why={whyEvent(e)} credits={credits}>
      <Box style={{ flexDirection: 'column', alignItems: 'center' }}>
        <Box style={headline(160, colors.orange)}>{e.startDate ? formatDateRange(e.startDate, e.endDate!) : 'TBA'}</Box>
        <Facts event={e} compact />
      </Box>
    </Frame>
  );
}

/** The image(s) for a post: one for stories and single feed posts, several for a carousel. */
export function postImages(post: DuePost, credits: string[]): ReactElement[] {
  const c = post.content;
  switch (c.type) {
    case 'announcement':
      return [announcement(c, post.format, credits)];
    case 'big-match':
      return [bigMatch(c, credits)];
    case 'grand-final':
      return [grandFinal(c, credits)];
    case 'winner':
      return [winner(c, post.format, credits)];
    case 'roundup':
      return post.format === 'feed'
        ? [roundupCover(c, 'feed', credits), ...c.events.slice(0, 9).map((e) => roundupEventSlide(e, credits))]
        : [roundupCover(c, 'story', credits)];
  }
}

/** Profile picture (square; Instagram shows it as a circle, so everything stays in the centre). */
export function profilePicture(): ReactElement {
  const side = 1080;
  return (
    <Box
      style={{
        width: side,
        height: side,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: `linear-gradient(135deg, ${colors.blue} 50%, ${colors.orange} 50%)`,
      }}
    >
      <Box style={{ ...headline(440), letterSpacing: -8, marginTop: -40 }}>RL</Box>
      <Box style={{ ...headline(96, colors.night), letterSpacing: 10, backgroundColor: colors.text, padding: '6px 28px', borderRadius: 16 }}>
        SIMPLIFIED
      </Box>
    </Box>
  );
}

/** One-off story introducing the account; also the first real publishing test. */
export function welcomeStory(): ReactElement {
  return (
    <Frame
      {...STORY}
      label="HELLO"
      title="Rocket League Esports Simplified"
      subtitle="RLCS made simple, for new fans"
      why="Follow for the big events, big matches and finals"
      credits={[]}
    >
      <Box style={{ flexDirection: 'column', alignItems: 'center' }}>
        {['Upcoming events', 'Big matches', 'Grand finals', 'Champions'].map((line, i) => (
          <Box key={line} style={{ ...headline(110, i % 2 === 0 ? colors.blue : colors.orange), marginBottom: 24 }}>
            {line}
          </Box>
        ))}
      </Box>
    </Frame>
  );
}

const WELCOME_ITEMS: [string, string, string][] = [
  ['Upcoming events', 'Reminders before every big LAN, from 2 months out to day one', colors.blue],
  ['Big matches', 'When two of the top 10 teams in the world meet', colors.orange],
  ['Grand finals', "Who's playing, and when, in your time zone", colors.blue],
  ['Champions', 'Who lifted the trophy', colors.gold],
];

/** Welcome carousel (feed, 3 slides): who we are, what we post, what RLCS is + the next big event. */
export function welcomeCarousel(nextEvent?: RlEvent): ReactElement[] {
  const inner = FEED.width - 2 * PAD;
  const cover = (
    <Frame
      {...FEED}
      label="WELCOME"
      title="Rocket League Esports Simplified"
      subtitle="Unofficial fan account"
      why="Swipe to see what we post"
      credits={[]}
    >
      <Box style={{ flexDirection: 'column', alignItems: 'center' }}>
        <Box style={headline(170, colors.blue)}>RLCS</Box>
        <Box style={headline(170, colors.orange)}>MADE SIMPLE</Box>
        <Box style={{ ...body(40, colors.muted), marginTop: 24 }}>for new Rocket League esports fans</Box>
      </Box>
    </Frame>
  );

  const whatWePost = (
    <Frame {...FEED} label="WHAT WE POST" title="Only the big moments" subtitle="No filler, no spam" credits={[]}>
      <Box style={{ flexDirection: 'column' }}>
        {WELCOME_ITEMS.map(([title, text, color]) => (
          <Box
            key={title}
            style={{
              flexDirection: 'column',
              padding: '22px 32px',
              marginBottom: 20,
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderLeft: `12px solid ${color}`,
            }}
          >
            <Box style={headline(60)}>{title}</Box>
            <Box style={{ ...body(30, colors.muted), marginTop: 8 }}>{text}</Box>
          </Box>
        ))}
      </Box>
    </Frame>
  );

  const whatIsRlcs = (
    <Frame {...FEED} label="WHAT IS RLCS?" title="The pro league of Rocket League" subtitle="Rocket League Championship Series" credits={[]}>
      <Box style={{ flexDirection: 'column', width: inner }}>
        {[
          'Teams of 3 play soccer with rocket-powered cars.',
          'Pro teams compete all season in online tournaments.',
          'The biggest moments are the LAN events: the best teams in the world, on stage, in front of a crowd.',
        ].map((line) => (
          <Box key={line} style={{ ...body(36), marginBottom: 26, lineHeight: 1.35 }}>
            {line}
          </Box>
        ))}
        {nextEvent ? (
          <Box
            style={{
              flexDirection: 'column',
              marginTop: 20,
              padding: '24px 32px',
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderLeft: `12px solid ${colors.orange}`,
            }}
          >
            <Box style={{ ...body(26, colors.muted), textTransform: 'uppercase', letterSpacing: 2 }}>First big event</Box>
            <Box style={{ ...headline(fitSize(nextEvent.name, inner - 100, 56, 0.48)), marginTop: 10 }}>{nextEvent.name}</Box>
            <Box style={{ ...body(32, colors.muted), marginTop: 8 }}>{eventSubtitle(nextEvent)}</Box>
          </Box>
        ) : null}
      </Box>
    </Frame>
  );

  return [cover, whatWePost, whatIsRlcs];
}
