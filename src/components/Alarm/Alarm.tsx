import { useEffect, useState } from "react";
import "./Alarm.css"

function Alarm() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="alarm">
      <div className="alarmTime">{now.toLocaleTimeString()}</div>
      <div className="alarmDate">{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
    </div>
  );
}

export default Alarm
