import fs from 'fs';
import path from 'path';

// Read .env.local and populate process.env
const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    process.env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

async function main() {
  // Dynamically import GET so env variables are loaded first
  const { GET } = await import('../src/app/api/live-scores/route');

  const req = new Request('http://localhost/api/live-scores?date=2026-07-04');
  try {
    const res = await GET(req);
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Response JSON:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error executing GET:', err);
  }
}

main().catch(console.error);
