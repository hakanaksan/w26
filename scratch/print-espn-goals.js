const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260701-20260706';
  const res = await fetch(url);
  const json = await res.json();
  const events = json.events || [];
  
  console.log(`Found ${events.length} events:`);
  for (const ev of events) {
    const comp = ev.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors?.find(c => c.homeAway === 'home');
    const away = comp.competitors?.find(c => c.homeAway === 'away');
    console.log(`\nMatch: ${ev.name} (${ev.date}) status: ${comp.status?.type?.name}`);
    console.log(`Home: ${home?.team?.displayName} (${home?.score}), Away: ${away?.team?.displayName} (${away?.score})`);
    
    if (comp.details) {
      console.log('Details:');
      for (const d of comp.details) {
        const athlete = d.athletesInvolved?.[0];
        console.log(`  - Team: ${d.team?.displayName}, Player: ${athlete?.displayName || 'Unknown'}, Clock: ${d.clock?.displayValue}, Type: ${d.type?.text || d.type?.description}, ScoringPlay: ${d.scoringPlay}`);
      }
    }
  }
}

main().catch(console.error);
