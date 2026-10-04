/** Public visitor Chat field limits shared by the server guards and the widget inputs. */
export const PUBLIC_CHAT_INPUT_LIMITS = {
  message: 4000,
  name: 200,
  email: 320,
  phone: 40,
  preferredDate: 64,
  preferredTime: 64,
  timezone: 64,
  appointmentMessage: 4000,
  campaignId: 191,
  attachmentIds: 10,
} as const;
