// Activity IDs and their metadata
export type ActivityId =
  | 'whiteboard'
  | 'pictionary'
  | 'wordguess'
  | 'trivia'
  | 'watchparty'
  | 'tictactoe'
  | 'chess'
  | 'rps'

export interface ActivityConfig {
  id: ActivityId
  label: string
  description: string
  minPlayers: number
  maxPlayers: number
  category: 'creative' | 'games' | 'media'
  color: string      // Tailwind-compatible class or hex
  iconName: string   // Lucide icon name
}

export const ACTIVITIES: ActivityConfig[] = [
  {
    id: 'whiteboard',
    label: 'Whiteboard',
    description: 'Freehand canvas — draw together in real time',
    minPlayers: 1,
    maxPlayers: 20,
    category: 'creative',
    color: '#00f2ff',
    iconName: 'PenTool',
  },
  {
    id: 'pictionary',
    label: 'Pictionary',
    description: 'One draws, others guess — turns, timer, scores',
    minPlayers: 2,
    maxPlayers: 12,
    category: 'games',
    color: '#f59e0b',
    iconName: 'Paintbrush',
  },
  {
    id: 'wordguess',
    label: 'Word Guess',
    description: 'Shared Wordle — race to crack the 5-letter word',
    minPlayers: 1,
    maxPlayers: 20,
    category: 'games',
    color: '#22c55e',
    iconName: 'TextCursor',
  },
  {
    id: 'trivia',
    label: 'Trivia',
    description: '10 timed questions, live leaderboard',
    minPlayers: 1,
    maxPlayers: 20,
    category: 'games',
    color: '#a855f7',
    iconName: 'BrainCircuit',
  },
  {
    id: 'watchparty',
    label: 'Watch Party',
    description: 'Sync YouTube videos + queue up to 10',
    minPlayers: 1,
    maxPlayers: 20,
    category: 'media',
    color: '#ef4444',
    iconName: 'Clapperboard',
  },
  {
    id: 'tictactoe',
    label: 'Tic Tac Toe',
    description: '2-player classic — spectators watch & chat',
    minPlayers: 2,
    maxPlayers: 2,
    category: 'games',
    color: '#3b82f6',
    iconName: 'Hash',
  },
  {
    id: 'chess',
    label: 'Chess',
    description: '2-player chess — spectators welcome',
    minPlayers: 2,
    maxPlayers: 2,
    category: 'games',
    color: '#e2e8f0',
    iconName: 'Crown',
  },
  {
    id: 'rps',
    label: 'Rock Paper Scissors',
    description: 'Best of 5, simultaneous reveal',
    minPlayers: 2,
    maxPlayers: 2,
    category: 'games',
    color: '#f97316',
    iconName: 'Scissors',
  },
]

// Room templates
export interface RoomTemplate {
  id: string
  name: string
  description: string
  defaultActivity: ActivityId
  badge: string
  gradient: string
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start fresh — pick any activity',
    defaultActivity: 'whiteboard',
    badge: 'Open',
    gradient: 'from-[#00f2ff]/20 to-[#051424]',
  },
  {
    id: 'game-night',
    name: 'Game Night',
    description: 'Jump straight into competitive fun',
    defaultActivity: 'trivia',
    badge: 'Games',
    gradient: 'from-[#a855f7]/20 to-[#051424]',
  },
  {
    id: 'watch-party',
    name: 'Watch Party',
    description: 'Sync a YouTube video for everyone',
    defaultActivity: 'watchparty',
    badge: 'Media',
    gradient: 'from-[#ef4444]/20 to-[#051424]',
  },
  {
    id: 'study-lounge',
    name: 'Study Lounge',
    description: 'Collaborative whiteboard + chill',
    defaultActivity: 'whiteboard',
    badge: 'Focus',
    gradient: 'from-[#22c55e]/20 to-[#051424]',
  },
]

// Trivia questions bank
export const TRIVIA_QUESTIONS = [
  { q: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Core Processing Utility', 'Central Program Uplink'], answer: 0 },
  { q: 'Which language runs in a web browser?', options: ['Python', 'Java', 'JavaScript', 'C++'], answer: 2 },
  { q: 'What does HTTP stand for?', options: ['Hyper Transfer Text Protocol', 'HyperText Transfer Protocol', 'High Transfer Text Protocol', 'Hyper Thread Transfer Protocol'], answer: 1 },
  { q: 'Who invented the World Wide Web?', options: ['Bill Gates', 'Steve Jobs', 'Linus Torvalds', 'Tim Berners-Lee'], answer: 3 },
  { q: 'What is the name of a pixel\'s three color channels?', options: ['Red Green Blue', 'Red Gold Bronze', 'Raw Generated Bits', 'Raster Grid Block'], answer: 0 },
  { q: 'In chess, how does a knight move?', options: ['Diagonally', 'Straight lines only', 'L-shape', 'Any direction one square'], answer: 2 },
  { q: 'What planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Saturn', 'Mars'], answer: 3 },
  { q: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1 },
  { q: 'What does "RAM" stand for?', options: ['Random Access Memory', 'Read After Memory', 'Random Application Module', 'Rapid Access Medium'], answer: 0 },
  { q: 'Which company makes the iPhone?', options: ['Samsung', 'Google', 'Apple', 'Sony'], answer: 2 },
  { q: 'What is the chemical symbol for water?', options: ['WA', 'H2O', 'HO2', 'O2H'], answer: 1 },
  { q: 'What year was the first iPhone released?', options: ['2005', '2006', '2007', '2008'], answer: 2 },
  { q: 'How many players are on a standard soccer team?', options: ['9', '10', '11', '12'], answer: 2 },
  { q: 'What is the fastest land animal?', options: ['Lion', 'Cheetah', 'Horse', 'Greyhound'], answer: 1 },
  { q: 'What language is primarily used for machine learning?', options: ['Ruby', 'Swift', 'Python', 'COBOL'], answer: 2 },
]

// Wordle word list
export const WORD_LIST = [
  'REACT', 'NEXUS', 'BOARD', 'GAMES', 'PARTY', 'WATCH', 'GUESS', 'WORDS',
  'MAGIC', 'LINKS', 'THINK', 'BRAVE', 'CRANE', 'FLAME', 'GLARE', 'HOUSE',
  'JOKER', 'KNACK', 'LIGHT', 'MANOR', 'NIGHT', 'OCEAN', 'PLACE', 'QUEEN',
  'RIDER', 'SHORE', 'TIGER', 'UNION', 'VAPOR', 'WATER', 'XENON', 'YACHT',
  'ZEBRA', 'ACTOR', 'BLAZE', 'CLAIM', 'DRIVE', 'EAGLE', 'FEVER', 'GRACE',
]

// Pictionary word list
export const PICTIONARY_WORDS = [
  'airplane', 'apple', 'astronaut', 'backpack', 'banana', 'beach', 'bicycle',
  'bridge', 'butterfly', 'camera', 'candle', 'castle', 'cat', 'chair',
  'clock', 'cloud', 'coffee', 'compass', 'crown', 'diamond', 'dinosaur',
  'dog', 'dragon', 'elephant', 'fire', 'flower', 'football', 'ghost',
  'glasses', 'guitar', 'hammer', 'hat', 'helicopter', 'house', 'island',
  'jellyfish', 'keyboard', 'kite', 'lamp', 'lighthouse', 'lion', 'moon',
  'mountain', 'mushroom', 'octopus', 'painting', 'penguin', 'piano', 'pizza',
  'planet', 'rainbow', 'rocket', 'shark', 'ship', 'skull', 'snowflake',
  'spider', 'star', 'submarine', 'suitcase', 'sun', 'sword', 'telescope',
  'tiger', 'tornado', 'tree', 'trophy', 'turtle', 'umbrella', 'volcano',
  'whale', 'witch', 'wizard', 'wolf',
]
