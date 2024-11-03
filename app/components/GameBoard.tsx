import cn from "../lib/cn";
import { GuessResult } from "../lib/types";


interface GameBoardProps {
  guesses: string[];
  results: GuessResult[];
  currentGuess: string;
}

interface ResultRow {
  letter: string;
  status: GuessResult[number]
}

const GameBoard: React.FC<GameBoardProps> = ({ guesses, results, currentGuess }) => {
  const rows = [...Array(6)].map<ResultRow[]>((_, i) => {
    if (i < guesses.length) {
      return guesses[i].split('').map((letter, j) => ({
        letter,
        status: results[i][j]
      }));
    } else if (i === guesses.length) {
      return currentGuess.padEnd(5, ' ').split('').map(letter => ({
        letter,
        status: 'current' as const
      }));
    } else {
      return Array(5).fill({ letter: ' ', status: 'empty' as const });
    }
  });

  return (
    <div className="grid grid-rows-6 gap-5 mb-20">
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-5 gap-5">
          {row.map((tile, j) => (
            <div key={j} className={cn('w-50 h-50 flex justify-center items-center font-bold border-solid border-[#ccc] border-2 color-white', {
              "bg-[#6aaa64]": tile.status === "correct",
              "bg-[#c9b458]": tile.status === "present",
              "bg-[#787c72]": tile.status === "absent"
            })}>
              {tile.letter}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default GameBoard
