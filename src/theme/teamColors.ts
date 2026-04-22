export interface TeamTheme {
  primaryColor: string;
  secondaryColor: string;
  gradient: string;
  textColor: string;
}

export interface Team {
  id: string;
  name: string;
  colors: TeamTheme;
  badgeUrl: string;
}

export const TEAMS: Team[] = [
  {
    id: 'selecao',
    name: 'Seleção Brasileira',
    colors: {
      primaryColor: '#FDE047', // Amarelo
      secondaryColor: '#16A34A', // Verde
      gradient: 'linear-gradient(135deg, #FDE047 0%, #16A34A 100%)',
      textColor: '#1E3A8A', // Azul
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/pt/2/2b/Confedera%C3%A7%C3%A3o_Brasileira_de_Futebol_2019.svg'
  },
  {
    id: 'flamengo',
    name: 'Flamengo',
    colors: {
      primaryColor: '#C92A2A',
      secondaryColor: '#111111',
      gradient: 'linear-gradient(135deg, #C92A2A 0%, #111111 100%)',
      textColor: '#FFFFFF',
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg'
  },
  {
    id: 'corinthians',
    name: 'Corinthians',
    colors: {
      primaryColor: '#111111',
      secondaryColor: '#FFFFFF',
      gradient: 'linear-gradient(135deg, #111111 0%, #333333 100%)',
      textColor: '#FFFFFF',
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_s%C3%ADmbolo.png'
  },
  {
    id: 'palmeiras',
    name: 'Palmeiras',
    colors: {
      primaryColor: '#006437',
      secondaryColor: '#FFFFFF',
      gradient: 'linear-gradient(135deg, #006437 0%, #004224 100%)',
      textColor: '#FFFFFF',
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg'
  },
  {
    id: 'sao-paulo',
    name: 'São Paulo',
    colors: {
      primaryColor: '#DC2626',
      secondaryColor: '#111111',
      gradient: 'linear-gradient(135deg, #DC2626 0%, #111111 100%)',
      textColor: '#FFFFFF',
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/S%C3%A3o_Paulo_Futebol_Clube.png'
  },
  {
    id: 'vasco',
    name: 'Vasco da Gama',
    colors: {
      primaryColor: '#111111',
      secondaryColor: '#FFFFFF',
      gradient: 'linear-gradient(135deg, #111111 0%, #000000 100%)',
      textColor: '#FFFFFF',
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/pt/a/ac/CRVascodaGama.png'
  },
  {
    id: 'fluminense',
    name: 'Fluminense',
    colors: {
      primaryColor: '#8A1538', // Grená
      secondaryColor: '#005F41', // Verde
      gradient: 'linear-gradient(135deg, #8A1538 0%, #005F41 100%)',
      textColor: '#FFFFFF',
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Fluminense_FC_escudo.png'
  },
  {
    id: 'botafogo',
    name: 'Botafogo',
    colors: {
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      gradient: 'linear-gradient(135deg, #222222 0%, #000000 100%)',
      textColor: '#FFFFFF',
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Botafogo_de_Futebol_e_Regatas_logo.svg'
  },
  {
    id: 'gremio',
    name: 'Grêmio',
    colors: {
      primaryColor: '#0D89D1', // Azul
      secondaryColor: '#111111', // Preto
      gradient: 'linear-gradient(135deg, #0D89D1 0%, #111111 100%)',
      textColor: '#FFFFFF',
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Gremio_logo.svg'
  },
  {
    id: 'internacional',
    name: 'Internacional',
    colors: {
      primaryColor: '#E50000',
      secondaryColor: '#FFFFFF',
      gradient: 'linear-gradient(135deg, #E50000 0%, #990000 100%)',
      textColor: '#FFFFFF',
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg'
  },
  {
    id: 'atletico-mg',
    name: 'Atlético-MG',
    colors: {
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      gradient: 'linear-gradient(135deg, #222222 0%, #000000 100%)',
      textColor: '#FFFFFF',
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Atletico_mineiro_galo.png'
  },
  {
    id: 'cruzeiro',
    name: 'Cruzeiro',
    colors: {
      primaryColor: '#0053A0',
      secondaryColor: '#FFFFFF',
      gradient: 'linear-gradient(135deg, #0053A0 0%, #003666 100%)',
      textColor: '#FFFFFF',
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Cruzeiro_Esporte_Clube_%28logo%29.svg'
  },
  {
    id: 'santos',
    name: 'Santos',
    colors: {
      primaryColor: '#FFFFFF',
      secondaryColor: '#000000',
      gradient: 'linear-gradient(135deg, #FFFFFF 0%, #E5E5E5 100%)',
      textColor: '#111111',
    },
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Santos_Logo.png'
  }
];
