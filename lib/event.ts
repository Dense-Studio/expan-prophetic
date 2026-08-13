export const EVENTS = {
  "expan-all-night-2026-03-27": {
    key: "expan-all-night-2026-03-27",
    shortName: "March 2026",
    name: "Extreme Prophetic EXPAN All-Night — March 2026",
    date: "Friday, 27th March 2026",
  },
  "expan-all-night-2026-08-14": {
    key: "expan-all-night-2026-08-14",
    shortName: "August 2026",
    name: "Extreme Prophetic EXPAN All-Night — August 2026",
    date: "Friday, 14th August 2026",
  },
} as const;

export type EventKey = keyof typeof EVENTS;

export const EVENT = {
  key: "expan-all-night-2026-08-14",
  name: "Extreme Prophetic EXPAN All-Night 2026",
  date: "Friday, 14th August 2026",
  time: "8:00 PM Prompt",
  venue: "Thea Villa Events Hub",
  address: "Tadisco Down — Takoradi",
  flyer: "/assets/expan-august-2026.jpeg",
  forceAccessOpenForTesting: true,
  checkInOpensAt: "2026-08-14T19:00:00Z",
  checkInOpensLabel: "Friday, 14 August at 7:00 PM",
  registrationOpensAt: "2026-08-14T19:00:00Z",
  registrationOpensLabel: "Friday, 14 August at 7:00 PM",
} as const;

export function getEventLabel(eventKey: string | null | undefined): string {
  return eventKey && eventKey in EVENTS
    ? EVENTS[eventKey as EventKey].shortName
    : "March 2026";
}
