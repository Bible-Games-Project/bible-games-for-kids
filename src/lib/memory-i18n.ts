// Localization for the Memory game across all 12 supported languages.
// Kept self-contained so it never touches the existing Puzzle localization.
import type { Lang, Dict } from "./translations";
import { STRINGS as CORE } from "./translations";

const en: Dict = {
  "mem.chooseLevel": "Choose a Level",
  "mem.pairsCount": "{n} pairs",
  "mem.instruction": "Turn over two cards to find matching paintings",
  "mem.moves": "Moves",
  "mem.time": "Time",
  "mem.complete": "You found every pair!",
  "mem.replay": "Play Again",
  "mem.levels": "Levels",
  "mem.hidden": "Hidden card",
};

const es: Dict = {
  "mem.chooseLevel": "Elige un Nivel",
  "mem.pairsCount": "{n} parejas",
  "mem.instruction": "Da la vuelta a dos cartas para encontrar las pinturas iguales",
  "mem.moves": "Movimientos",
  "mem.time": "Tiempo",
  "mem.complete": "¡Encontraste todas las parejas!",
  "mem.replay": "Jugar de Nuevo",
  "mem.levels": "Niveles",
  "mem.hidden": "Carta oculta",
};

const de: Dict = {
  "mem.chooseLevel": "Wähle ein Level",
  "mem.pairsCount": "{n} Paare",
  "mem.instruction": "Decke zwei Karten auf und finde die gleichen Bilder",
  "mem.moves": "Züge",
  "mem.time": "Zeit",
  "mem.complete": "Du hast alle Paare gefunden!",
  "mem.replay": "Nochmal spielen",
  "mem.levels": "Level",
  "mem.hidden": "Verdeckte Karte",
};

const fr: Dict = {
  "mem.chooseLevel": "Choisis un Niveau",
  "mem.pairsCount": "{n} paires",
  "mem.instruction": "Retourne deux cartes pour trouver les images identiques",
  "mem.moves": "Coups",
  "mem.time": "Temps",
  "mem.complete": "Tu as trouvé toutes les paires !",
  "mem.replay": "Rejouer",
  "mem.levels": "Niveaux",
  "mem.hidden": "Carte cachée",
};

const it: Dict = {
  "mem.chooseLevel": "Scegli un Livello",
  "mem.pairsCount": "{n} coppie",
  "mem.instruction": "Gira due carte per trovare i dipinti uguali",
  "mem.moves": "Mosse",
  "mem.time": "Tempo",
  "mem.complete": "Hai trovato tutte le coppie!",
  "mem.replay": "Gioca Ancora",
  "mem.levels": "Livelli",
  "mem.hidden": "Carta coperta",
};

const pt: Dict = {
  "mem.chooseLevel": "Escolha um Nível",
  "mem.pairsCount": "{n} pares",
  "mem.instruction": "Vire duas cartas para encontrar as pinturas iguais",
  "mem.moves": "Jogadas",
  "mem.time": "Tempo",
  "mem.complete": "Você encontrou todos os pares!",
  "mem.replay": "Jogar de Novo",
  "mem.levels": "Níveis",
  "mem.hidden": "Carta virada",
};

const pl: Dict = {
  "mem.chooseLevel": "Wybierz Poziom",
  "mem.pairsCount": "Pary: {n}",
  "mem.instruction": "Odwróć dwie karty i znajdź takie same obrazki",
  "mem.moves": "Ruchy",
  "mem.time": "Czas",
  "mem.complete": "Wszystkie pary znalezione!",
  "mem.replay": "Zagraj Ponownie",
  "mem.levels": "Poziomy",
  "mem.hidden": "Zakryta karta",
};

const ru: Dict = {
  "mem.chooseLevel": "Выбери Уровень",
  "mem.pairsCount": "Пары: {n}",
  "mem.instruction": "Переверни две карточки и найди одинаковые картинки",
  "mem.moves": "Ходы",
  "mem.time": "Время",
  "mem.complete": "Все пары найдены!",
  "mem.replay": "Играть Снова",
  "mem.levels": "Уровни",
  "mem.hidden": "Закрытая карточка",
};

const ja: Dict = {
  "mem.chooseLevel": "レベルをえらぼう",
  "mem.pairsCount": "{n}ペア",
  "mem.instruction": "カードを2まいめくって、同じ絵を見つけよう",
  "mem.moves": "手数",
  "mem.time": "時間",
  "mem.complete": "ぜんぶのペアを見つけたよ!",
  "mem.replay": "もう一度あそぶ",
  "mem.levels": "レベル",
  "mem.hidden": "ふせたカード",
};

const ko: Dict = {
  "mem.chooseLevel": "레벨을 고르세요",
  "mem.pairsCount": "{n}쌍",
  "mem.instruction": "카드 두 장을 뒤집어 같은 그림을 찾아보세요",
  "mem.moves": "횟수",
  "mem.time": "시간",
  "mem.complete": "모든 짝을 찾았어요!",
  "mem.replay": "다시 하기",
  "mem.levels": "레벨",
  "mem.hidden": "뒤집힌 카드",
};

const ar: Dict = {
  "mem.chooseLevel": "اختر مستوى",
  "mem.pairsCount": "عدد الأزواج: {n}",
  "mem.instruction": "اقلب بطاقتين لتجد الصورتين المتطابقتين",
  "mem.moves": "المحاولات",
  "mem.time": "الوقت",
  "mem.complete": "وجدت كل الأزواج!",
  "mem.replay": "العب مرة أخرى",
  "mem.levels": "المستويات",
  "mem.hidden": "بطاقة مقلوبة",
};

const tr: Dict = {
  "mem.chooseLevel": "Bir Seviye Seç",
  "mem.pairsCount": "{n} çift",
  "mem.instruction": "Aynı resimleri bulmak için iki kart çevir",
  "mem.moves": "Hamle",
  "mem.time": "Süre",
  "mem.complete": "Tüm çiftleri buldun!",
  "mem.replay": "Tekrar Oyna",
  "mem.levels": "Seviyeler",
  "mem.hidden": "Kapalı kart",
};

export const MEM_STRINGS: Record<Lang, Dict> = {
  en, es, de, fr, it, pt, pl, ru, ja, ko, ar, tr,
};

// Look up a mem.* key, falling back to English, then to the core dictionary
// (so shared keys like diff.* still resolve), then the raw key.
export function memText(lang: Lang, key: string): string {
  return (
    MEM_STRINGS[lang]?.[key] ??
    MEM_STRINGS.en[key] ??
    CORE[lang]?.[key] ??
    CORE.en[key] ??
    key
  );
}
