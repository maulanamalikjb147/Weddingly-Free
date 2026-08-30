import { useState, useEffect } from "react";

const calculateTimeLeft = (eventDate: string) => {
  // Use the requested default date if empty
  let normalizedDate = eventDate ? eventDate.replace(" ", "T") : "2025-09-26T00:00:00";
  // If there's no timezone info (Z or +), append WIB timezone (+07:00)
  if (!normalizedDate.includes("Z") && !normalizedDate.includes("+")) {
    normalizedDate += "+07:00";
  }
  
  let targetDate = new Date(normalizedDate); 
  // Fallback if the date is invalid (NaN)
  if (isNaN(targetDate.getTime())) {
    targetDate = new Date("2025-09-26T00:00:00+07:00");
  }
  
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  let timeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  if (!isNaN(difference) && difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return timeLeft;
};

const CountdownTimer = ({ eventDate }: { eventDate: string }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(eventDate));

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(eventDate));
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, eventDate]);

  return (
    <div className="flex space-x-4 mt-5 text-center font-legan">
      <div className="flex flex-col">
        <span className="text-4xl font-bold">{timeLeft.days}</span>
        <span className="text-sm uppercase">Days</span>
      </div>
      <div className="flex flex-col">
        <span className="text-4xl font-bold">{timeLeft.hours}</span>
        <span className="text-sm uppercase">Hours</span>
      </div>
      <div className="flex flex-col">
        <span className="text-4xl font-bold">{timeLeft.minutes}</span>
        <span className="text-sm uppercase">Minutes</span>
      </div>
      <div className="flex flex-col">
        <span className="text-4xl font-bold">{timeLeft.seconds}</span>
        <span className="text-sm uppercase">Seconds</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
