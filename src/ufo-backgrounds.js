export const UFO_BACKGROUNDS = ['sunset', 'cosmic', 'forest'];
export function nextUfoBackground(previous, random = Math.random) {
  const choices = UFO_BACKGROUNDS.filter(name => name !== previous);
  return choices[Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))];
}
export function backgroundUrl(name, base = import.meta.env.BASE_URL) {
  return `${base}ufo/background-${UFO_BACKGROUNDS.includes(name) ? name : UFO_BACKGROUNDS[0]}.webp`;
}
