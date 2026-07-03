const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260703';
  const res = await fetch(url);
  const json = await res.json();
  const events = json.events || [];
  
  const ev = events.find(e => e.id === '760499');
  if (ev) {
    const comp = ev.competitions?.[0];
    if (comp) {
      console.log('Competitors for Australia vs Egypt:', JSON.stringify(comp.competitors, null, 2));
    }
  } else {
    console.log('Event 760499 not found');
  }
}

main().catch(console.error);
