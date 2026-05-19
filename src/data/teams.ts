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

const fifaRanking: Record<string, number> = {
  ARG: 1, FRA: 2, ESP: 3, ENG: 4, BRA: 5, BEL: 6, NED: 7, POR: 8,
  COL: 9, GER: 11, CRO: 12, MAR: 13, SUI: 14, USA: 15,
  MEX: 16, JPN: 17, SWE: 18, KOR: 19, URU: 20, AUT: 21, ECU: 22,
  SEN: 23, CIV: 24, IRN: 25, TUN: 26, PAN: 27, GHA: 28, PAR: 29,
  AUS: 30, CZE: 31, QAT: 32, CAN: 33, EGY: 34, RSA: 35,
  NZL: 36, BIH: 37, HAI: 38, SCO: 39, CUW: 40, ALG: 41, JOR: 42,
  CPV: 43, IRQ: 44, NOR: 45, COD: 46, UZB: 47, KSA: 48,
};

const coaches: Record<string, string> = {
  MEX: 'Javier Aguirre', RSA: 'Hugo Broos', KOR: 'Hong Myung-bo', CZE: 'Ivan Hašek',
  CAN: 'Jesse Marsch', BIH: 'Sergej Barbarez', QAT: 'Marquez López', SUI: 'Murat Yakin',
  BRA: 'Dorival Júnior', MAR: 'Walid Regragui', HAI: 'Gabriel Calderón', SCO: 'Steve Clarke',
  USA: 'Mauricio Pochettino', PAR: 'Gustavo Alfaro', AUS: 'Tony Popovic', TUR: 'Vincenzo Montella',
  GER: 'Julian Nagelsmann', CUW: 'Dick Advocaat', CIV: 'Jean-Louis Gasset', ECU: 'Sebastián Beccacece',
  NED: 'Ronald Koeman', JPN: 'Hajime Moriyasu', SWE: 'Jon Dahl Tomasson', TUN: 'Faouzi Benzarti',
  BEL: 'Rudi Garcia', EGY: 'Hossam Hassan', IRN: 'Amir Ghalenoei', NZL: 'Danny Hay',
  ESP: 'Luis de la Fuente', CPV: 'Bubista', KSA: 'Herve Renard', URU: 'Marcelo Bielsa',
  FRA: 'Didier Deschamps', SEN: 'Aliou Cissé', IRQ: 'Jesus Casas', NOR: 'Ståle Solbakken',
  ARG: 'Lionel Scaloni', ALG: 'Vladimir Petković', AUT: 'Ralf Rangnick', JOR: 'Jamal Abu-Abed',
  POR: 'Roberto Martinez', COD: 'Sebastien Desabre', UZB: 'Srečko Katanec', COL: 'Néstor Lorenzo',
  ENG: 'Thomas Tuchel', CRO: 'Zlatko Dalić', GHA: 'Otto Addo', PAN: 'Thomas Christiansen',
};

const colors: Record<string, { primary: string; secondary: string }> = {
  MEX: { primary: '#006847', secondary: '#CE1126' }, RSA: { primary: '#007A4D', secondary: '#FFB81C' },
  KOR: { primary: '#CD2E3A', secondary: '#0047A0' }, CZE: { primary: '#003893', secondary: '#D7141A' },
  CAN: { primary: '#FF0000', secondary: '#FFFFFF' }, BIH: { primary: '#002395', secondary: '#FECB00' },
  QAT: { primary: '#8A1538', secondary: '#FFFFFF' }, SUI: { primary: '#FF0000', secondary: '#FFFFFF' },
  BRA: { primary: '#009B3A', secondary: '#FFDF00' }, MAR: { primary: '#C1272D', secondary: '#006233' },
  HAI: { primary: '#00209F', secondary: '#D21034' }, SCO: { primary: '#003087', secondary: '#FFFFFF' },
  USA: { primary: '#002868', secondary: '#BF0A30' }, PAR: { primary: '#D52B1E', secondary: '#0038A8' },
  AUS: { primary: '#FFD700', secondary: '#00843D' }, TUR: { primary: '#E30A17', secondary: '#FFFFFF' },
  GER: { primary: '#000000', secondary: '#DD0000' }, CUW: { primary: '#002B7F', secondary: '#F9A600' },
  CIV: { primary: '#FF6600', secondary: '#FFFFFF' }, ECU: { primary: '#0038A8', secondary: '#FFD100' },
  NED: { primary: '#FF6600', secondary: '#000000' }, JPN: { primary: '#000080', secondary: '#FFFFFF' },
  SWE: { primary: '#005293', secondary: '#FECC02' }, TUN: { primary: '#E70013', secondary: '#FFFFFF' },
  BEL: { primary: '#ED2939', secondary: '#FFD900' }, EGY: { primary: '#C8102E', secondary: '#FFFFFF' },
  IRN: { primary: '#239F40', secondary: '#FFFFFF' }, NZL: { primary: '#000000', secondary: '#FFFFFF' },
  ESP: { primary: '#C60B1E', secondary: '#FFC400' }, CPV: { primary: '#003893', secondary: '#CF202A' },
  KSA: { primary: '#006C35', secondary: '#FFFFFF' }, URU: { primary: '#5CBEFF', secondary: '#000000' },
  FRA: { primary: '#002395', secondary: '#ED2939' }, SEN: { primary: '#00653A', secondary: '#FFD700' },
  IRQ: { primary: '#CE1126', secondary: '#000000' }, NOR: { primary: '#BA0C2F', secondary: '#00205B' },
  ARG: { primary: '#74ACDF', secondary: '#FFFFFF' }, ALG: { primary: '#006233', secondary: '#D21034' },
  AUT: { primary: '#ED2939', secondary: '#FFFFFF' }, JOR: { primary: '#000000', secondary: '#FFFFFF' },
  POR: { primary: '#006600', secondary: '#FF0000' }, COD: { primary: '#007FFF', secondary: '#F7D618' },
  UZB: { primary: '#0099B5', secondary: '#FFFFFF' }, COL: { primary: '#FFCD00', secondary: '#003893' },
  ENG: { primary: '#FFFFFF', secondary: '#CF081F' }, CRO: { primary: '#FF0000', secondary: '#171796' },
  GHA: { primary: '#FFCD00', secondary: '#003893' }, PAN: { primary: '#003893', secondary: '#FFFFFF' },
};

const squads: Record<string, string[]> = {
  MEX: ['Guillermo Ochoa', 'Jorge Sánchez', 'César Montes', 'Johan Vásquez', 'Luis Romo', 'Edson Álvarez', 'Carlos Rodríguez', 'Uriel Antuna', 'Hirving Lozano', 'Santiago Giménez', 'Alexis Vega'],
  RSA: ['Ronwen Williams', 'Nkosinathi Sibisi', 'Siya Kolisi', 'Mothobi Mvala', 'Grant Kekana', 'Teboho Mokoena', 'Mothiba', 'Percy Tau', 'Lyle Foster', 'Evidence Makgop', 'Zwane'],
  KOR: ['Kim Seung-gyu', 'Kim Min-jae', 'Kim Young-gwon', 'Lee Yong', 'Hwang In-beom', 'Lee Kang-in', 'Son Heung-min', 'Hwang Hee-chan', 'Cho Gue-sung', 'Oh Hyun-gyu', 'Paik Seung-ho'],
  CZE: ['Jindřich Staněk', 'Vladimír Coufal', 'Tomáš Holeš', 'David Zima', 'Robin Hranáč', 'Antonín Barák', 'Lukáš Provod', 'Patrik Schick', 'Tomáš Chorý', 'Adam Hložek', 'Vladimír Černý'],
  CAN: ['Milan Borjan', 'Alphonso Davies', 'Alistair Johnston', 'Kamal Miller', 'Richie Laryea', 'Stephen Eustáquio', 'Jonathan Osorio', 'Cyle Larin', 'Tajon Buchanan', 'Jonathan David', 'Liam Millar'],
  BIH: ['Asmir Begović', 'Sead Kolašinac', 'Jusuf Gazibegović', 'Anel Ahmedhodžić', 'Amir Hadžiahmetović', 'Edin Višća', 'Miralem Pjanić', 'Rade Krunić', 'Luka Menalo', 'Said Hamulić', 'Kenan Kodro'],
  QAT: ['Meshaal Barsham', 'Pedro Miguel', 'Boualem Khoukhi', 'Tarek Salman', 'Abdulaziz Hatem', 'Karim Boudiaf', 'Hasan Al-Haydos', 'Akram Afif', 'Almoez Ali', 'Yusuf Abdurisag', 'Ahmed Alaa'],
  SUI: ['Yann Sommer', 'Silvan Widmer', 'Manuel Akanji', 'Fabian Schär', 'Ricardo Rodriguez', 'Granit Xhaka', 'Remo Freuler', 'Xherdan Shaqiri', 'Ruben Vargas', 'Breel Embolo', 'Zuber'],
  BRA: ['Alisson', 'Danilo', 'Marquinhos', 'Gabriel Magalhães', 'Alex Sandro', 'Bruno Guimarães', 'Lucas Paquetá', 'Vinícius Jr', 'Rodrygo', 'Gabriel Jesus', 'Endrick'],
  MAR: ['Yassine Bounou', 'Achraf Hakimi', 'Romain Saïss', 'Nayef Aguerd', 'Noussair Mazraoui', 'Sofyan Amrabat', 'Azzedine Ounahi', 'Hakim Ziyech', 'Youssef En-Nesyri', 'Soufiane Rahimi', 'Brahim Díaz'],
  HAI: ['Johny Plainte', 'Andrew Jean-Baptiste', 'Duckens Nazon', 'Bryan Tamacas', 'Jean-Kevin Maurin', 'Carlens Arcus', 'Frantzdy Pierrot', 'Hervé Bazile', 'Widner Chérénard', 'Mechack Jérôme', 'Ronalde André'],
  SCO: ['Angus Gunn', 'Andy Robertson', 'Kieran Tierney', 'Ryan Porteous', 'Scott McTominay', 'John McGinn', 'Stuart Armstrong', 'Lewis Ferguson', 'Lyndon Dykes', 'Che Adams', 'Lawrence Shankland'],
  USA: ['Matt Turner', 'Sergiño Dest', 'Tim Ream', 'Chris Richards', 'Antonee Robinson', 'Weston McKennie', 'Tyler Adams', 'Giovanni Reyna', 'Christian Pulisic', 'Folarin Balogun', 'Ricardo Pepi'],
  PAR: ['Anthony Silva', 'Gustavo Gómez', 'Omar Alderete', 'Fabian Balbuena', 'Robert Rojas', 'Mathías Villasanti', 'Miguel Almirón', 'Ramón Sosa', 'Antony Silva', 'Adam Bareiro', 'Julio Enciso'],
  AUS: ['Mathew Ryan', 'Aziz Behich', 'Harry Souttar', 'Milos Degenek', 'Nathaniel Atkinson', 'Aiden O\'Neill', 'Jackson Irvine', 'Riley McGree', 'Mathew Leckie', 'Jamie Maclaren', 'Kusini Yengi'],
  TUR: ['Altay Bayındır', 'Zeki Çelik', 'Merih Demiral', 'Çağlar Söyüncü', 'Ozan Kabak', 'İrfan Can Kahveci', 'Arda Güler', 'Hakan Çalhanoğlu', 'Cengiz Ünder', 'Kerem Aktürkoğlu', 'Barış Alper Yılmaz'],
  GER: ['Marc-André ter Stegen', 'Joshua Kimmich', 'Antonio Rüdiger', 'Nico Schlotterbeck', 'David Raum', 'Toni Kroos', 'İlkay Gündoğan', 'Jamal Musiala', 'Florian Wirtz', 'Kai Havertz', 'Niclas Füllkrug'],
  CUW: ['Eloy Room', 'Leandro Bacuna', 'Jürgen Locadia', 'Cuco Martina', 'Rangelo Janga', 'Brandley Kuwas', 'Juninho Bacuna', 'Gastón Guridi', 'Kenley Jansen', 'Tyrone Conraad', 'Ramiz Zerrouki'],
  CIV: ['Yahia Fofana', 'Serge Aurier', 'Willy Boly', 'Eric Bailly', 'Odilon Kossounou', 'Seko Fofana', 'Franck Kessié', 'Ibrahim Sangaré', 'Nicolas Pépé', 'Sébastien Haller', 'Karim Konaté'],
  ECU: ['Alexander Domínguez', 'Byron Castillo', 'Piero Hincapié', 'Félix Torres', 'William Pacho', 'Moisés Caicedo', 'José Cifuentes', 'Ángel Mena', 'Enner Valencia', 'Gonzalo Plata', 'Kendry Páez'],
  NED: ['Bart Verbruggen', 'Denzel Dumfries', 'Virgil van Dijk', 'Nathan Aké', 'Daley Blind', 'Frenkie de Jong', 'Jordi Cruyff', 'Xavi Simons', 'Cody Gakpo', 'Donyell Malen', 'Memphis Depay'],
  JPN: ['Zion Suzuki', 'Takehiro Tomiyasu', 'Kō Itakura', 'Maya Yoshida', 'Hiroki Sakai', 'Wataru Endō', 'Kaoru Mitoma', 'Ritsu Dōan', 'Takumi Minamino', 'Ayase Ueda', 'Daizen Maeda'],
  SWE: ['Robin Olsen', 'Emil Krafth', 'Victor Lindelöf', 'Isak Hien', 'Ludwig Augustinsson', 'Sebastian Larsson', 'Dejan Kulusevski', 'Emil Forsberg', 'Alexander Isak', 'Viktor Gyökeres', 'Kulusevski'],
  TUN: ['Aymen Dahmen', 'Ali Abdi', 'Montassar Talbi', 'Dylan Bronn', 'Nader Ghandri', 'Aïissa Laïdouni', 'Hannibal Mejbri', 'Anis Ben Slimane', 'Youssef Msakni', 'Seifeddine Jaziri', 'Taha Yassine Khenissi'],
  BEL: ['Koen Casteels', 'Thomas Meunier', 'Wout Faes', 'Arthur Theate', 'Jan Vertonghen', 'Kevin De Bruyne', 'Amadou Onana', 'Youri Tielemans', 'Leandro Trossard', 'Romelu Lukaku', 'Loïs Openda'],
  EGY: ['Mohamed El Shenawy', 'Ahmed Fattouh', 'Mohamed Abdelshafy', 'Omar Gaber', 'Ahmed Hegazi', 'Mohamed Elneny', 'Trezeguet', 'Mostafa Mohamed', 'Mohamed Salah', 'Omar Marmoush', 'Amr Warda'],
  IRN: ['Alireza Beiranvand', 'Sadegh Moharrami', 'Shoja Khalilzadeh', 'Majid Hosseini', 'Milad Mohammadi', 'Saeid Ezatolahi', 'Ahmad Nourollahi', 'Mehdi Taremi', 'Sardar Azmoun', 'Alireza Jahanbakhsh', 'Karim Ansarifard'],
  NZL: ['Oliver Sail', 'Liberato Cacace', 'Nando Pijnaker', 'Michael Boxall', 'Joe Champness', 'Alex Rufer', 'Matthew Ridenton', 'Chris Wood', 'Sarpreet Singh', 'Logan Rogerson', 'Winston Reid'],
  ESP: ['Unai Simón', 'Dani Carvajal', 'Robin Le Normand', 'Aymeric Laporte', 'Álex Grimaldo', 'Rodri', 'Pedri', 'Lamine Yamal', 'Nico Williams', 'Álvaro Morata', 'Ferran Torres'],
  CPV: ['Vozinha', 'Roberto Lopes', 'Steven Fortès', 'Dylan Tavares', 'Jeffren', 'Buckley', 'Stopira', 'Garry Rodrigues', 'Ryan Mendes', 'Jamiro Monteiro', 'Kennedy Bacana'],
  KSA: ['Mohammed Al-Owais', 'Sultan Al-Ghanam', 'Ali Al-Bulaihi', 'Hassan Tambakti', 'Yasser Al-Shahrani', 'Salem Al-Dawsari', 'Firas Al-Buraikan', 'Abdullah Radif', 'Saleh Al-Shehri', 'Mohammed Kanno', 'Nasser Al-Dawsari'],
  URU: ['Sergio Rochet', 'Nahuel Nández', 'Ronald Araújo', 'José Giménez', 'Sebastián Cáceres', 'Manuel Ugarte', 'Federico Valverde', 'Rodrigo Bentancur', 'Darwin Núñez', 'Luis Suárez', 'Facundo Torres'],
  FRA: ['Mike Maignan', 'Jules Koundé', 'William Saliba', 'Dayot Upamecano', 'Theo Hernández', 'Aurélien Tchouaméni', 'N\'Golo Kanté', 'Antoine Griezmann', 'Ousmane Dembélé', 'Kylian Mbappé', 'Randal Kolo Muani'],
  SEN: ['Édouard Mendy', 'Youssouf Sabaly', 'Kalidou Koulibaly', 'Abdou Diallo', 'Fodé Ballo-Touré', 'Iliman Ndiaye', 'Pape Gueye', 'Idrissa Gueye', 'Sadio Mané', 'Boulaye Dia', 'Famara Diédhiou'],
  IRQ: ['Mohammed Hameed', 'Ahmed Yahya', 'Ali Adnan', 'Saad Natiq', 'Ahmed Ibrahim', 'Amjad Atwan', 'Ayman Hussein', 'Aymen Hussein', 'Bashar Bonyan', 'Mohanad Ali', 'Zidane Iqbal'],
  NOR: ['Karl-Johan Johnsen', 'Marcus Holmgren', 'Leo Skiri Østigård', 'Stefan Strandberg', 'Birger Meling', 'Martin Ødegaard', 'Sander Berge', 'Fredrik Aursnes', 'Erling Haaland', 'Alexander Sørloth', 'Odegaard'],
  ARG: ['Emiliano Martínez', 'Nahuel Molina', 'Cristian Romero', 'Lisandro Martínez', 'Nicolás Tagliafico', 'Rodrigo De Paul', 'Enzo Fernández', 'Alexis Mac Allister', 'Lionel Messi', 'Julián Álvarez', 'Lautaro Martínez'],
  ALG: ['Anthony Mandréa', 'Aïssa Mandi', 'Jamal Belahi', 'Ramy Bensebaini', 'Sofiane Hanni', 'Ismaël Bennacer', 'Houssem Aouar', 'Riyad Mahrez', 'Islam Slimani', 'Yacine Brahimi', 'Amine Gouiri'],
  AUT: ['Heinz Lindner', 'Stefan Posch', 'Maximilian Wöber', 'David Alaba', 'Philipp Lienhart', 'Marcel Sabitzer', 'Konrad Laimer', 'Florian Kainz', 'Marko Arnautović', 'Sasa Kalajdzic', 'Christoph Baumgartner'],
  JOR: ['Yazid Abu Laila', 'Anas Bani Yaseen', 'Adnan Al-Sharafat', 'Yousef Al-Naber', 'Ihsan Haddad', 'Nour Al-Rawabdeh', 'Musa Al-Taamari', 'Yaseen Al-Bakhit', 'Hamza Al-Dardour', 'Hazem Jazi', 'Riz Eid'],
  POR: ['Diogo Costa', 'João Cancelo', 'Rúben Dias', 'António Silva', 'Nuno Mendes', 'Bruno Fernandes', 'Bernardo Silva', 'Vitinha', 'João Félix', 'Cristiano Ronaldo', 'Rafael Leão'],
  COD: ['Lionel Wamba', 'Christian Mawissa', 'Henock Inoni', 'Benoît Assou-Ekotto', 'Chancel Mbemba', 'Cédric Makiadi', 'Samuel Eto\'o Jr', 'Yannick Bolasie', 'Dieumerci Mbokani', 'Cédric Bakambu', 'Jonathan Ikone'],
  UZB: ['Utkir Yusupov', 'Nasrullokh Sharipov', 'Eldor Shomurodov', 'Husniddin Aliqulov', 'Dostonbek Tursunov', 'Jasur Jumaev', 'Otabek Shukurov', 'Sardor Rashidov', 'Igor Sergeev', 'Doston Khamdamov', 'Abror Ismailov'],
  COL: ['Camilo Vargas', 'Daniel Muñoz', 'Davinson Sánchez', 'Yerry Mina', 'Johan Mojica', 'Richard Ríos', 'Jefferson Lerma', 'James Rodríguez', 'Luis Díaz', 'Duván Zapata', 'Jhon Durán'],
  ENG: ['Jordan Pickford', 'Kyle Walker', 'John Stones', 'Harry Maguire', 'Luke Shaw', 'Declan Rice', 'Jude Bellingham', 'Phil Foden', 'Harry Kane', 'Bukayo Saka', 'Cole Palmer'],
  CRO: ['Dominik Livaković', 'Joško Gvardiol', 'Dejan Lovren', 'Josip Juranović', 'Borna Sosa', 'Luka Modrić', 'Mateo Kovačić', 'Marcelo Brozović', 'Andrej Kramarić', 'Joško Gvardiol', 'Ivan Perišić'],
  GHA: ['Richard Ofori', 'Tariq Lamptey', 'Daniel Amartey', 'Mohammed Salisu', 'Gideon Mensah', 'Thomas Partey', 'Mohammed Kudus', 'Jordan Ayew', 'Inaki Williams', 'Antoine Semenyo', 'Fatawu Issahaku'],
  PAN: ['Luis Mejía', 'Michael Murillo', 'Andrés Andrade', 'Fidel Escobar', 'Eric Davis', 'Aníbal Godoy', 'Alberto Quintero', 'Adalberto Carrasquilla', 'José Fajardo', 'Ismael Díaz', 'César Yanis'],
};

export type TeamInfo = {
  name: string;
  code: string;
  flag: string;
  groupId: string;
  colors: { primary: string; secondary: string };
  coach: string;
  ranking: number;
  squad: string[];
};

export const teams: Record<string, TeamInfo> = {};

for (const code of Object.keys(nameMap)) {
  teams[code] = {
    name: nameMap[code],
    code,
    flag: `https://flagcdn.com/w80/${countryCodeMap[code]}.png`,
    groupId: groupMap[code],
    colors: colors[code] || { primary: '#333333', secondary: '#ffffff' },
    coach: coaches[code] || '',
    ranking: fifaRanking[code] || 99,
    squad: squads[code] || [],
  };
}

export const getTeam = (id: string): TeamInfo => {
  if (id === 'TBD') return { name: 'Belirlenecek', code: 'TBD', flag: '', groupId: '', colors: { primary: '#666', secondary: '#fff' }, coach: '', ranking: 0, squad: [] };
  return teams[id] || { name: id, code: id, flag: '', groupId: '', colors: { primary: '#333', secondary: '#fff' }, coach: '', ranking: 99, squad: [] };
};

export function getFlagUrl(code: string): string {
  if (code === 'TBD' || !code) return '';
  const cc = countryCodeMap[code];
  if (!cc) return '';
  return `https://flagcdn.com/w80/${cc}.png`;
}