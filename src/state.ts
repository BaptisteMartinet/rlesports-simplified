import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/** What the bot remembers between runs. Committed back to the repo by the workflow. */
export interface BotState {
  /** Post key → when it was published (ISO). */
  posted: Record<string, string>;
}

export const STATE_FILE = 'state/posted.json';

export async function loadState(path = STATE_FILE): Promise<BotState> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as BotState;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { posted: {} };
    throw err;
  }
}

export async function saveState(state: BotState, path = STATE_FILE): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  // Sorted keys keep git diffs readable.
  const posted = Object.fromEntries(Object.entries(state.posted).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(path, `${JSON.stringify({ posted }, null, 2)}\n`);
}
