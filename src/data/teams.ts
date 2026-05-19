export const groups = [
  { id: 'A', name: 'A Grubu' },
  { id: 'B', name: 'B Grubu' },
  { id: 'C', name: 'C Grubu' },
  { id: 'D', name: 'D Grubu' },
  { id: 'E', name: 'E Grubu' },
  { id: 'F', name: 'F Grubu' },
  { id: 'G', name: 'G Grubu' },
  { id: 'H', name: 'H Grubu' },
  { id: 'I', name: 'I Grubu' },
  { id: 'J', name: 'J Grubu' },
  { id: 'K', name: 'K Grubu' },
  { id: 'L', name: 'L Grubu' },
];

const countryCodeMap: Record<string, string> = {
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz',
  CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb-sct',
  USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec',
  NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz',
  ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no',
  ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co',
  ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
};

const nameMap: Record<string, string> = {
  MEX: 'Meksika', RSA: 'Güney Afrika', KOR: 'Güney Kore', CZE: 'Çekya',
  CAN: 'Kanada', BIH: 'Bosna-Hersek', QAT: 'Katar', SUI: 'İsviçre',
  BRA: 'Brezilya', MAR: 'Fas', HAI: 'Haiti', SCO: 'İskoçya',
  USA: 'ABD', PAR: 'Paraguay', AUS: 'Avustralya', TUR: 'Türkiye',
  GER: 'Almanya', CUW: 'Curaçao', CIV: 'Fildişi Sahili', ECU: 'Ekvador',
  NED: 'Hollanda', JPN: 'Japonya', SWE: 'İsveç', TUN: 'Tunus',
  BEL: 'Belçika', EGY: 'Mısır', IRN: 'İran', NZL: 'Yeni Zelanda',
  ESP: 'İspanya', CPV: 'Yeşil Burun', KSA: 'Suudi Arabistan', URU: 'Uruguay',
  FRA: 'Fransa', SEN: 'Senegal', IRQ: 'Irak', NOR: 'Norveç',
  ARG: 'Arjantin', ALG: 'Cezayir', AUT: 'Avusturya', JOR: 'Ürdün',
  POR: 'Portekiz', COD: 'Kongo DC', UZB: 'Özbekistan', COL: 'Kolombiya',
  ENG: 'İngiltere', CRO: 'Hırvatistan', GHA: 'Gana', PAN: 'Panama',
};

const groupMap: Record<string, string> = {
  MEX: 'A', RSA: 'A', KOR: 'A', CZE: 'A',
  CAN: 'B', BIH: 'B', QAT: 'B', SUI: 'B',
  BRA: 'C', MAR: 'C', HAI: 'C', SCO: 'C',
  USA: 'D', PAR: 'D', AUS: 'D', TUR: 'D',
  GER: 'E', CUW: 'E', CIV: 'E', ECU: 'E',
  NED: 'F', JPN: 'F', SWE: 'F', TUN: 'F',
  BEL: 'G', EGY: 'G', IRN: 'G', NZL: 'G',
  ESP: 'H', CPV: 'H', KSA: 'H', URU: 'H',
  FRA: 'I', SEN: 'I', IRQ: 'I', NOR: 'I',
  ARG: 'J', ALG: 'J', AUT: 'J', JOR: 'J',
  POR: 'K', COD: 'K', UZB: 'K', COL: 'K',
  ENG: 'L', CRO: 'L', GHA: 'L', PAN: 'L',
};

export const teams: Record<string, { name: string; code: string; flag: string; groupId: string }> = {};

for (const code of Object.keys(nameMap)) {
  teams[code] = {
    name: nameMap[code],
    code,
    flag: `https://flagcdn.com/w80/${countryCodeMap[code]}.png`,
    groupId: groupMap[code],
  };
}

export const getTeam = (id: string) => {
  if (id === 'TBD') return { name: 'Belirlenecek', code: 'TBD', flag: '', groupId: '' };
  return teams[id] || { name: id, code: id, flag: '', groupId: '' };
};

export function getFlagUrl(code: string): string {
  if (code === 'TBD' || !code) return '';
  const cc = countryCodeMap[code];
  if (!cc) return '';
  return `https://flagcdn.com/w80/${cc}.png`;
}