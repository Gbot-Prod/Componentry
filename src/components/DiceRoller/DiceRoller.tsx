import "./DiceRoller.css"
import { useState } from "react";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";

const FACES = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
const MAX_DICE = 6;
const ROLL_ANIMATION_MS = 400;

const rollDie = () => Math.floor(Math.random() * 6) + 1;

function DiceRoller() {
  const [dice, setDice] = useState<number[]>([1, 1]);
  const [isRolling, setIsRolling] = useState(false);

  const total = dice.reduce((sum, value) => sum + value, 0);

  function roll() {
    setIsRolling(true);
    setDice((current) => current.map(rollDie));
    setTimeout(() => setIsRolling(false), ROLL_ANIMATION_MS);
  }

  function changeCount(delta: number) {
    setDice((current) => {
      const count = Math.min(MAX_DICE, Math.max(1, current.length + delta));
      return Array.from({ length: count }, (_, i) => current[i] ?? 1);
    });
  }

  return (
    <div className="diceRoller">
      <div className="diceRow">
        {dice.map((value, i) => {
          const Face = FACES[value - 1];
          return <Face key={i} size={48} className={isRolling ? "die rolling" : "die"} />;
        })}
      </div>
      <div className="diceTotal">Total: {total}</div>
      <div className="diceControls">
        <button onClick={() => changeCount(-1)} disabled={dice.length <= 1} aria-label="Remove a die">−</button>
        <button className="rollButton" onClick={roll}>Roll</button>
        <button onClick={() => changeCount(1)} disabled={dice.length >= MAX_DICE} aria-label="Add a die">+</button>
      </div>
    </div>
  );
}

export default DiceRoller;
