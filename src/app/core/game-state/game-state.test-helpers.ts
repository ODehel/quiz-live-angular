/**
 * `game_state_sync` complet (US-ANG-001 CA-20), tel que le décrit le CDC : un seul buzzer connecté par défaut.
 * Renvoie l'objet ; la spec du service le passe en JSON, celle du câblage le sérialise elle-même sur la socket.
 */
export const fullSync = (changes: Record<string, unknown> = {}): Record<string, unknown> => ({
  type: 'game_state_sync',
  game_id: 'game-1',
  status: 'OPEN',
  question_index: 2,
  quiz_id: 'quiz-1',
  participants: [{ order: 1, name: 'Alice', cumulative_score: 30 }],
  connected_buzzers: ['quiz_buzzer_01'],
  ...changes,
});
