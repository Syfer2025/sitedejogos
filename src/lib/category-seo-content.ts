const GENERIC_FAQ = (category: string) => [
  {
    question: `Os jogos de ${category} sao gratis?`,
    answer: `Sim! Todos os jogos de ${category} no Gasty Games sao 100% gratuitos. Basta acessar pelo navegador e comecar a jogar.`,
  },
  {
    question: `Preciso instalar algo para jogar ${category}?`,
    answer: `Nao. Todos os jogos rodam direto no navegador (Chrome, Firefox, Safari, Edge) sem precisar baixar ou instalar nada.`,
  },
  {
    question: `Posso jogar ${category} no celular?`,
    answer: `Sim! Nossos jogos de ${category} sao responsivos e funcionam em smartphones e tablets, alem de computadores.`,
  },
];

export function getCategorySeoContent(category: string) {
  return {
    title: `Jogos de ${category} Online Gratis - Jogar no Navegador | Gasty Games`,
    h1: `Jogos de ${category} Online Gratis`,
    description: `Jogue os melhores jogos de ${category} online gratis no Gasty Games. Centenas de opcoes em HTML5 direto no navegador para PC e celular!`,
    intro: `Explore nossa colecao de jogos de ${category}, todos gratuitos e prontos para jogar direto no navegador. Sem downloads, sem instalacao — basta clicar e comecar a se divertir. Funciona em PC, tablet e celular.`,
    benefits: [
      "100% gratis, sem downloads",
      "Funciona em qualquer navegador moderno",
      "Compativel com PC, tablet e celular",
      "Novos jogos adicionados regularmente",
      "Avalie e favorite seus jogos preferidos",
    ],
    faq: GENERIC_FAQ(category),
  };
}
