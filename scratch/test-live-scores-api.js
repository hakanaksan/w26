const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  // Query 2026-07-01
  const res1 = await fetch('http://localhost:3000/api/live-scores?date=2026-07-01');
  if (res1.ok) {
    const data1 = await res1.json();
    console.log('API Response for 2026-07-01:', JSON.stringify(data1, null, 2));
  } else {
    console.log('Failed to fetch 2026-07-01 API');
  }
}

main().catch(console.error);
