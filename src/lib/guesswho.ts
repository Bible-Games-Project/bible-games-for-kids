// Who am I?: the computer hides one Bible character among the cards and
// the child asks yes / no questions about what they look like until only one
// card is left standing. Two players can race, each looking for their own
// hidden character. Portraits are cut from the story paintings by
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

// What a question asks about. "old" = from the Old Testament; "white" =
// white or grey hair; "covered" = anything on the head; "down" = looking
// down or eyes closed.
export type Trait =
  | "woman"
  | "child"
  | "beard"
  | "white"
  | "covered"
  | "veil"
  | "headband"
  | "crown"
  | "blue"
  | "red"
  | "smile"
  | "up"
  | "down"
  | "hand"
  | "fur"
  | "angel"
  | "old";

// The questions, in the order they are offered, with an emoji for each.
export const QUESTIONS: { trait: Trait; emoji: string }[] = [
  { trait: "woman", emoji: "👩" },
  { trait: "child", emoji: "🧒" },
  { trait: "beard", emoji: "🧔" },
  { trait: "white", emoji: "👴" },
  { trait: "covered", emoji: "🧕" },
  { trait: "veil", emoji: "🧣" },
  { trait: "headband", emoji: "🎗️" },
  { trait: "crown", emoji: "👑" },
  { trait: "blue", emoji: "🔵" },
  { trait: "red", emoji: "🔴" },
  { trait: "smile", emoji: "😊" },
  { trait: "up", emoji: "👆" },
  { trait: "down", emoji: "👇" },
  { trait: "hand", emoji: "✋" },
  { trait: "fur", emoji: "🐑" },
  { trait: "angel", emoji: "👼" },
  { trait: "old", emoji: "📜" },
];

export interface Character {
  id: string;
  image: string;
  story: Story;
  traits: Set<Trait>;
}

// id -> story it comes from, and what the portrait shows.
const LIST: [id: string, story: string, traits: string][] = [
  ["jesus", "good-shepherd", "beard red smile"],
  ["boy-jesus", "boy-temple", "child blue up"],
  ["mary", "nativity", "woman covered veil red smile down"],
  ["joseph", "nativity", "beard red down"],
  ["gabriel", "annunciation", "angel"],
  ["john", "baptism-jesus", "beard fur"],
  ["peter", "washes-feet", "beard down"],
  ["zacchaeus", "zacchaeus", "beard covered headband red"],
  ["martha", "mary-martha", "woman covered veil red"],
  ["mary-bethany", "mary-martha", "woman covered veil blue up hand"],
  ["samaritan", "good-samaritan", "beard covered headband red smile down"],
  ["father", "prodigal-son", "beard white covered headband red smile hand"],
  ["cleopas", "emmaus", "beard blue"],
  ["sower", "sower-seed", "beard red"],
  ["temple-teacher", "boy-temple", "beard white covered red hand"],
  ["adam", "adam-animals", "smile old"],
  ["noah", "noahs-ark", "beard white covered headband smile up old"],
  ["abraham", "abraham-stars", "beard white covered headband red smile up old"],
  ["young-joseph", "joseph-coat", "child smile blue red old"],
  ["moses", "burning-bush", "beard covered headband red old"],
  ["gideon", "gideon-fleece", "beard covered headband red down old"],
  ["ruth", "ruth-fields", "woman covered veil blue smile old"],
  ["naomi", "ruth-fields", "woman white covered veil blue old"],
  ["orpah", "ruth-fields", "woman covered veil red hand old"],
  ["samuel", "samuel-call", "child down hand old"],
  ["david", "david-shepherd", "child smile red down old"],
  ["goliath", "david-goliath", "beard covered old"],
  ["elijah", "elijah-ravens", "beard white fur up old"],
  ["jonah", "jonah-fish", "beard red up old"],
  ["daniel", "daniel-lions", "beard blue up old"],
  ["esther", "queen-esther", "woman covered crown old"],
  ["jacob", "joseph-coat", "beard white covered headband smile old"],
  ["joseph-egypt", "joseph-forgives", "covered headband blue smile down old"],
  ["baby-moses", "moses-basket", "child smile old"],
  ["baby-jesus", "nativity", "child down"],
  ["blindman", "heals-blind", "beard covered up"],
  ["fisherman", "catch-fish", "beard up hand"],
];

export const CHARACTERS: Character[] = LIST.flatMap(([id, slug, traits]) => {
  const image = PORTRAITS[`../assets/guesswho/${id}.webp`];
  const story = findStory(slug);
  return image && story
    ? [{ id, image, story, traits: new Set(traits.split(" ") as Trait[]) }]
    : [];
});

// Names for the characters who aren't simply a word in seek-words.ts.
const NAMES: Record<string, string[]> = {
  "joseph-egypt": [
    "Joseph, governor of Egypt",
    "José, gobernador de Egipto",
    "Josef, Verwalter von Ägypten",
    "Joseph, gouverneur d'Égypte",
    "Giuseppe, governatore d'Egitto",
    "José, governador do Egito",
    "Józef, zarządca Egiptu",
    "Иосиф, правитель Египта",
    "エジプトの大臣ヨセフ",
    "이집트 총리 요셉",
    "يوسف حاكم مصر",
    "Mısır valisi Yusuf",
  ],
  "baby-moses": [
    "Baby Moses",
    "Moisés bebé",
    "Der kleine Mose",
    "Moïse bébé",
    "Mosè neonato",
    "Moisés bebê",
    "Mały Mojżesz",
    "Младенец Моисей",
    "赤ちゃんのモーセ",
    "아기 모세",
    "موسى الرضيع",
    "Bebek Musa",
  ],
  "baby-jesus": [
    "Baby Jesus",
    "Jesús bebé",
    "Das Jesuskind",
    "Jésus bébé",
    "Gesù Bambino",
    "Jesus bebê",
    "Dzieciątko Jezus",
    "Младенец Иисус",
    "赤ちゃんのイエスさま",
    "아기 예수님",
    "الطفل يسوع",
    "Bebek İsa",
  ],
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
  cleopas: [
    "Cleopas",
    "Cleofás",
    "Kleopas",
    "Cléopas",
    "Cleopa",
    "Cleopas",
    "Kleofas",
    "Клеопа",
    "クレオパ",
    "글로바",
    "كليوباس",
    "Kleopas",
  ],
  sower: [
    "The sower",
    "El sembrador",
    "Der Sämann",
    "Le semeur",
    "Il seminatore",
    "O semeador",
    "Siewca",
    "Сеятель",
    "種まく人",
    "씨 뿌리는 사람",
    "الزارع",
    "Ekinci",
  ],
  "temple-teacher": [
    "Temple teacher",
    "Maestro del templo",
    "Lehrer im Tempel",
    "Maître du Temple",
    "Maestro del tempio",
    "Mestre do templo",
    "Nauczyciel w świątyni",
    "Учитель в храме",
    "神殿の先生",
    "성전의 선생님",
    "معلّم الهيكل",
    "Tapınaktaki öğretmen",
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

// How many cards each level has, and in how many columns they stand
// (3 x 3, 3 x 4, 4 x 5, 4 x 7, 4 x 9).
export const CHARACTER_COUNTS: Record<DifficultyId, number> = {
  easy: 9,
  "easy-medium": 12,
  medium: 20,
  "medium-hard": 28,
  hard: 36,
};

export const CHARACTER_COLS: Record<DifficultyId, number> = {
  easy: 3,
  "easy-medium": 3,
  medium: 4,
  "medium-hard": 4,
  hard: 4,
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Each player's own cards and hidden character. Players take their cards
// one after another from a shuffled pile, so boards share as few characters
// as possible, and nobody looks for the same character as someone else.
export function dealBoards(
  level: DifficultyId,
  players: number,
): { cards: Character[]; secret: Character }[] {
  const n = Math.min(CHARACTER_COUNTS[level], CHARACTERS.length);
  const pile = shuffle(CHARACTERS);
  const hidden: Character[] = [];
  return Array.from({ length: players }, (_, p) => {
    const cards: Character[] = [];
    for (let k = p * n; cards.length < n; k++) {
      const c = pile[k % pile.length];
      if (!cards.includes(c)) cards.push(c);
    }
    const free = cards.filter((c) => !hidden.includes(c));
    const secret = free[Math.floor(Math.random() * free.length)];
    hidden.push(secret);
    return { cards: shuffle(cards), secret };
  });
}

// Halving the cards with every question finds anyone in log2(n) questions;
// a couple more than that still earns two stars.
export function guessStars(cost: number, cards: number): number {
  const best = Math.ceil(Math.log2(cards));
  return cost <= best ? 3 : cost <= best + 2 ? 2 : 1;
}
