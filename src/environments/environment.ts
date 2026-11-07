// Valeurs de production : volontairement neutres. Les valeurs réelles sont injectées par la CI/CD.
// Ne jamais committer de valeur réelle ici.
export const environment = {
  username: 'set-by-ci',
  password: 'set-by-ci',
  // URL syntaxiquement valide (`new WebSocket('set-by-ci')` lèverait une SyntaxError au démarrage) ;
  // le domaine réservé `.invalid` n'existe pas : la connexion échoue proprement jusqu'à l'injection par la CI/CD.
  wsUrl: 'wss://set-by-ci.invalid/ws',
};
