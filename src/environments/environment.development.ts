// Valeurs de développement local : non secrètes, alignées sur le hub (quiz-live-server).
// Le hub seede l'utilisateur « admin » ; son mot de passe vient de ADMIN_PASSWORD dans le .env local du hub,
// à fixer à la même valeur que ci-dessous (convention hors code : rien ne la garantit).
// Remplace environment.ts via fileReplacements (configuration "development" d'angular.json).
export const environment = {
  username: 'admin',
  password: 'dev-password',
};
