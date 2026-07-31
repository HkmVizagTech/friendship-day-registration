// Single source of truth for everything printed on the poster.
export const EVENT = {
  host: 'Friends of Lord Krishna',
  org: 'Hare Krishna Movement, Visakhapatnam',
  title: 'Friendship',
  titleScript: 'Unlimited',
  kicker: 'Friendship Day Special',
  restriction: 'Boys only · Age Upto 30',
  entry: 'Free entry · Registration required',
  weekday: 'Saturday',
  date: '01 August 2026',
  time: '5:30 PM',
  venue: 'Chaitanya Bhavan',
  address: 'IIM Road, Gambhiram',
  phone: '7075498108',
  highlights: [
    ['Musical evening', 'Perfect Harmony live'],
    ['Games', 'Team rounds, prizes'],
    ['Special talk', 'On real friendship'],
    ['Dinner feast', 'Full prasadam spread'],
  ],
};

export const TIERS = {
  single: { id: 'single', label: 'Just me', heads: 1 },
  duo: { id: 'duo', label: 'Me + a friend', heads: 2 },
};

// Who each attendee's local preaching group is under. Value stored as-is
// in the database and shown as-is everywhere (admin, CSV), so this is the
// single place to edit a name or area.
export const PREACHERS = [
  'Kesava Kripa Dasa (MVP)',
  'Gopeswara Dasa (Kommadi)',
  'Ranveer Rama Dasa (AU)',
  'Shadgoswami Dasa (Anits)',
  'Mukunda Gauranga Dasa (Rushikonda)',
];
