// Validates the season file and prints what the bot will work with.
// Usage: npm run data:check  (or SEASON_FILE=path npm run data:check)
import { createBotData } from '../data/index.ts';
import { topTeams } from '../data/standings.ts';

const data = createBotData();

const events = (await data.getEvents()).toSorted((a, b) =>
  (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999'),
);
console.log(`Events (${events.length}):`);
for (const e of events) {
  const dates = e.startDate ? `${e.startDate} → ${e.endDate}` : 'dates TBA              ';
  const where = e.online ? `online${e.region ? ` (${e.region})` : ''}` : (e.location?.city ?? 'location TBA');
  console.log(`  ${dates}  ${e.kind.padEnd(7)} ${e.status.padEnd(9)} ${e.name} · ${where}`);
}

const standings = await data.getStandings();
if (!standings) {
  console.log('\nNo standings: the big-match rule is off.');
} else {
  console.log(`\nWorld top 10 from "${standings.label}" (as of ${standings.asOf}):`);
  for (const t of topTeams(standings, 10)) {
    console.log(`  #${String(t.rank).padEnd(3)} ${t.team.padEnd(22)} ${t.region.padEnd(5)} ${t.points}`);
  }
}
