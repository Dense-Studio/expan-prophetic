import { useEffect, useState } from "react";
import { EVENT } from "./event";

type EventAccessType = "check-in" | "registration";

function getOpeningTime(type: EventAccessType): number {
  return new Date(
    type === "check-in" ? EVENT.checkInOpensAt : EVENT.registrationOpensAt,
  ).getTime();
}

export function useEventAccess(type: EventAccessType): boolean {
  const openingTime = getOpeningTime(type);
  const [isOpen, setIsOpen] = useState(
    () => EVENT.forceAccessOpenForTesting || Date.now() >= openingTime,
  );

  useEffect(() => {
    if (EVENT.forceAccessOpenForTesting) {
      setIsOpen(true);
      return;
    }

    if (isOpen) return;

    const updateAccess = () => setIsOpen(Date.now() >= openingTime);
    const delay = Math.max(0, openingTime - Date.now());
    const timer = window.setTimeout(updateAccess, delay + 100);

    window.addEventListener("focus", updateAccess);
    document.addEventListener("visibilitychange", updateAccess);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", updateAccess);
      document.removeEventListener("visibilitychange", updateAccess);
    };
  }, [isOpen, openingTime]);

  return isOpen;
}
