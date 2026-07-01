const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260628-20260704';
  const res = await fetch(url);
  const json = await res.json();
  const events = json.events || [];
  
  for (const ev of events) {
    const comp = ev.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors?.find(c => c.homeAway === 'home');
    const away = comp.competitors?.find(c => c.homeAway === 'away');
    console.log(`\nMatch: ${ev.name} (${ev.date})`);
    console.log(`  Home abbreviation: ${home?.team?.abbreviation}, displayName: ${home?.team?.displayName}, name: ${home?.team?.name}`);
    console.log(`  Away abbreviation: ${away?.team?.abbreviation}, displayName: ${away?.team?.displayName}, name: ${away?.team?.name}`);
  }
}

main().catch(console.error);
