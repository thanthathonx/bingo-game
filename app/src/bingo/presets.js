// Ready-made item lists for event-card bingo. Hosts can edit them freely.

export const PRESETS = [
  {
    id: 'party',
    label: 'Party night',
    items: [
      'Someone spills a drink', 'A song gets skipped', 'Group photo', 'Pizza arrives', 'Someone dances on a chair',
      'Phone battery dies', 'Inside joke retold', 'Someone arrives late', 'Karaoke starts', 'Lost a shoe',
      'Somebody yawns', 'Birthday song', 'A toast is made', 'Pet joins the party', 'Someone says "one more"',
      'Ice runs out', 'Board game comes out', 'Someone falls asleep', 'Wrong lyrics sung loudly', 'Neighbour complains',
      'Selfie with the host', 'Snack bowl empty', 'Someone tells a ghost story', 'Dance-off', 'Plans for next party',
      'Somebody cries laughing', 'Mystery guest', 'Lights get dimmed', 'Someone orders more food', 'Last song of the night',
    ],
  },
  {
    id: 'movie',
    label: 'Movie night',
    items: [
      'Slow-motion hero walk', 'Car chase', '"We have company"', 'Something explodes', 'Training montage',
      'Villain monologue', 'Phone has no signal', 'Plot twist', 'Dramatic rain', 'Someone says the title',
      'Cat jumps out', 'Hacker types fast', 'Kiss in the rain', 'Countdown timer', '"It\'s quiet… too quiet"',
      'Flashback scene', 'Mirror scare', 'Hero loses weapon', 'Heist plan explained', 'Sidekick joke',
      'Door won\'t open', 'Running from a fireball', 'Old mentor appears', 'Surprise cameo', 'Post-credits hint',
      'Someone gets a text', 'Map spread on a table', 'Helicopter shot', 'Fake ending', 'Popcorn runs out',
    ],
  },
  {
    id: 'trip',
    label: 'Road trip',
    items: [
      'Red car', 'Cows in a field', 'Gas station stop', 'Someone asks "are we there yet?"', 'Bridge',
      'Truck honks back', 'Wrong turn', 'Licence plate from far away', 'Road works', 'Wind turbine',
      'Someone naps', 'Snack swap', 'Rest area', 'Horse', 'Billboard with a pun',
      'Tunnel', 'Motorbike', 'Sing-along', 'Rainbow', 'Speed bump',
      'Camper van', 'Lake or river', 'Roundabout', 'Toll booth', 'Bird on a wire',
      'Photo stop', 'Traffic jam', 'Flat landscape', 'Mountain view', 'Ice cream break',
    ],
  },
  {
    id: 'meeting',
    label: 'Office meeting',
    items: [
      '"Can you hear me?"', 'Someone is on mute', 'Dog barks', '"Let\'s take this offline"', 'Screen share fails',
      'Echo on the line', 'Someone joins late', '"Quick question"', 'Coffee refill', '"Circle back"',
      'Kid walks in', 'Frozen video', '"Next slide please"', 'Meeting runs over', 'Someone eats on camera',
      '"Sorry, you go"', 'Wrong window shared', 'Background noise', '"Action items"', 'Calendar invite moved',
      'Someone leaves early', '"Synergy"', '"Can everyone see my screen?"', 'Awkward silence', 'Typing sounds',
      '"Let\'s wrap up"', 'Bad Wi-Fi', 'Cat on keyboard', '"Per my last email"', 'Thumbs-up reaction',
    ],
  },
];

export function presetText(id) {
  const preset = PRESETS.find((p) => p.id === id) ?? PRESETS[0];
  return preset.items.join('\n');
}

export const BUDDY_NAMES = [
  'Mochi', 'Pixel', 'Nova', 'Biscuit', 'Ziggy', 'Luna', 'Taco', 'Bubbles', 'Comet', 'Pickles', 'Sprout',
];

export const BUDDY_COLORS = [
  '#a29bfe', '#55efc4', '#ffd166', '#00d9ff', '#ff9bc0', '#fdcb6e', '#74c7ff', '#b8b2ff', '#6ef0c8', '#ffe08a', '#ff8a8a',
];

export const MAX_BUDDIES = 11;
