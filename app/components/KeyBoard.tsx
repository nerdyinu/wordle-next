import cn from "../lib/cn";

interface KeyboardProps {
  handleKeyPress: { onKeyPress: (key: string) => void };
  usedLetters: string;
}

const Keyboard: React.FC<KeyboardProps> = ({ handleKeyPress: { onKeyPress }, usedLetters }) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  return (
    <div className="grid grid-rows-3 gap-5">
      {rows.map((row, i) => (
        <div key={i} className="flex justify-center">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className={cn("m-[0.2px] p-10 text-[16px] cursor-pointer", { "opacity-50": usedLetters.includes(key) })}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
