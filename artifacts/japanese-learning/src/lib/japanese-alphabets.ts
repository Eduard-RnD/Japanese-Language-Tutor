export interface KanaSymbol {
  symbol: string;
  romaji: string;
}

export interface BasicKanji {
  symbol: string;
  meaning: string;
}

export const hiraganaChart: KanaSymbol[][] = [
  [
    ["あ", "a"],
    ["い", "i"],
    ["う", "u"],
    ["え", "e"],
    ["お", "o"],
  ],
  [
    ["か", "ka"],
    ["き", "ki"],
    ["く", "ku"],
    ["け", "ke"],
    ["こ", "ko"],
  ],
  [
    ["さ", "sa"],
    ["し", "shi"],
    ["す", "su"],
    ["せ", "se"],
    ["そ", "so"],
  ],
  [
    ["た", "ta"],
    ["ち", "chi"],
    ["つ", "tsu"],
    ["て", "te"],
    ["と", "to"],
  ],
  [
    ["な", "na"],
    ["に", "ni"],
    ["ぬ", "nu"],
    ["ね", "ne"],
    ["の", "no"],
  ],
  [
    ["は", "ha"],
    ["ひ", "hi"],
    ["ふ", "fu"],
    ["へ", "he"],
    ["ほ", "ho"],
  ],
  [
    ["ま", "ma"],
    ["み", "mi"],
    ["む", "mu"],
    ["め", "me"],
    ["も", "mo"],
  ],
  [
    ["や", "ya"],
    ["ゆ", "yu"],
    ["よ", "yo"],
  ],
  [
    ["ら", "ra"],
    ["り", "ri"],
    ["る", "ru"],
    ["れ", "re"],
    ["ろ", "ro"],
  ],
  [
    ["わ", "wa"],
    ["を", "wo"],
    ["ん", "n"],
  ],
].map((row) => row.map(([symbol, romaji]) => ({ symbol, romaji })));

export const katakanaChart: KanaSymbol[][] = [
  [
    ["ア", "a"],
    ["イ", "i"],
    ["ウ", "u"],
    ["エ", "e"],
    ["オ", "o"],
  ],
  [
    ["カ", "ka"],
    ["キ", "ki"],
    ["ク", "ku"],
    ["ケ", "ke"],
    ["コ", "ko"],
  ],
  [
    ["サ", "sa"],
    ["シ", "shi"],
    ["ス", "su"],
    ["セ", "se"],
    ["ソ", "so"],
  ],
  [
    ["タ", "ta"],
    ["チ", "chi"],
    ["ツ", "tsu"],
    ["テ", "te"],
    ["ト", "to"],
  ],
  [
    ["ナ", "na"],
    ["ニ", "ni"],
    ["ヌ", "nu"],
    ["ネ", "ne"],
    ["ノ", "no"],
  ],
  [
    ["ハ", "ha"],
    ["ヒ", "hi"],
    ["フ", "fu"],
    ["ヘ", "he"],
    ["ホ", "ho"],
  ],
  [
    ["マ", "ma"],
    ["ミ", "mi"],
    ["ム", "mu"],
    ["メ", "me"],
    ["モ", "mo"],
  ],
  [
    ["ヤ", "ya"],
    ["ユ", "yu"],
    ["ヨ", "yo"],
  ],
  [
    ["ラ", "ra"],
    ["リ", "ri"],
    ["ル", "ru"],
    ["レ", "re"],
    ["ロ", "ro"],
  ],
  [
    ["ワ", "wa"],
    ["ヲ", "wo"],
    ["ン", "n"],
  ],
].map((row) => row.map(([symbol, romaji]) => ({ symbol, romaji })));

export const basicKanji: BasicKanji[] = [
  { symbol: "日", meaning: "sun/day" },
  { symbol: "月", meaning: "moon/month" },
  { symbol: "火", meaning: "fire" },
  { symbol: "水", meaning: "water" },
  { symbol: "木", meaning: "tree" },
  { symbol: "金", meaning: "gold/money" },
  { symbol: "土", meaning: "earth" },
  { symbol: "人", meaning: "person" },
  { symbol: "山", meaning: "mountain" },
  { symbol: "川", meaning: "river" },
  { symbol: "口", meaning: "mouth" },
  { symbol: "目", meaning: "eye" },
  { symbol: "耳", meaning: "ear" },
  { symbol: "手", meaning: "hand" },
  { symbol: "足", meaning: "foot" },
  { symbol: "大", meaning: "big" },
  { symbol: "小", meaning: "small" },
  { symbol: "上", meaning: "up" },
  { symbol: "下", meaning: "down" },
  { symbol: "中", meaning: "middle" },
];
