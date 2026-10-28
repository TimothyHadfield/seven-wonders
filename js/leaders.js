/* Leaders module (optional, off by default): 36 leader cards for the 1st-edition Leaders expansion rules.
   Facts only (name, coin cost, effect), checked in docs/rules-check.md ("Leaders"): the published Leaders
   rulebook (effects, rules) + four independent card lists for the costs (3 agree on every cost; Plato 4 by 3 of 4).
   Effect keys (in e): vp, sh, sci, coins (once, on recruiting), per [{of, who:'S', vp}] (end of game),
   tok (vp per victory token), setx (extra vp per science set), sets + setvp (vp per full set of these colours),
   coinvp (vp per 3 coins), disc ('green'|'red'|'blue'|'stage': one resource less), freeLead, freeGuild,
   bank (buy 1 resource a turn from the bank for 1 coin), tradeBack, yellowCoins, chainCoins, winCoins, tomyris, solomon.
   look: the portrait (art.js): [skin, robe, headwear, beard]. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SWLeaders = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const ALL7 = ['brown', 'grey', 'blue', 'yellow', 'red', 'green', 'purple'];
  // [name, cost, effect, one-line text (our words), look]
  const LIST = [
    ['Sappho', 1, { vp: 2 }, '2 points.', ['#e8b98f', '#6f8fc9', 'curls', 0]],
    ['Zenobia', 2, { vp: 3 }, '3 points.', ['#b8835a', '#a0524a', 'diadem', 0]],
    ['Nefertiti', 3, { vp: 4 }, '4 points.', ['#9a6a45', '#2f6f8f', 'tallcrown', 0]],
    ['Cleopatra', 4, { vp: 5 }, '5 points.', ['#b47a50', '#d8c9a3', 'nemesF', 0]],
    ['Caesar', 5, { sh: 2 }, '2 shields.', ['#e2b48c', '#a8322c', 'laurel', 0]],
    ['Hannibal', 2, { sh: 1 }, '1 shield.', ['#a8744c', '#7a4a2a', 'helmet', 1]],
    ['Euclid', 5, { sci: 'compass' }, 'A compass science symbol.', ['#e0b08a', '#4f7f5a', 'bald', 1]],
    ['Ptolemy', 5, { sci: 'tablet' }, 'A tablet science symbol.', ['#d2a07a', '#3f6aa0', 'cap', 1]],
    ['Pythagoras', 5, { sci: 'gear' }, 'A gear science symbol.', ['#e6bc94', '#e9e2cf', 'bald', 1]],
    ['Croesus', 1, { coins: 6 }, 'Take 6 coins when recruited.', ['#d9a77c', '#c99a2e', 'crown', 1]],
    ['Midas', 3, { coinvp: 1, tag: '1 pt / 3¢' }, 'End: 1 more point per 3 coins you hold.', ['#e4b58a', '#d6a93a', 'crown', 0]],
    ['Amytis', 4, { per: [{ of: 'stage', who: 'S', vp: 2 }] }, 'End: 2 points per wonder stage you built.', ['#c99268', '#4e8fb8', 'veil', 0]],
    ['Alexander', 3, { tok: 1, tag: '+1 / victory' }, 'End: each of your victory tokens is worth 1 more.', ['#e7bb90', '#b3402f', 'curlsM', 0]],
    ['Aristotle', 3, { setx: 3, tag: 'Sets +3' }, 'End: each science set (3 different symbols) is worth 10, not 7.', ['#e1b089', '#7c7f8f', 'curlsM', 1]],
    ['Justinian', 3, { sets: ['red', 'blue', 'green'], setvp: 3 }, 'End: 3 points per red + blue + green set in your city.', ['#d9a47b', '#6b3f8f', 'crown', 1]],
    ['Plato', 4, { sets: ALL7, setvp: 7 }, 'End: 7 points per set of all seven card colours in your city.', ['#e3b38c', '#d6cfbf', 'bald', 1]],
    ['Hypatia', 4, { per: [{ of: 'green', who: 'S', vp: 1 }] }, 'End: 1 point per green card.', ['#e2ae86', '#6a9c76', 'bun', 0]],
    ['Nebuchadnezzar', 4, { per: [{ of: 'blue', who: 'S', vp: 1 }] }, 'End: 1 point per blue card.', ['#b9835a', '#2f5f9f', 'tallcap', 1]],
    ['Phidias', 3, { per: [{ of: 'brown', who: 'S', vp: 1 }] }, 'End: 1 point per brown card.', ['#ddaa82', '#8a6a4a', 'curlsM', 1]],
    ['Varro', 3, { per: [{ of: 'yellow', who: 'S', vp: 1 }] }, 'End: 1 point per yellow card.', ['#e4b48c', '#c9a03a', 'short', 0]],
    ['Pericles', 6, { per: [{ of: 'red', who: 'S', vp: 2 }] }, 'End: 2 points per red card.', ['#ddb08a', '#9d342c', 'helmet', 1]],
    ['Praxiteles', 3, { per: [{ of: 'grey', who: 'S', vp: 2 }] }, 'End: 2 points per grey card.', ['#e0ad85', '#8d93a3', 'curlsM', 1]],
    ['Hiram', 3, { per: [{ of: 'purple', who: 'S', vp: 2 }] }, 'End: 2 points per purple guild.', ['#c08a5f', '#6b4b8f', 'hood', 1]],
    ['Archimedes', 4, { disc: 'green', tag: 'Green −1' }, 'Green cards cost 1 resource less (your choice which).', ['#e2b28a', '#3d9a5d', 'bald', 1]],
    ['Leonidas', 2, { disc: 'red', tag: 'Red −1' }, 'Red cards cost 1 resource less (your choice which).', ['#cf9b70', '#b5382e', 'helmet', 1]],
    ['Hammurabi', 2, { disc: 'blue', tag: 'Blue −1' }, 'Blue cards cost 1 resource less (your choice which).', ['#b8855c', '#3f6fb0', 'tallcap', 1]],
    ['Imhotep', 3, { disc: 'stage', tag: 'Stage −1' }, 'Wonder stages cost 1 resource less (your choice which).', ['#a8744c', '#e6dcc0', 'nemes', 0]],
    ['Maecenas', 1, { freeLead: 1, tag: 'Leaders free' }, 'Your later leaders cost no coins.', ['#e3b38c', '#8f6fb0', 'short', 0]],
    ['Ramses', 5, { freeGuild: 1, tag: 'Guilds free' }, 'You build purple guilds without paying their resources.', ['#a06a42', '#d8b24a', 'nemes', 0]],
    ['Bilkis', 4, { bank: 1, tag: 'Bank 1¢' }, 'Once a turn, buy any one resource from the bank for 1 coin.', ['#8f5f3c', '#e0c060', 'diadem', 0]],
    ['Hatshepsut', 2, { tradeBack: 1, tag: 'Trade +1¢' }, 'Each turn you buy from a neighbour, take 1 coin from the bank (per neighbour).', ['#a8744c', '#c9a43a', 'nemesF', 0]],
    ['Xenophon', 2, { yellowCoins: 2, tag: 'Yellow +2¢' }, 'Take 2 coins each time you build a yellow card.', ['#ddaa82', '#b8a070', 'curlsM', 1]],
    ['Vitruvius', 1, { chainCoins: 2, tag: 'Chain +2¢' }, 'Take 2 coins each time you build a card free by a chain.', ['#e4b48c', '#7f8f6f', 'short', 0]],
    ['Nero', 1, { winCoins: 2, tag: 'Win +2¢' }, 'Take 2 coins each time you win a victory token.', ['#e6b892', '#7a2f4a', 'laurel', 0]],
    ['Tomyris', 4, { tomyris: 1, tag: 'Defeats back' }, 'Your defeat tokens go to the neighbour who beat you.', ['#d8a47a', '#7a5a3a', 'fur', 0]],
    ['Solomon', 3, { solomon: 1, tag: 'Discard build' }, 'When recruited, build one card from the discard pile for free.', ['#c48e62', '#5a4a8f', 'crown', 1]],
  ];
  const byKey = {};
  const IDS = [];
  for (const [name, cost, e, text, look] of LIST) {
    byKey[name] = { id: name, name, color: 'white', coin: cost, res: '', e, text, look, to: [], from: [], leader: true };
    IDS.push(name);
  }
  return { IDS, byKey, ALL7 };
});
