export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  country: string;
  stage: string;
  group?: string;
  homeScore?: number;
  awayScore?: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  isCompleted: boolean;
}

export const matches: Match[] = [
  // ===== A GRUBU =====
  { id: 'M001', homeTeamId: 'MEX', awayTeamId: 'RSA', date: '2026-06-11', time: '22:00', venue: 'Estadio Azteca', city: 'Meksika', country: 'Meksika', stage: 'Grup', group: 'A', isCompleted: false },
  { id: 'M002', homeTeamId: 'KOR', awayTeamId: 'CZE', date: '2026-06-12', time: '05:00', venue: 'Estadio Akron', city: 'Zapopan', country: 'Meksika', stage: 'Grup', group: 'A', isCompleted: false },
  { id: 'M003', homeTeamId: 'CZE', awayTeamId: 'RSA', date: '2026-06-18', time: '19:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'ABD', stage: 'Grup', group: 'A', isCompleted: false },
  { id: 'M004', homeTeamId: 'MEX', awayTeamId: 'KOR', date: '2026-06-19', time: '04:00', venue: 'Estadio Akron', city: 'Zapopan', country: 'Meksika', stage: 'Grup', group: 'A', isCompleted: false },
  { id: 'M005', homeTeamId: 'CZE', awayTeamId: 'MEX', date: '2026-06-25', time: '04:00', venue: 'Estadio Azteca', city: 'Meksika', country: 'Meksika', stage: 'Grup', group: 'A', isCompleted: false },
  { id: 'M006', homeTeamId: 'RSA', awayTeamId: 'KOR', date: '2026-06-25', time: '04:00', venue: 'Estadio BBVA', city: 'Guadalupe', country: 'Meksika', stage: 'Grup', group: 'A', isCompleted: false },

  // ===== B GRUBU =====
  { id: 'M007', homeTeamId: 'CAN', awayTeamId: 'BIH', date: '2026-06-12', time: '22:00', venue: 'BMO Field', city: 'Toronto', country: 'Kanada', stage: 'Grup', group: 'B', isCompleted: false },
  { id: 'M008', homeTeamId: 'QAT', awayTeamId: 'SUI', date: '2026-06-13', time: '22:00', venue: "Levi's Stadium", city: 'Santa Clara', country: 'ABD', stage: 'Grup', group: 'B', isCompleted: false },
  { id: 'M009', homeTeamId: 'SUI', awayTeamId: 'BIH', date: '2026-06-18', time: '22:00', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'ABD', stage: 'Grup', group: 'B', isCompleted: false },
  { id: 'M010', homeTeamId: 'CAN', awayTeamId: 'QAT', date: '2026-06-19', time: '01:00', venue: 'BC Place', city: 'Vancouver', country: 'Kanada', stage: 'Grup', group: 'B', isCompleted: false },
  { id: 'M011', homeTeamId: 'SUI', awayTeamId: 'CAN', date: '2026-06-24', time: '22:00', venue: 'BC Place', city: 'Vancouver', country: 'Kanada', stage: 'Grup', group: 'B', isCompleted: false },
  { id: 'M012', homeTeamId: 'BIH', awayTeamId: 'QAT', date: '2026-06-24', time: '22:00', venue: 'Lumen Field', city: 'Seattle', country: 'ABD', stage: 'Grup', group: 'B', isCompleted: false },

  // ===== C GRUBU =====
  { id: 'M013', homeTeamId: 'BRA', awayTeamId: 'MAR', date: '2026-06-14', time: '01:00', venue: 'MetLife Stadium', city: 'New York', country: 'ABD', stage: 'Grup', group: 'C', isCompleted: false },
  { id: 'M014', homeTeamId: 'HAI', awayTeamId: 'SCO', date: '2026-06-14', time: '04:00', venue: 'Gillette Stadium', city: 'Boston', country: 'ABD', stage: 'Grup', group: 'C', isCompleted: false },
  { id: 'M015', homeTeamId: 'BRA', awayTeamId: 'HAI', date: '2026-06-20', time: '04:00', venue: 'Lincoln Financial Field', city: 'Philadelphia', country: 'ABD', stage: 'Grup', group: 'C', isCompleted: false },
  { id: 'M016', homeTeamId: 'SCO', awayTeamId: 'MAR', date: '2026-06-20', time: '01:00', venue: 'Gillette Stadium', city: 'Boston', country: 'ABD', stage: 'Grup', group: 'C', isCompleted: false },
  { id: 'M017', homeTeamId: 'SCO', awayTeamId: 'BRA', date: '2026-06-25', time: '01:00', venue: 'Hard Rock Stadium', city: 'Miami', country: 'ABD', stage: 'Grup', group: 'C', isCompleted: false },
  { id: 'M018', homeTeamId: 'MAR', awayTeamId: 'HAI', date: '2026-06-25', time: '01:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'ABD', stage: 'Grup', group: 'C', isCompleted: false },

  // ===== D GRUBU =====
  { id: 'M019', homeTeamId: 'USA', awayTeamId: 'PAR', date: '2026-06-13', time: '04:00', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'ABD', stage: 'Grup', group: 'D', isCompleted: false },
  { id: 'M020', homeTeamId: 'AUS', awayTeamId: 'TUR', date: '2026-06-14', time: '07:00', venue: 'BC Place', city: 'Vancouver', country: 'Kanada', stage: 'Grup', group: 'D', isCompleted: false },
  { id: 'M021', homeTeamId: 'TUR', awayTeamId: 'PAR', date: '2026-06-20', time: '06:00', venue: "Levi's Stadium", city: 'Santa Clara', country: 'ABD', stage: 'Grup', group: 'D', isCompleted: false },
  { id: 'M022', homeTeamId: 'USA', awayTeamId: 'AUS', date: '2026-06-19', time: '22:00', venue: 'Lumen Field', city: 'Seattle', country: 'ABD', stage: 'Grup', group: 'D', isCompleted: false },
  { id: 'M023', homeTeamId: 'TUR', awayTeamId: 'USA', date: '2026-06-26', time: '05:00', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'ABD', stage: 'Grup', group: 'D', isCompleted: false },
  { id: 'M024', homeTeamId: 'PAR', awayTeamId: 'AUS', date: '2026-06-26', time: '05:00', venue: "Levi's Stadium", city: 'Santa Clara', country: 'ABD', stage: 'Grup', group: 'D', isCompleted: false },

  // ===== E GRUBU =====
  { id: 'M025', homeTeamId: 'CIV', awayTeamId: 'ECU', date: '2026-06-15', time: '02:00', venue: 'Lincoln Financial Field', city: 'Philadelphia', country: 'ABD', stage: 'Grup', group: 'E', isCompleted: false },
  { id: 'M026', homeTeamId: 'GER', awayTeamId: 'CUW', date: '2026-06-14', time: '20:00', venue: 'NRG Stadium', city: 'Houston', country: 'ABD', stage: 'Grup', group: 'E', isCompleted: false },
  { id: 'M027', homeTeamId: 'GER', awayTeamId: 'CIV', date: '2026-06-20', time: '23:00', venue: 'BMO Field', city: 'Toronto', country: 'Kanada', stage: 'Grup', group: 'E', isCompleted: false },
  { id: 'M028', homeTeamId: 'ECU', awayTeamId: 'CUW', date: '2026-06-21', time: '03:00', venue: 'Arrowhead Stadium', city: 'Kansas City', country: 'ABD', stage: 'Grup', group: 'E', isCompleted: false },
  { id: 'M029', homeTeamId: 'CUW', awayTeamId: 'CIV', date: '2026-06-25', time: '23:00', venue: 'Lincoln Financial Field', city: 'Philadelphia', country: 'ABD', stage: 'Grup', group: 'E', isCompleted: false },
  { id: 'M030', homeTeamId: 'ECU', awayTeamId: 'GER', date: '2026-06-25', time: '23:00', venue: 'MetLife Stadium', city: 'New York', country: 'ABD', stage: 'Grup', group: 'E', isCompleted: false },

  // ===== F GRUBU =====
  { id: 'M031', homeTeamId: 'NED', awayTeamId: 'JPN', date: '2026-06-14', time: '23:00', venue: 'AT&T Stadium', city: 'Dallas', country: 'ABD', stage: 'Grup', group: 'F', isCompleted: false },
  { id: 'M032', homeTeamId: 'SWE', awayTeamId: 'TUN', date: '2026-06-15', time: '05:00', venue: 'Estadio BBVA', city: 'Guadalupe', country: 'Meksika', stage: 'Grup', group: 'F', isCompleted: false },
  { id: 'M033', homeTeamId: 'NED', awayTeamId: 'SWE', date: '2026-06-20', time: '20:00', venue: 'NRG Stadium', city: 'Houston', country: 'ABD', stage: 'Grup', group: 'F', isCompleted: false },
  { id: 'M034', homeTeamId: 'TUN', awayTeamId: 'JPN', date: '2026-06-21', time: '07:00', venue: 'Estadio BBVA', city: 'Guadalupe', country: 'Meksika', stage: 'Grup', group: 'F', isCompleted: false },
  { id: 'M035', homeTeamId: 'JPN', awayTeamId: 'SWE', date: '2026-06-26', time: '02:00', venue: 'AT&T Stadium', city: 'Dallas', country: 'ABD', stage: 'Grup', group: 'F', isCompleted: false },
  { id: 'M036', homeTeamId: 'TUN', awayTeamId: 'NED', date: '2026-06-26', time: '02:00', venue: 'Arrowhead Stadium', city: 'Kansas City', country: 'ABD', stage: 'Grup', group: 'F', isCompleted: false },

  // ===== G GRUBU =====
  { id: 'M037', homeTeamId: 'BEL', awayTeamId: 'EGY', date: '2026-06-15', time: '22:00', venue: 'Lumen Field', city: 'Seattle', country: 'ABD', stage: 'Grup', group: 'G', isCompleted: false },
  { id: 'M038', homeTeamId: 'IRN', awayTeamId: 'NZL', date: '2026-06-16', time: '04:00', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'ABD', stage: 'Grup', group: 'G', isCompleted: false },
  { id: 'M039', homeTeamId: 'BEL', awayTeamId: 'IRN', date: '2026-06-21', time: '22:00', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'ABD', stage: 'Grup', group: 'G', isCompleted: false },
  { id: 'M040', homeTeamId: 'NZL', awayTeamId: 'EGY', date: '2026-06-22', time: '04:00', venue: 'BC Place', city: 'Vancouver', country: 'Kanada', stage: 'Grup', group: 'G', isCompleted: false },
  { id: 'M041', homeTeamId: 'EGY', awayTeamId: 'IRN', date: '2026-06-27', time: '06:00', venue: 'Lumen Field', city: 'Seattle', country: 'ABD', stage: 'Grup', group: 'G', isCompleted: false },
  { id: 'M042', homeTeamId: 'NZL', awayTeamId: 'BEL', date: '2026-06-27', time: '06:00', venue: 'BC Place', city: 'Vancouver', country: 'Kanada', stage: 'Grup', group: 'G', isCompleted: false },

  // ===== H GRUBU =====
  { id: 'M043', homeTeamId: 'ESP', awayTeamId: 'CPV', date: '2026-06-15', time: '19:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'ABD', stage: 'Grup', group: 'H', isCompleted: false },
  { id: 'M044', homeTeamId: 'KSA', awayTeamId: 'URU', date: '2026-06-16', time: '01:00', venue: 'Hard Rock Stadium', city: 'Miami', country: 'ABD', stage: 'Grup', group: 'H', isCompleted: false },
  { id: 'M045', homeTeamId: 'ESP', awayTeamId: 'KSA', date: '2026-06-21', time: '19:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'ABD', stage: 'Grup', group: 'H', isCompleted: false },
  { id: 'M046', homeTeamId: 'URU', awayTeamId: 'CPV', date: '2026-06-22', time: '01:00', venue: 'Hard Rock Stadium', city: 'Miami', country: 'ABD', stage: 'Grup', group: 'H', isCompleted: false },
  { id: 'M047', homeTeamId: 'CPV', awayTeamId: 'KSA', date: '2026-06-27', time: '03:00', venue: 'NRG Stadium', city: 'Houston', country: 'ABD', stage: 'Grup', group: 'H', isCompleted: false },
  { id: 'M048', homeTeamId: 'URU', awayTeamId: 'ESP', date: '2026-06-27', time: '03:00', venue: 'Estadio Akron', city: 'Zapopan', country: 'Meksika', stage: 'Grup', group: 'H', isCompleted: false },

  // ===== I GRUBU =====
  { id: 'M049', homeTeamId: 'FRA', awayTeamId: 'SEN', date: '2026-06-16', time: '22:00', venue: 'MetLife Stadium', city: 'New York', country: 'ABD', stage: 'Grup', group: 'I', isCompleted: false },
  { id: 'M050', homeTeamId: 'IRQ', awayTeamId: 'NOR', date: '2026-06-17', time: '01:00', venue: 'Gillette Stadium', city: 'Boston', country: 'ABD', stage: 'Grup', group: 'I', isCompleted: false },
  { id: 'M051', homeTeamId: 'FRA', awayTeamId: 'IRQ', date: '2026-06-23', time: '00:00', venue: 'Lincoln Financial Field', city: 'Philadelphia', country: 'ABD', stage: 'Grup', group: 'I', isCompleted: false },
  { id: 'M052', homeTeamId: 'NOR', awayTeamId: 'SEN', date: '2026-06-23', time: '03:00', venue: 'MetLife Stadium', city: 'New York', country: 'ABD', stage: 'Grup', group: 'I', isCompleted: false },
  { id: 'M053', homeTeamId: 'NOR', awayTeamId: 'FRA', date: '2026-06-26', time: '22:00', venue: 'Gillette Stadium', city: 'Boston', country: 'ABD', stage: 'Grup', group: 'I', isCompleted: false },
  { id: 'M054', homeTeamId: 'SEN', awayTeamId: 'IRQ', date: '2026-06-26', time: '22:00', venue: 'BMO Field', city: 'Toronto', country: 'Kanada', stage: 'Grup', group: 'I', isCompleted: false },

  // ===== J GRUBU =====
  { id: 'M055', homeTeamId: 'ARG', awayTeamId: 'ALG', date: '2026-06-17', time: '04:00', venue: 'Arrowhead Stadium', city: 'Kansas City', country: 'ABD', stage: 'Grup', group: 'J', isCompleted: false },
  { id: 'M056', homeTeamId: 'AUT', awayTeamId: 'JOR', date: '2026-06-17', time: '07:00', venue: "Levi's Stadium", city: 'Santa Clara', country: 'ABD', stage: 'Grup', group: 'J', isCompleted: false },
  { id: 'M057', homeTeamId: 'ARG', awayTeamId: 'AUT', date: '2026-06-22', time: '20:00', venue: 'AT&T Stadium', city: 'Dallas', country: 'ABD', stage: 'Grup', group: 'J', isCompleted: false },
  { id: 'M058', homeTeamId: 'JOR', awayTeamId: 'ALG', date: '2026-06-22', time: '22:00', venue: "Levi's Stadium", city: 'Santa Clara', country: 'ABD', stage: 'Grup', group: 'J', isCompleted: false },
  { id: 'M059', homeTeamId: 'ALG', awayTeamId: 'AUT', date: '2026-06-28', time: '05:00', venue: 'Arrowhead Stadium', city: 'Kansas City', country: 'ABD', stage: 'Grup', group: 'J', isCompleted: false },
  { id: 'M060', homeTeamId: 'JOR', awayTeamId: 'ARG', date: '2026-06-28', time: '05:00', venue: 'AT&T Stadium', city: 'Dallas', country: 'ABD', stage: 'Grup', group: 'J', isCompleted: false },

  // ===== K GRUBU =====
  { id: 'M061', homeTeamId: 'POR', awayTeamId: 'COD', date: '2026-06-17', time: '20:00', venue: 'NRG Stadium', city: 'Houston', country: 'ABD', stage: 'Grup', group: 'K', isCompleted: false },
  { id: 'M062', homeTeamId: 'UZB', awayTeamId: 'COL', date: '2026-06-18', time: '05:00', venue: 'Estadio Azteca', city: 'Meksika', country: 'Meksika', stage: 'Grup', group: 'K', isCompleted: false },
  { id: 'M063', homeTeamId: 'POR', awayTeamId: 'UZB', date: '2026-06-23', time: '20:00', venue: 'NRG Stadium', city: 'Houston', country: 'ABD', stage: 'Grup', group: 'K', isCompleted: false },
  { id: 'M064', homeTeamId: 'COL', awayTeamId: 'COD', date: '2026-06-24', time: '05:00', venue: 'Estadio Akron', city: 'Zapopan', country: 'Meksika', stage: 'Grup', group: 'K', isCompleted: false },
  { id: 'M065', homeTeamId: 'COL', awayTeamId: 'POR', date: '2026-06-28', time: '02:30', venue: 'Hard Rock Stadium', city: 'Miami', country: 'ABD', stage: 'Grup', group: 'K', isCompleted: false },
  { id: 'M066', homeTeamId: 'COD', awayTeamId: 'UZB', date: '2026-06-28', time: '02:30', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'ABD', stage: 'Grup', group: 'K', isCompleted: false },

  // ===== L GRUBU =====
  { id: 'M067', homeTeamId: 'ENG', awayTeamId: 'CRO', date: '2026-06-17', time: '23:00', venue: 'AT&T Stadium', city: 'Dallas', country: 'ABD', stage: 'Grup', group: 'L', isCompleted: false },
  { id: 'M068', homeTeamId: 'GHA', awayTeamId: 'PAN', date: '2026-06-18', time: '02:00', venue: 'BMO Field', city: 'Toronto', country: 'Kanada', stage: 'Grup', group: 'L', isCompleted: false },
  { id: 'M069', homeTeamId: 'ENG', awayTeamId: 'GHA', date: '2026-06-23', time: '23:00', venue: 'Gillette Stadium', city: 'Boston', country: 'ABD', stage: 'Grup', group: 'L', isCompleted: false },
  { id: 'M070', homeTeamId: 'PAN', awayTeamId: 'CRO', date: '2026-06-24', time: '02:00', venue: 'BMO Field', city: 'Toronto', country: 'Kanada', stage: 'Grup', group: 'L', isCompleted: false },
  { id: 'M071', homeTeamId: 'PAN', awayTeamId: 'ENG', date: '2026-06-28', time: '00:00', venue: 'MetLife Stadium', city: 'New York', country: 'ABD', stage: 'Grup', group: 'L', isCompleted: false },
  { id: 'M072', homeTeamId: 'CRO', awayTeamId: 'GHA', date: '2026-06-28', time: '00:00', venue: 'Lincoln Financial Field', city: 'Philadelphia', country: 'ABD', stage: 'Grup', group: 'L', isCompleted: false },

  // ===== SON 32 =====
  { id: 'M073', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-06-28', time: '22:00', venue: 'MetLife Stadium', city: 'New York', country: 'ABD', stage: 'Son 32', isCompleted: false },
  { id: 'M074', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-06-29', time: '23:30', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'ABD', stage: 'Son 32', isCompleted: false },
  { id: 'M075', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-06-30', time: '04:00', venue: 'AT&T Stadium', city: 'Dallas', country: 'ABD', stage: 'Son 32', isCompleted: false },
  { id: 'M076', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-06-29', time: '20:00', venue: 'BMO Field', city: 'Toronto', country: 'Kanada', stage: 'Son 32', isCompleted: false },
  { id: 'M077', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-01', time: '00:00', venue: 'Hard Rock Stadium', city: 'Miami', country: 'ABD', stage: 'Son 32', isCompleted: false },
  { id: 'M078', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-06-30', time: '20:00', venue: "Levi's Stadium", city: 'Santa Clara', country: 'ABD', stage: 'Son 32', isCompleted: false },
  { id: 'M079', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-01', time: '04:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'ABD', stage: 'Son 32', isCompleted: false },
  { id: 'M080', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-01', time: '19:00', venue: 'Lincoln Financial Field', city: 'Philadelphia', country: 'ABD', stage: 'Son 32', isCompleted: false },
  { id: 'M081', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-02', time: '03:00', venue: 'NRG Stadium', city: 'Houston', country: 'ABD', stage: 'Son 32', isCompleted: false },
  { id: 'M082', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-01', time: '23:00', venue: 'Lumen Field', city: 'Seattle', country: 'ABD', stage: 'Son 32', isCompleted: false },
  { id: 'M083', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-03', time: '02:00', venue: 'Gillette Stadium', city: 'Boston', country: 'ABD', stage: 'Son 32', isCompleted: false },
  { id: 'M084', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-02', time: '22:00', venue: 'Estadio Azteca', city: 'Meksika', country: 'Meksika', stage: 'Son 32', isCompleted: false },
  { id: 'M101', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-03', time: '08:00', venue: 'Estadio BBVA', city: 'Guadalupe', country: 'Meksika', stage: 'Son 32', isCompleted: false },
  { id: 'M102', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-04', time: '01:00', venue: 'Arrowhead Stadium', city: 'Kansas City', country: 'ABD', stage: 'Son 32', isCompleted: false },
  { id: 'M103', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-04', time: '04:30', venue: 'BC Place', city: 'Vancouver', country: 'Kanada', stage: 'Son 32', isCompleted: false },
  { id: 'M104', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-03', time: '21:00', venue: 'Estadio Akron', city: 'Zapopan', country: 'Meksika', stage: 'Son 32', isCompleted: false },

  // ===== SON 16 =====
  { id: 'M085', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-05', time: '00:00', venue: 'MetLife Stadium', city: 'New York', country: 'ABD', stage: 'Son 16', isCompleted: false },
  { id: 'M086', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-04', time: '20:00', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'ABD', stage: 'Son 16', isCompleted: false },
  { id: 'M087', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-05', time: '23:00', venue: 'AT&T Stadium', city: 'Dallas', country: 'ABD', stage: 'Son 16', isCompleted: false },
  { id: 'M088', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-06', time: '03:00', venue: 'Hard Rock Stadium', city: 'Miami', country: 'ABD', stage: 'Son 16', isCompleted: false },
  { id: 'M089', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-06', time: '22:00', venue: 'BMO Field', city: 'Toronto', country: 'Kanada', stage: 'Son 16', isCompleted: false },
  { id: 'M090', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-07', time: '03:00', venue: "Levi's Stadium", city: 'Santa Clara', country: 'ABD', stage: 'Son 16', isCompleted: false },
  { id: 'M091', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-07', time: '19:00', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'ABD', stage: 'Son 16', isCompleted: false },
  { id: 'M092', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-07', time: '23:00', venue: 'NRG Stadium', city: 'Houston', country: 'ABD', stage: 'Son 16', isCompleted: false },

  // ===== ÇEYREK FİNAL =====
  { id: 'M093', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-09', time: '23:00', venue: 'MetLife Stadium', city: 'New York', country: 'ABD', stage: 'Çeyrek Final', isCompleted: false },
  { id: 'M094', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-10', time: '22:00', venue: 'AT&T Stadium', city: 'Dallas', country: 'ABD', stage: 'Çeyrek Final', isCompleted: false },
  { id: 'M095', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-12', time: '00:00', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'ABD', stage: 'Çeyrek Final', isCompleted: false },
  { id: 'M096', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-12', time: '04:00', venue: 'Hard Rock Stadium', city: 'Miami', country: 'ABD', stage: 'Çeyrek Final', isCompleted: false },

  // ===== YARI FİNAL =====
  { id: 'M097', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-14', time: '22:00', venue: 'MetLife Stadium', city: 'New York', country: 'ABD', stage: 'Yarı Final', isCompleted: false },
  { id: 'M098', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-15', time: '22:00', venue: 'AT&T Stadium', city: 'Dallas', country: 'ABD', stage: 'Yarı Final', isCompleted: false },

  // ===== ÜÇÜNCÜLÜK =====
  { id: 'M099', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-19', time: '00:00', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'ABD', stage: 'Üçüncülük', isCompleted: false },

  // ===== FİNAL =====
  { id: 'M100', homeTeamId: 'TBD', awayTeamId: 'TBD', date: '2026-07-19', time: '22:00', venue: 'MetLife Stadium', city: 'New York', country: 'ABD', stage: 'Final', isCompleted: false },
];