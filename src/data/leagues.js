// Datos de ligas y clubes. Para agregar más ligas o clubes, solo añade entradas aquí.
// rating: fuerza del club (0-100). rival: nombre de su clásico (debe existir en la misma liga).
const c = (name, rating, rival = null) => ({ name, rating, rival });

export const LEAGUES = [
  {
    id: 'col', name: 'Liga BetPlay', country: 'Colombia', flag: '🇨🇴',
    clubs: [
      c('Atlético Nacional', 72), c('Millonarios', 71, 'Independiente Santa Fe'), c('Junior', 70),
      c('América de Cali', 68, 'Deportivo Cali'), c('Deportes Tolima', 67), c('Once Caldas', 64),
      c('Independiente Santa Fe', 66, 'Millonarios'), c('Deportivo Cali', 65, 'América de Cali'),
    ],
  },
  {
    id: 'esp', name: 'LaLiga', country: 'España', flag: '🇪🇸',
    clubs: [
      c('Real Madrid', 90, 'FC Barcelona'), c('FC Barcelona', 88, 'Real Madrid'), c('Atlético de Madrid', 84),
      c('Athletic Club', 78), c('Villarreal', 76), c('Real Betis', 75), c('Valencia', 73), c('Getafe', 68),
    ],
  },
  {
    id: 'eng', name: 'Premier League', country: 'Inglaterra', flag: '🏴',
    clubs: [
      c('Manchester City', 90, 'Manchester United'), c('Arsenal', 89, 'Tottenham'), c('Liverpool', 88),
      c('Chelsea', 83), c('Manchester United', 82, 'Manchester City'), c('Tottenham', 81, 'Arsenal'),
      c('Newcastle', 80), c('Brighton', 74),
    ],
  },
  {
    id: 'ita', name: 'Serie A', country: 'Italia', flag: '🇮🇹',
    clubs: [
      c('Inter', 86, 'Milan'), c('Juventus', 84), c('Milan', 84, 'Inter'), c('Napoli', 83),
      c('Atalanta', 79), c('Roma', 79, 'Lazio'), c('Lazio', 77, 'Roma'), c('Fiorentina', 74),
    ],
  },
  {
    id: 'ger', name: 'Bundesliga', country: 'Alemania', flag: '🇩🇪',
    clubs: [
      c('Bayern Múnich', 89, 'Borussia Dortmund'), c('Bayer Leverkusen', 84), c('Borussia Dortmund', 83, 'Bayern Múnich'),
      c('RB Leipzig', 82), c('Stuttgart', 76), c('Eintracht Frankfurt', 75), c('Wolfsburgo', 71), c('Mainz', 68),
    ],
  },
  {
    id: 'fra', name: 'Ligue 1', country: 'Francia', flag: '🇫🇷',
    clubs: [
      c('Paris Saint-Germain', 87, 'Marsella'), c('Marsella', 79, 'Paris Saint-Germain'), c('Mónaco', 78),
      c('Lille', 76), c('Lyon', 76), c('Niza', 73), c('Lens', 72), c('Rennes', 72),
    ],
  },
  {
    id: 'por', name: 'Primeira Liga', country: 'Portugal', flag: '🇵🇹',
    clubs: [
      c('Sporting CP', 81, 'Benfica'), c('Benfica', 80, 'Sporting CP'), c('Porto', 80), c('Braga', 74),
      c('Vitória SC', 68), c('Famalicão', 65), c('Gil Vicente', 64), c('Estoril', 63),
    ],
  },
  {
    id: 'bra', name: 'Brasileirão', country: 'Brasil', flag: '🇧🇷',
    clubs: [
      c('Palmeiras', 79, 'Corinthians'), c('Flamengo', 78, 'Fluminense'), c('Botafogo', 75),
      c('São Paulo', 73), c('Atlético Mineiro', 73), c('Corinthians', 72, 'Palmeiras'),
      c('Fluminense', 72, 'Flamengo'), c('Grêmio', 70),
    ],
  },
  {
    id: 'arg', name: 'Liga Profesional', country: 'Argentina', flag: '🇦🇷',
    clubs: [
      c('River Plate', 76, 'Boca Juniors'), c('Boca Juniors', 76, 'River Plate'), c('Racing Club', 70),
      c('Estudiantes', 69), c('Vélez Sarsfield', 68), c('Independiente', 66), c('San Lorenzo', 66), c('Talleres', 66),
    ],
  },
  {
    id: 'ned', name: 'Eredivisie', country: 'Países Bajos', flag: '🇳🇱',
    clubs: [
      c('PSV', 79), c('Feyenoord', 77, 'Ajax'), c('Ajax', 76, 'Feyenoord'), c('AZ Alkmaar', 71),
      c('Twente', 68), c('Utrecht', 65), c('Heerenveen', 62), c('Go Ahead Eagles', 60),
    ],
  },
  {
    id: 'mex', name: 'Liga MX', country: 'México', flag: '🇲🇽',
    clubs: [
      c('Club América', 76, 'Chivas'), c('Tigres', 74), c('Monterrey', 74), c('Chivas', 72, 'Club América'),
      c('Cruz Azul', 72), c('Toluca', 70), c('Pumas', 68), c('Santos Laguna', 62),
    ],
  },
  {
    id: 'usa', name: 'MLS', country: 'Estados Unidos', flag: '🇺🇸',
    clubs: [
      c('Inter Miami', 72), c('LAFC', 71, 'LA Galaxy'), c('LA Galaxy', 70, 'LAFC'), c('Seattle Sounders', 69),
      c('Columbus Crew', 68), c('Atlanta United', 66), c('New York Red Bulls', 64), c('Toronto FC', 60),
    ],
  },
  {
    id: 'sau', name: 'Saudi Pro League', country: 'Arabia Saudita', flag: '🇸🇦',
    clubs: [
      c('Al-Hilal', 76, 'Al-Nassr'), c('Al-Nassr', 75, 'Al-Hilal'), c('Al-Ittihad', 73), c('Al-Ahli', 72),
      c('Al-Shabab', 66), c('Al-Ettifaq', 64), c('Al-Fateh', 60), c('Damac', 58),
    ],
  },
  {
    id: 'tur', name: 'Süper Lig', country: 'Turquía', flag: '🇹🇷',
    clubs: [
      c('Galatasaray', 77, 'Fenerbahçe'), c('Fenerbahçe', 77, 'Galatasaray'), c('Beşiktaş', 72),
      c('Trabzonspor', 68), c('Başakşehir', 65), c('Sivasspor', 60), c('Antalyaspor', 60), c('Kayserispor', 58),
    ],
  },
];

export const getLeague = (id) => LEAGUES.find((l) => l.id === id);

export const allClubs = () =>
  LEAGUES.flatMap((l) =>
    l.clubs.map((cl) => ({ ...cl, leagueId: l.id, leagueName: l.name, country: l.country, flag: l.flag }))
  );
