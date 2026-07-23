import { useEffect, useState } from "react";
import dayjs from "dayjs";

export function useServiceTimer(servedAt) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    servedAt ? dayjs().diff(dayjs(servedAt), "second") : 0
  );

  useEffect(() => {
    if (!servedAt) {
      setElapsedSeconds(0);
      return undefined;
    }

    setElapsedSeconds(dayjs().diff(dayjs(servedAt), "second"));
    const id = setInterval(() => {
      setElapsedSeconds(dayjs().diff(dayjs(servedAt), "second"));
    }, 1000);

    return () => clearInterval(id);
  }, [servedAt]);

  return elapsedSeconds;
}
