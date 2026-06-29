import walkingWater from "@/assets/puzzle-walking-water.jpg";
import blessingChildren from "@/assets/puzzle-blessing-children.jpg";
import feeding5000 from "@/assets/puzzle-feeding-5000.jpg";
import calmingStorm from "@/assets/puzzle-calming-storm.jpg";
import goodSamaritan from "@/assets/puzzle-good-samaritan.jpg";

export interface Puzzle {
  id: string;
  title: string;
  verse: string;
  difficulty: string;
  cols: number;
  rows: number;
  image: string;
}

export const PUZZLES: Puzzle[] = [
  {
    id: "blessing-children",
    title: "Jesus Blesses the Children",
    verse: "Matthew 19:14",
    difficulty: "Easy",
    cols: 2,
    rows: 3,
    image: blessingChildren,
  },
  {
    id: "walking-water",
    title: "Jesus Walks on Water",
    verse: "Matthew 14:25",
    difficulty: "Easy–Medium",
    cols: 3,
    rows: 5,
    image: walkingWater,
  },
  {
    id: "feeding-5000",
    title: "Jesus Feeds the 5,000",
    verse: "John 6:11",
    difficulty: "Medium",
    cols: 4,
    rows: 6,
    image: feeding5000,
  },
  {
    id: "calming-storm",
    title: "Jesus Calms the Storm",
    verse: "Mark 4:39",
    difficulty: "Medium–Hard",
    cols: 5,
    rows: 8,
    image: calmingStorm,
  },
  {
    id: "good-samaritan",
    title: "The Good Samaritan",
    verse: "Luke 10:33",
    difficulty: "Hard",
    cols: 7,
    rows: 10,
    image: goodSamaritan,
  },
];

export const pieceCount = (p: Puzzle) => p.cols * p.rows;
