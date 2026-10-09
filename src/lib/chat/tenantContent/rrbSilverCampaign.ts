/**
 * RentReadBuy Silver Membership campaign chat content (tenant `rrb-silver-campaign`).
 *
 * Answers restate only the Silver rules approved for the campaign page (locked
 * proposition and approved FAQs). Changing a fact here requires RentReadBuy approval.
 */

import type {
  TenantChatApprovedAnswers,
  TenantChatWidgetConfig,
} from '../tenantChatWidget.ts';

const FOLLOW_UP = 'If you have another question, type it here for the RentReadBuy team.';

export const RRB_SILVER_CHAT_WIDGET: TenantChatWidgetConfig = {
  publicSiteKey: 'rentreadbuy-silver',
  panelTitle: 'RentReadBuy Reading Assistant',
  assistantName: 'RentReadBuy Reading Assistant',
  teamName: 'RentReadBuy team',
  greeting: 'Questions about Silver Membership?',
  supportingText: 'Ask about Silver: ₹899 for 3 months, with up to 2 physical books at a time.',
  leadPrompt: 'Leave your details so the RentReadBuy team can follow up.',
  theme: {
    text: '#12203a',
    launcherBackground: '#037b80',
    launcherHoverBackground: '#02666a',
    headerBackground: '#02666a',
    headerMuted: '#d8ecea',
    action: '#037b80',
    actionHover: '#02666a',
    actionDisabled: '#9fc7c5',
    accent: '#f08a6c',
    surface: '#d8ecea',
    surfaceAlt: '#fbf6ee',
    border: '#d9cfc0',
    borderSoft: '#ece3d4',
    muted: '#3d4a5c',
    focusRing: '#037b802e',
  },
  launcher: {
    // The campaign hero's ambient-motion pause button (its label flips with state).
    collisionSelectors: [
      'button[aria-label="Pause scenery animation"]',
      'button[aria-label="Play scenery animation"]',
    ],
  },
  intents: [
    { key: 'silver_how_it_works', label: 'How does Silver Membership work?' },
    { key: 'silver_price_inclusions', label: 'What is included in ₹899?' },
    { key: 'silver_book_limits', label: 'How many books can I read?' },
    { key: 'silver_returns', label: 'How do returns and my next book work?' },
    { key: 'silver_gifting', label: 'Can I gift Silver Membership?' },
    { key: 'silver_joining', label: 'How do I join?' },
  ],
};

export const RRB_SILVER_APPROVED_ANSWERS: TenantChatApprovedAnswers = {
  silver_how_it_works:
    `Silver is RentReadBuy's physical book rental membership. Choose up to 2 books at a time and read at your pace. When you're done, request a return and choose your next books straight away. You don't need to wait for your returned books to reach us.\n\n${FOLLOW_UP}`,
  silver_price_inclusions:
    `Silver is ₹899 for 3 months. While your membership is active, that covers your book rentals, delivery and return pickups: no additional rental/product charge, no delivery charge and no return pickup charge.\n\n${FOLLOW_UP}`,
  silver_book_limits:
    `You can have up to 2 books at a time, with no fixed total rental-book quota during an active membership. The standard Silver rental period is up to 60 days.\n\n${FOLLOW_UP}`,
  silver_returns:
    `When you finish, raise a return request and choose your next books straight away. You don't need to wait for your returned books to reach our warehouse, and there is no return pickup charge during an active membership.\n\n${FOLLOW_UP}`,
  silver_gifting:
    `Yes. Give someone a RentReadBuy Silver Membership so they can choose the books they love, instead of you choosing just one book for them. Select "Gift a Silver Membership" on this page to continue on RentReadBuy.\n\n${FOLLOW_UP}`,
  silver_joining:
    `Select "Start Silver Membership" on this page. You will continue on RentReadBuy, where you can sign in and complete your Silver membership: ₹899 for 3 months.\n\n${FOLLOW_UP}`,
};

/** `{businessHours}` is replaced with the tenant's configured service hours. */
export const RRB_SILVER_OFFLINE_ACKNOWLEDGEMENT =
  'Thanks for your question. It has been passed to the RentReadBuy team, who will reply here during {businessHours}.';
