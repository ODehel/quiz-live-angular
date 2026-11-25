/**
 * Adresse du serveur affichée à l'utilisateur, tirée de `wsUrl` : `hôte:port`, sans schéma ni chemin
 * (`ws://localhost:3000/ws` donne `localhost:3000`). Un port implicite (`URL.port` vide) est omis.
 * Quand `wsUrl` n'est pas une URL exploitable (aucun hôte à extraire), la valeur brute est rendue telle quelle.
 */
export function serverAddress(wsUrl: string): string {
  try {
    const { host } = new URL(wsUrl);
    return host === '' ? wsUrl : host;
  } catch {
    return wsUrl;
  }
}
