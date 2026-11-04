export function cardDisplayUrl(game) {
  return `${import.meta.env.BASE_URL}office/card-game.html#game=${game.presentationKey}`;
}

export function replayCardGame(game) {
  const url = `${cardDisplayUrl(game)}&run=${crypto.randomUUID()}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
