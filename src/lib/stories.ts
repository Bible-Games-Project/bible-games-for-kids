// The shared catalogue of Bible stories. Every game (puzzles, memory, drag &
// drop, coloring, order the stories...) draws from this one list, so adding a
// story here (with its 896x1152 painting and its titles in scenes-i18n.ts)
// makes it available everywhere.
import walkingWater from "@/assets/puzzle-walking-water.jpg";
import blessingChildren from "@/assets/puzzle-blessing-children.jpg";
import feeding5000 from "@/assets/puzzle-feeding-5000.jpg";
import calmingStorm from "@/assets/puzzle-calming-storm.jpg";
import goodSamaritan from "@/assets/puzzle-good-samaritan.jpg";
import noahsArk from "@/assets/puzzle-noahs-ark.jpg";
import creation from "@/assets/puzzle-creation.jpg";
import mosesBasket from "@/assets/puzzle-moses-basket.jpg";
import davidShepherd from "@/assets/puzzle-david-shepherd.jpg";
import nativity from "@/assets/puzzle-nativity.jpg";
import redSea from "@/assets/puzzle-red-sea.jpg";
import davidGoliath from "@/assets/puzzle-david-goliath.jpg";
import burningBush from "@/assets/puzzle-burning-bush.jpg";
import rainbowPromise from "@/assets/puzzle-rainbow-promise.jpg";
import towerBabel from "@/assets/puzzle-tower-babel.jpg";
import passoverSupper from "@/assets/puzzle-passover-supper.jpg";
import weddingCana from "@/assets/puzzle-wedding-cana.jpg";
import prodigalSon from "@/assets/puzzle-prodigal-son.jpg";
import zacchaeus from "@/assets/puzzle-zacchaeus.jpg";
import jonahFish from "@/assets/puzzle-jonah-fish.jpg";
import danielLions from "@/assets/puzzle-daniel-lions.jpg";
import josephCoat from "@/assets/puzzle-joseph-coat.jpg";
import sermonMount from "@/assets/puzzle-sermon-mount.jpg";
import baptismJesus from "@/assets/puzzle-baptism-jesus.jpg";
import palmSunday from "@/assets/puzzle-palm-sunday.jpg";
import adamAnimals from "@/assets/puzzle-adam-animals.jpg";
import ruthFields from "@/assets/puzzle-ruth-fields.jpg";
import abrahamStars from "@/assets/puzzle-abraham-stars.jpg";
import annunciation from "@/assets/puzzle-annunciation.jpg";
import wiseMen from "@/assets/puzzle-wise-men.jpg";
import lostSheep from "@/assets/puzzle-lost-sheep.jpg";
import jacobsLadder from "@/assets/puzzle-jacobs-ladder.jpg";
import samuelCall from "@/assets/puzzle-samuel-call.jpg";
import elijahRavens from "@/assets/puzzle-elijah-ravens.jpg";
import goodShepherd from "@/assets/puzzle-good-shepherd.jpg";
import healsBlind from "@/assets/puzzle-heals-blind.jpg";
import resurrectionMorning from "@/assets/puzzle-resurrection-morning.jpg";
import queenEsther from "@/assets/puzzle-queen-esther.jpg";
import josephForgives from "@/assets/puzzle-joseph-forgives.jpg";
import gideonFleece from "@/assets/puzzle-gideon-fleece.jpg";
import angelsShepherds from "@/assets/puzzle-angels-shepherds.jpg";
import boyTemple from "@/assets/puzzle-boy-temple.jpg";
import catchFish from "@/assets/puzzle-catch-fish.jpg";
import bethlehemJourney from "@/assets/puzzle-bethlehem-journey.jpg";
import sowerSeed from "@/assets/puzzle-sower-seed.jpg";
import transfiguration from "@/assets/puzzle-transfiguration.jpg";
import washesFeet from "@/assets/puzzle-washes-feet.jpg";
import maryMartha from "@/assets/puzzle-mary-martha.jpg";
import emmaus from "@/assets/puzzle-emmaus.jpg";
import mustardSeed from "@/assets/puzzle-mustard-seed.jpg";

export interface Story {
  slug: string;
  title: string;
  verse: string;
  image: string;
  // Chronological period in the Bible, used by "Order the Stories". Higher
  // numbers come later. Stories that share a number happened in the same
  // period (or their order is uncertain, like Jesus' parables) and are never
  // asked against each other. Old Testament < 200 <= New Testament.
  era: number;
}

// Order here only seeds the puzzle shuffles; keep new stories at the end so
// existing puzzle levels keep their order.
export const STORIES: Story[] = [
  { slug: "blessing-children", title: "Jesus Blesses the Children", verse: "Matthew 19:14", image: blessingChildren, era: 210 },
  { slug: "walking-water", title: "Jesus Walks on Water", verse: "Matthew 14:25", image: walkingWater, era: 210 },
  { slug: "feeding-5000", title: "Jesus Feeds the 5,000", verse: "John 6:11", image: feeding5000, era: 210 },
  { slug: "calming-storm", title: "Jesus Calms the Storm", verse: "Mark 4:39", image: calmingStorm, era: 210 },
  { slug: "good-samaritan", title: "The Good Samaritan", verse: "Luke 10:33", image: goodSamaritan, era: 210 },
  { slug: "noahs-ark", title: "Noah's Ark", verse: "Genesis 6:22", image: noahsArk, era: 20 },
  { slug: "creation", title: "The Creation", verse: "Genesis 1:31", image: creation, era: 10 },
  { slug: "moses-basket", title: "Baby Moses in the Basket", verse: "Exodus 2:3", image: mosesBasket, era: 70 },
  { slug: "david-shepherd", title: "David the Shepherd Boy", verse: "1 Samuel 16:11", image: davidShepherd, era: 100 },
  { slug: "nativity", title: "The Nativity", verse: "Luke 2:7", image: nativity, era: 202 },
  { slug: "red-sea", title: "Moses Parts the Red Sea", verse: "Exodus 14:21", image: redSea, era: 72 },
  { slug: "david-goliath", title: "David and Goliath", verse: "1 Samuel 17:49", image: davidGoliath, era: 101 },
  { slug: "burning-bush", title: "Moses and the Burning Bush", verse: "Exodus 3:2", image: burningBush, era: 71 },
  { slug: "rainbow-promise", title: "God's Rainbow Promise", verse: "Genesis 9:13", image: rainbowPromise, era: 21 },
  { slug: "tower-babel", title: "The Tower of Babel", verse: "Genesis 11:4", image: towerBabel, era: 30 },
  { slug: "passover-supper", title: "The Passover Supper", verse: "Luke 22:15", image: passoverSupper, era: 230 },
  { slug: "wedding-cana", title: "The Wedding at Cana", verse: "John 2:9", image: weddingCana, era: 207 },
  { slug: "prodigal-son", title: "The Prodigal Son", verse: "Luke 15:20", image: prodigalSon, era: 210 },
  { slug: "zacchaeus", title: "Zacchaeus in the Tree", verse: "Luke 19:5", image: zacchaeus, era: 210 },
  { slug: "jonah-fish", title: "Jonah and the Great Fish", verse: "Jonah 2:10", image: jonahFish, era: 120 },
  { slug: "daniel-lions", title: "Daniel in the Lions' Den", verse: "Daniel 6:22", image: danielLions, era: 130 },
  { slug: "joseph-coat", title: "Joseph's Coat of Many Colors", verse: "Genesis 37:3", image: josephCoat, era: 60 },
  { slug: "sermon-mount", title: "The Sermon on the Mount", verse: "Matthew 5:1", image: sermonMount, era: 210 },
  { slug: "baptism-jesus", title: "The Baptism of Jesus", verse: "Matthew 3:16", image: baptismJesus, era: 206 },
  { slug: "palm-sunday", title: "The Triumphal Entry", verse: "Matthew 21:9", image: palmSunday, era: 220 },
  { slug: "adam-animals", title: "Adam Names the Animals", verse: "Genesis 2:19", image: adamAnimals, era: 10 },
  { slug: "ruth-fields", title: "Ruth, Naomi and Orpah", verse: "Ruth 1:16", image: ruthFields, era: 80 },
  { slug: "abraham-stars", title: "Abraham Counts the Stars", verse: "Genesis 15:5", image: abrahamStars, era: 40 },
  { slug: "annunciation", title: "The Annunciation", verse: "Luke 1:30", image: annunciation, era: 200 },
  { slug: "wise-men", title: "The Wise Men Visit Jesus", verse: "Matthew 2:11", image: wiseMen, era: 204 },
  { slug: "lost-sheep", title: "The Lost Sheep", verse: "Luke 15:6", image: lostSheep, era: 210 },
  { slug: "jacobs-ladder", title: "Jacob's Ladder", verse: "Genesis 28:12", image: jacobsLadder, era: 50 },
  { slug: "samuel-call", title: "Samuel Hears God's Voice", verse: "1 Samuel 3:10", image: samuelCall, era: 90 },
  { slug: "elijah-ravens", title: "Elijah Fed by the Ravens", verse: "1 Kings 17:6", image: elijahRavens, era: 110 },
  { slug: "good-shepherd", title: "Jesus the Good Shepherd", verse: "John 10:11", image: goodShepherd, era: 210 },
  { slug: "heals-blind", title: "Jesus Heals a Blind Man", verse: "Mark 10:52", image: healsBlind, era: 210 },
  { slug: "resurrection-morning", title: "The Resurrection Morning", verse: "Matthew 28:6", image: resurrectionMorning, era: 240 },
  { slug: "queen-esther", title: "Queen Esther", verse: "Esther 2:17", image: queenEsther, era: 140 },
  { slug: "joseph-forgives", title: "Joseph Forgives His Brothers", verse: "Genesis 45:15", image: josephForgives, era: 61 },
  { slug: "gideon-fleece", title: "Gideon's Fleece", verse: "Judges 6:37", image: gideonFleece, era: 80 },
  { slug: "angels-shepherds", title: "Angels Appear to the Shepherds", verse: "Luke 2:9", image: angelsShepherds, era: 203 },
  { slug: "boy-temple", title: "The Boy Jesus in the Temple", verse: "Luke 2:46", image: boyTemple, era: 205 },
  { slug: "catch-fish", title: "The Miraculous Catch of Fish", verse: "John 21:6", image: catchFish, era: 242 },
  { slug: "bethlehem-journey", title: "The Journey to Bethlehem", verse: "Luke 2:4", image: bethlehemJourney, era: 201 },
  { slug: "sower-seed", title: "The Sower and the Seed", verse: "Matthew 13:3", image: sowerSeed, era: 210 },
  { slug: "transfiguration", title: "The Transfiguration", verse: "Matthew 17:2", image: transfiguration, era: 210 },
  { slug: "washes-feet", title: "Jesus Washes the Disciples' Feet", verse: "John 13:5", image: washesFeet, era: 230 },
  { slug: "mary-martha", title: "Mary and Martha", verse: "Luke 10:39", image: maryMartha, era: 210 },
  { slug: "emmaus", title: "The Road to Emmaus", verse: "Luke 24:15", image: emmaus, era: 241 },
  { slug: "mustard-seed", title: "The Mustard Seed", verse: "Matthew 13:31", image: mustardSeed, era: 210 },
];

export const findStory = (slug: string): Story | undefined =>
  STORIES.find((s) => s.slug === slug);
