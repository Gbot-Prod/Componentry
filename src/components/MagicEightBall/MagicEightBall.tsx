import "./MagicEightBall.css"
import { useState } from "react";

const ANSWERS = [
  "It is certain.", "Without a doubt.", "You may rely on it.", "Yes, definitely.", "Most likely.",
  "Outlook good.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
  "Better not tell you now.", "Cannot predict now.", "Don't count on it.", "My reply is no.",
  "Outlook not so good.", "Very doubtful.", "Absolutely not. Go to bed.",
];

const SHAKE_MS = 700;

function MagicEightBall() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  function shake() {
    if (isShaking) return;
    setIsShaking(true);
    setAnswer(null);
    setTimeout(() => {
      setAnswer(ANSWERS[Math.floor(Math.random() * ANSWERS.length)]);
      setIsShaking(false);
    }, SHAKE_MS);
  }

  return (
    <div className="eightBall">
      <button className={isShaking ? "ball shaking" : "ball"} onClick={shake} aria-label="Shake the 8-ball">
        <div className="ballWindow">
          {answer ? <span className="ballAnswer">{answer}</span> : <span className="ballEight">8</span>}
        </div>
      </button>
      <p className="eightBallHint">Ask a yes/no question, then click the ball.</p>
    </div>
  );
}

export default MagicEightBall;
