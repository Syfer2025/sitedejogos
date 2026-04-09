const fs = require('fs');

const pt = JSON.parse(fs.readFileSync('src/messages/pt-BR.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/messages/en-US.json', 'utf8'));

const newKeys = {
  "catalog": {
    "title": "Catálogo",
    "searchMode": "modo busca",
    "searchPrefix": "busca",
    "themePrefix": "tema",
    "clearFilter": "limpar filtro",
    "noGamesFound": "Nenhum jogo encontrado.",
    "games": "jogos",
    "loadingMoreThemes": "Carregando mais...",
    "loadMoreGames": "Carregar mais",
    "loadMoreThemes": "Carregar mais temas",
    "allThemesLoaded": "Todos os temas foram carregados.",
    "activeSearchLabel": "busca ativa",
    "activeThemeLabel": "tema ativo",
    "fullCatalog": "Catálogo Completo",
    "searchPlaceholder": "Buscar jogos...",
    "sortPopular": "Popular",
    "sortNewest": "Novos",
    "filteringBy": "Filtrando por:",
    "views": "views"
  },
  "share": {
    "copied": "Copiado!",
    "share": "Compartilhar"
  },
  "favorites": {
    "error": "Erro ao atualizar",
    "networkError": "Não foi possível atualizar",
    "favorited": "Favoritado",
    "addToFavorites": "Adicionar"
  }
};

const newKeysEn = {
  "catalog": {
    "title": "Catalog",
    "searchMode": "search mode",
    "searchPrefix": "search",
    "themePrefix": "theme",
    "clearFilter": "clear filter",
    "noGamesFound": "No games found.",
    "games": "games",
    "loadingMoreThemes": "Loading more...",
    "loadMoreGames": "Load more",
    "loadMoreThemes": "Load more themes",
    "allThemesLoaded": "All themes loaded.",
    "activeSearchLabel": "active search",
    "activeThemeLabel": "active theme",
    "fullCatalog": "Full Catalog",
    "searchPlaceholder": "Search games...",
    "sortPopular": "Popular",
    "sortNewest": "Newest",
    "filteringBy": "Filtering by:",
    "views": "views"
  },
  "share": {
    "copied": "Copied!",
    "share": "Share"
  },
  "favorites": {
    "error": "Error updating",
    "networkError": "Could not update",
    "favorited": "Favorited",
    "addToFavorites": "Add to favorites"
  }
};

function merge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object') {
      if (!target[key]) target[key] = {};
      merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

merge(pt, newKeys);
merge(en, newKeysEn);

fs.writeFileSync('src/messages/pt-BR.json', JSON.stringify(pt, null, 2));
fs.writeFileSync('src/messages/en-US.json', JSON.stringify(en, null, 2));

console.log('Dictionaries updated!');
