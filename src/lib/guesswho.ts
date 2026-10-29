// Guess Who?: the computer hides one Bible character among the cards and the
// child asks yes / no questions about what they look like until only one card
// is left standing. Portraits are cut from the story paintings by
// scripts/make-guesswho.py; what each one shows is listed by hand below.
import type { DifficultyId } from "./puzzles";
import type { Lang } from "./translations";
import { LANGS } from "./translations";
import { findStory, type Story } from "./stories";
import { wordName } from "./seek-words";

const PORTRAITS = import.meta.glob("../assets/guesswho/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export type Trait = "woman" | "beard" | "white" | "covered" | "crown" | "child" | "old";

// The questions, in the order they are offered, with an emoji for each.
export const QUESTIONS: { trait: Trait; emoji: string }[] = [
  { trait: "woman", emoji: "👩" },
  { trait: "child", emoji: "🧒" },
  { trait: "beard", emoji: "🧔" },
  { trait: "white", emoji: "👴" },
  { trait: "covered", emoji: "🧕" },
  { trait: "crown", emoji: "👑" },
  { trait: "old", emoji: "📜" },
];

export interface Character {
  id: string;
  image: string;
  story: Story;
  traits: Set<Trait>; // "old" = from the Old Testament
}

// id -> story it comes from, and what the portrait shows.
const LIST: [id: string, story: string, traits: Trait[]][] = [
  ["jesus", "good-shepherd", ["beard"]],
  ["boy-jesus", "boy-temple", ["child"]],
  ["mary", "nativity", ["woman", "covered"]],
  ["joseph", "nativity", ["beard"]],
  ["gabriel", "annunciation", []],
  ["john", "baptism-jesus", ["beard"]],
  ["peter", "washes-feet", ["beard"]],
  ["zacchaeus", "zacchaeus", ["beard", "covered"]],
  ["martha", "mary-martha", ["woman", "covered"]],
  ["mary-bethany", "mary-martha", ["woman", "covered"]],
  ["samaritan", "good-samaritan", ["beard", "covered"]],
  ["father", "prodigal-son", ["beard", "white", "covered"]],
  ["adam", "adam-animals", ["old"]],
  ["noah", "noahs-ark", ["beard", "white", "covered", "old"]],
  ["abraham", "abraham-stars", ["beard", "white", "covered", "old"]],
  ["young-joseph", "joseph-coat", ["child", "old"]],
  ["moses", "burning-bush", ["beard", "covered", "old"]],
  ["gideon", "gideon-fleece", ["beard", "covered", "old"]],
  ["ruth", "ruth-fields", ["woman", "covered", "old"]],
  ["naomi", "ruth-fields", ["woman", "white", "covered", "old"]],
  ["orpah", "ruth-fields", ["woman", "covered", "old"]],
  ["samuel", "samuel-call", ["child", "old"]],
  ["david", "david-shepherd", ["child", "old"]],
  ["goliath", "david-goliath", ["beard", "covered", "crown", "old"]],
  ["elijah", "elijah-ravens", ["beard", "white", "old"]],
  ["jonah", "jonah-fish", ["beard", "old"]],
  ["daniel", "daniel-lions", ["beard", "old"]],
  ["esther", "queen-esther", ["woman", "covered", "crown", "old"]],
];

export const CHARACTERS: Character[] = LIST.flatMap(([id, slug, traits]) => {
  const image = PORTRAITS[`../assets/guesswho/${id}.webp`];
  const story = findStory(slug);
  return image && story ? [{ id, image, story, traits: new Set(traits) }] : [];
});

// Names for the characters who aren't simply a word in seek-words.ts.
const NAMES: Record<string, string[]> = {
  "boy-jesus": [
    "Jesus as a boy",
    "Jesús niño",
    "Der junge Jesus",
    "Jésus enfant",
    "Gesù ragazzo",
    "Jesus menino",
    "Jezus jako chłopiec",
    "Отрок Иисус",
    "少年イエスさま",
    "소년 예수님",
    "يسوع الصبي",
    "Çocuk İsa",
  ],
  gabriel: [
    "Angel Gabriel",
    "Ángel Gabriel",
    "Engel Gabriel",
    "Ange Gabriel",
    "Angelo Gabriele",
    "Anjo Gabriel",
    "Anioł Gabriel",
    "Ангел Гавриил",
    "天使ガブリエル",
    "가브리엘 천사",
    "الملاك جبرائيل",
    "Cebrail Melek",
  ],
  john: [
    "John the Baptist",
    "Juan el Bautista",
    "Johannes der Täufer",
    "Jean-Baptiste",
    "Giovanni Battista",
    "João Batista",
    "Jan Chrzciciel",
    "Иоанн Креститель",
    "バプテスマのヨハネ",
    "세례 요한",
    "يوحنا المعمدان",
    "Vaftizci Yahya",
  ],
  "mary-bethany": [
    "Mary of Bethany",
    "María de Betania",
    "Maria von Betanien",
    "Marie de Béthanie",
    "Maria di Betania",
    "Maria de Betânia",
    "Maria z Betanii",
    "Мария из Вифании",
    "ベタニアのマリア",
    "베다니의 마리아",
    "مريم أخت مرثا",
    "Beytanyalı Meryem",
  ],
  samaritan: [
    "The Good Samaritan",
    "El buen samaritano",
    "Der barmherzige Samariter",
    "Le bon Samaritain",
    "Il buon Samaritano",
    "O bom samaritano",
    "Miłosierny Samarytanin",
    "Добрый самарянин",
    "よいサマリア人",
    "선한 사마리아인",
    "السامري الصالح",
    "İyi Samiriyeli",
  ],
  father: [
    "The prodigal son's father",
    "El padre del hijo pródigo",
    "Der Vater des verlorenen Sohnes",
    "Le père du fils prodigue",
    "Il padre del figliol prodigo",
    "O pai do filho pródigo",
    "Ojciec syna marnotrawnego",
    "Отец блудного сына",
    "放蕩息子の父",
    "탕자의 아버지",
    "أبو الابن الضال",
    "Müsrif oğulun babası",
  ],
  "young-joseph": [
    "Joseph, son of Jacob",
    "José, hijo de Jacob",
    "Josef, Sohn Jakobs",
    "Joseph, fils de Jacob",
    "Giuseppe, figlio di Giacobbe",
    "José, filho de Jacó",
    "Józef, syn Jakuba",
    "Иосиф, сын Иакова",
    "ヤコブの子ヨセフ",
    "야곱의 아들 요셉",
    "يوسف بن يعقوب",
    "Yakup'un oğlu Yusuf",
  ],
};

export function characterName(c: Character, lang: Lang): string {
  const i = LANGS.findIndex((l) => l.id === lang);
  return NAMES[c.id]?.[Math.max(0, i)] ?? wordName(c.id, lang);
}

export const CHARACTER_COUNTS: Record<DifficultyId, number> = {
  easy: 6,
  "easy-medium": 9,
  medium: 12,
  "medium-hard": 16,
  hard: 20,
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The cards for one game and the one the computer is hiding.
export function dealCards(level: DifficultyId): { cards: Character[]; secret: Character } {
  const cards = shuffle(CHARACTERS).slice(0, CHARACTER_COUNTS[level]);
  return { cards, secret: cards[Math.floor(Math.random() * cards.length)] };
}

// Halving the cards with every question finds anyone in log2(n) questions;
// a couple more than that still earns two stars.
export function guessStars(cost: number, cards: number): number {
  const best = Math.ceil(Math.log2(cards));
  return cost <= best ? 3 : cost <= best + 2 ? 2 : 1;
}
