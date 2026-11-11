# Rocket League Esports Simplified – Plan

## Account

- **Name:** Rocket League Esports Simplified
- **Handle:** @rlesports_simplified
- **Audience:** new Rocket League esports fans. Everything is short, simple and explained.
- **Language:** English
- **Bio (draft):** "RLCS made simple 🚀 Upcoming events, big matches & finals, explained for new fans. Unofficial fan account · Data: Liquipedia"
  - "Unofficial fan account" keeps it from being confused with the official @rlesports.
  - "Data: Liquipedia" covers the CC-BY-SA attribution requirement.
- **Branding:** use only our own graphics. No RLCS, Psyonix or Epic logos. No team logos until Liquipedia confirms they can be reused.

## What the bot posts

| Trigger | Format | When |
|---|---|---|
| Monthly roundup: RLCS events in the next month | Feed post (carousel) + story | 1st of each month |
| Event announcement (Major, World Championship, Kick-Off LAN) | Feed post + story | 2 months, 1 month and 7 days before the event starts |
| Event reminder | Story | 3 days before the event starts |
| Event starts today | Story | Day 1, about 2 hours before the first match |
| Grand final announcement | Story | As soon as both finalists are known, then again shortly before it starts |
| Big match: both teams in the **RLCS points top 10**, at LAN events, and in regional Opens **from the playoffs onward** only | Story | Shortly before the match (within the next posting window) |
| Winner: Majors, World Championship and the RLCS 2027 Club Championship Finale (the season's final event) | Feed post + story | As soon as Liquipedia shows the grand final result (next run after it ends) |

- **Stories first.** Feed posts are for upcoming events only, since those are how new followers find the account.
- **Announcement milestones** (2 months, 1 month, 7 days, 3 days, start day):
  - Milestones other than the start day are posted at a fixed time, 14:00 UTC, which is afternoon in Europe and morning in the Americas.
  - If an event first appears on Liquipedia after a milestone has passed, that milestone is skipped, not posted late. Only upcoming milestones are posted.
  - If the start date changes, the remaining milestones follow the new date. Already-posted milestones are not repeated.
- **Times:** always absolute, in GMT, Paris, New York and LA, for example "4pm GMT · 5pm Paris · 11am New York · 8am LA". A story stays up for 24 hours, so relative wording ("in 30 minutes") would go stale. Use "starting soon" only for stories posted within about an hour of the start.
- Liquipedia times are often estimates and matches slip. For anything after the first match of a day, use "~4pm". When a zone is on a different day than GMT, its weekday is added ("6pm Mon LA").
- **Top 10 source:** RLCS points standings for the current season. At the start of a season, points are reset, so the bot uses **last season's final standings until the new season has awarded points**.
  - RLCS points are regional, with no official world ranking. The bot ranks all regions together by points, which approximates a world top 10.
  - For RLCS 2027, the season file holds the RLCS 2026 points. The new Club Championship format may not use RLCS points at all; once 2027 standings exist, they replace the 2026 ones in the season file.
- **No filler content.** The account only posts about big events and big matches. No off-season posts for now.

## Branding (proposal)

- **Idea:** every Rocket League match is **blue vs orange**. We use those two colours as the visual language: beginners recognise them from the game, and they aren't the official RLCS branding.
- **Palette:**

  | Role | Colour |
  |---|---|
  | Background (night) | `#0B1026` |
  | Blue side | `#2F7BFF` |
  | Orange side | `#FF7A1A` |
  | Gold (grand finals and champions only) | `#FFC83D` |
  | Text | `#FFFFFF` |
  | Muted text | `#A9B4D0` |

- **Fonts** (both free, OFL licence, from the `@fontsource` npm packages):
  - **Barlow Condensed** ExtraBold for headlines and team names. It's condensed, so long team names fit.
  - **Inter** for times and small text.
- **Profile picture:** an "RL" monogram on a circle split diagonally blue and orange, with "SIMPLIFIED" underneath. It's rendered with the same pipeline as the stories.
- **Story layout (1080×1920), same frame for every story:**
  1. **Top:** a label saying what this is (BIG MATCH · GRAND FINAL · STARTS TODAY · CHAMPIONS · COMING SOON), and the event name.
  2. **Middle:** the content.
     - Match stories: team A on a blue half, team B on an orange half, "VS" between them.
     - Winner stories: the champion's name on gold.
  3. **"Why it matters" line**, the beginner touch, for example "#2 vs #5 in the RLCS rankings" or "Winner lifts the trophy".
  4. **Bottom:** times in GMT · Paris · New York · LA.
  5. **Footer:** "@rlesports_simplified · Data: Liquipedia".
- Feed posts (1080×1350) use the same colours, fonts and frame.
- Final colours and layout are checked on real renders in dry-run mode before launch.

## Captions and hashtags

- **Stories have no caption through the API**, and no stickers or hashtags either. All the information must be inside the image.
- Captions only apply to feed posts: announcements, monthly roundup and winners.
- **Structure of a caption:**
  1. **Hook on the first line.** Only about the first 125 characters show before "more".
  2. **2 to 4 short lines with one emoji each:** dates, place, what's at stake.
  3. **One "New to RLCS?" line** explaining why it matters, in plain words.
  4. **Where to watch:** the official Rocket League Twitch and YouTube channels.
  5. **Credit:** "Data: Liquipedia (CC-BY-SA)", only when Liquipedia data is used. Each data source declares its own credit; hand-written data has none.
  6. **Hashtags last, 5 at most.** Instagram announced a 5-hashtag cap in December 2025, and fewer, relevant tags work better anyway.
- **Hashtags:**
  - 3 fixed: `#RLCS #RocketLeague #Esports`
  - up to 2 that depend on the post: the event (for example `#RLCSParisMajor`, built from the Liquipedia name) or, for a winner post, the winning team.

**Example: event announcement (1 month before)**

```
🚀 One month until the RLCS {Major name}!

📅 {start date} – {end date}
📍 {city}, {country}
🏆 {team count} of the best teams in the world, {prize pool} on the line

New to RLCS? Majors are the biggest tournaments of the season, the ones every pro wants to win.

📺 Watch live on twitch.tv/rocketleague and YouTube
Data: Liquipedia (CC-BY-SA)

#RLCS #RocketLeague #Esports #{EventTag}
```

**Example: winner**

```
🏆 {Team} are your {Event} champions!

They beat {Runner-up} {score} in the grand final.
{Line from the data, for example "Their first Major title." or "Back-to-back Majors!" when Liquipedia shows it.}

New to RLCS? Winning a Major also gives a big boost in RLCS points, the road to the World Championship.

Data: Liquipedia (CC-BY-SA)

#RLCS #RocketLeague #Esports #{EventTag} #{TeamTag}
```

**Example: monthly roundup (carousel)**

```
📅 Your RLCS calendar for {Month}

{n} big events this month. Swipe to see them all 👉

{Event 1}: {dates}
{Event 2}: {dates}

Follow so you don't miss the big matches. We post a reminder before every one.

Data: Liquipedia (CC-BY-SA)

#RLCS #RocketLeague #Esports
```

## Data sources (swappable)

- The bot works from its own data model (`src/data/types.ts`): events, matches, standings.
- Each source translates its data into that model. `src/data/index.ts` picks which source provides each kind of data.
- **Now:** a hand-written season file (`data/seasons/rlcs-2027.yml`) provides events and standings. With no match source, the announcement posts work, but big-match, grand-final and winner posts stay silent.
- **Later:** an API (Liquipedia if access is granted, otherwise start.gg or another) is added as the match source, and possibly for events and standings too.
- `npm run data:check` validates the season file and prints the events and the world top 10.

### RLCS 2027 format (new)

RLCS 2027 is the "RLCS Club Championship":
1. **Club Kick-Off Opens:** 4 online regional qualifiers, Nov 12–22, 2026.
2. **Club Championship Kick-Off:** LAN at the Copper Box Arena, London, Dec 9–13, 2026. 20 invited clubs plus the 4 Open winners.
3. **Regional online league play:** dates and format not announced.
4. **Club Championship Finale:** 16-team LAN, date and place not announced.

Majors and a World Championship in 2027 are not officially confirmed (only a ticket resale listing mentions Feb, May and Sep 2027). There is no 2027 points leaderboard yet.

### Liquipedia (LPDB API)

- Access requested by email on 2026-11-11, waiting for an answer. The free non-commercial plan is enough (the project is not commercial).
- Data needed (table names to confirm once we have docs access):
  - tournaments: RLCS LAN events with their start and end dates;
  - matches: teams, scheduled time, round (to spot the grand final), and result (winner and series score, for the winner post);
  - RLCS points standings for the current and previous season (for the top 10).
- Terms to respect:
  - credit Liquipedia (CC-BY-SA);
  - cache results and don't repeat identical requests;
  - stay within the plan's rate limit;
  - use one IP address;
  - never scrape HTML pages;
  - keep the API key secret.
- Request budget:
  - tournaments and standings: refresh once a day;
  - matches: query only while an RLCS event is live or about to start.

## Language: Node.js

- TypeScript, run directly with `tsx` (no build step).
- Plain `fetch` for data APIs and the Instagram Graph API.
- Images: `satori` (HTML/JSX templates → SVG) → `sharp` (SVG → JPEG directly; sharp renders SVG with librsvg).
  - Story: 1080×1920. Feed post: 1080×1350 (4:5).

## Images: Cloudinary (free plan)

- Hosting only: we upload the finished JPEG as is, with no Cloudinary transformations or format conversion.
- Upload the JPEG → get a public URL → give it to Instagram → delete the image after publishing.
- Usage stays far below the 25 free credits per month.

## Publishing: Instagram API with Unified Login

- **Since late 2026, new Meta apps can only use "Unified login"**; the "Instagram login" setup is closed to new apps.
  - Host `graph.facebook.com/v27.0` (not `graph.instagram.com`).
  - Requires a **business portfolio** owning the app. No Facebook Page needed.
  - The token is a **system-user token** owned by the business portfolio. `/me` is that system user; the Instagram account comes from `/me/assigned_instagram_accounts`.
  - Permissions: `instagram_basic` and `instagram_content_publish`.
- Instagram Business account (stories can't be published from Creator accounts).
- Flow:
  1. create a media container (`media_type=STORIES` for stories; image, or `CAROUSEL` for feed posts);
  2. poll the container status until `FINISHED`;
  3. publish;
  4. delete the image from Cloudinary.
- **No scheduling through the API**, for posts or stories: the API only publishes immediately. Our GitHub Actions cron is the scheduler. Containers expire after 24 hours unpublished, so each one is created right before it's published, in the same run.
- Limits:
  - about 100 API posts per 24 hours (check `content_publishing_limit`), far above what we need;
  - no stickers or links in API stories.
- **Token:** a system-user token from the Unified login configuration, set to **never expire** (confirmed when generated on 2026-11-11). No refresh workflow and no GitHub token for secrets are needed. It stops working only if revoked, or if the Instagram account or app leaves the business portfolio; then a new one is generated by hand (`docs/SETUP.md`).

## Hosting: GitHub Actions

- **Public repo:** unlimited minutes. Secrets stay private.
- **Cron:** every 15 minutes. GitHub runs it late (5 to 30+ minutes) and sometimes skips a run, so each run publishes everything due in the next window that isn't already in the posted state.
- **State:** `state/posted.json` holds the IDs of everything already published, plus cached Liquipedia data.
  - The workflow commits it back to the repo after each run that changes something.
  - This prevents duplicate posts, and the commits keep the repo active, which stops GitHub from auto-disabling the schedule after 60 days.
- `concurrency` group so two runs never overlap.
- **Keep-alive:** `keep-alive.yml` (1st and 16th) adds an empty commit when the repo has had none for 30 days, so long gaps between events never let GitHub disable the schedule.
- Secrets:
  - `LIQUIPEDIA_API_KEY` (later)
  - `IG_ACCESS_TOKEN`
  - `CLOUDINARY_URL`
  - `IG_USER_ID` (recommended): the Instagram account ID. The bot then skips looking the account up from the token, which Meta sometimes answers with an empty list.
  - `IG_USERNAME` (optional): only if the token sees several accounts and `IG_USER_ID` isn't set.

## Fully automatic: safeguards

- `DRY_RUN=1` mode: generates the images and captions into `out/` without posting. Used for local testing and for a manual workflow run.
- Validate before posting:
  - team names are present;
  - the match time is in the future;
  - the event is an RLCS LAN, or an RLCS Open in its playoff stage;
  - for a winner post, the grand final is marked finished and its score shows a team winning the series, not just a live in-progress score.
- Cap posts per run (for example 5), so a data glitch can't flood the account.
- Any error fails the workflow, and GitHub emails the failure.

## Repo layout

TypeScript, run with `tsx`. `npm run typecheck` runs the type check, `npm test` the tests.

```
src/
  data/                 # done
    types.ts            # the bot's data model
    source.ts           # DataSource interface + combineSources()
    standings.ts        # world top 10 from regional points
    index.ts            # which source provides what
    sources/
      seasonFile.ts     # hand-written YAML season file (validated with zod)
  scripts/
    check-data.ts   # npm run data:check
    preview.ts      # npm run preview: every post type with sample data → out/preview/
  index.ts          # done: npm start (publish) / npm run dry-run → out/run/
  rules.ts          # done: which posts are due (roundup, announcement, final, big match, winner)
  render/           # done: satori templates (story, feed) → JPEG
  captions.ts       # done: feed post captions + hashtags
  time.ts           # done: multi-timezone formatting
  state.ts          # done: state/posted.json
  publish/          # done: Cloudinary upload/delete, Instagram containers + publish
  scripts/check-accounts.ts  # npm run check:accounts [-- --publish-welcome-story | --publish-welcome-post]
data/seasons/rlcs-2027.yml
state/posted.json
.github/workflows/
  post.yml          # done: every 15 min; manual run = dry run with downloadable images
  keep-alive.yml    # done: empty commit when the repo has been quiet for 30 days
docs/SETUP.md       # account setup guide
```

## Setup steps

1. Request Liquipedia API access (describe it as a non-commercial fan project that credits Liquipedia).
2. Create @rlesports_simplified as a Business account, a business portfolio, and a Meta app with Unified Login. Generate a system-user token (see `docs/SETUP.md`).
3. Create a free Cloudinary account.
4. Create the public GitHub repo and add the secrets.
5. Build in dry-run mode, check the visuals, then turn on publishing.

## Out of scope for now

- Off-season content (explainers, team profiles). The account stays focused on big events and big matches.
