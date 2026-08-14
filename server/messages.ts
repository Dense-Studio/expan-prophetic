const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbCkkB01t90ZSMp8m13a";

export function eventWelcomeMessage(firstName: string): string {
  return `Hi ${firstName}!\n\nSo glad you made it for the August edition of EXPAN 2026! Welcome to church.\nSettle in with an open heart and expect an intimate time with God.\n\nDon't forget to follow our WhatsApp channel to stay connected and updated.\n${WHATSAPP_CHANNEL}`;
}
