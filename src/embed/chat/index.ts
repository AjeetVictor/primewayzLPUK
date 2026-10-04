/**
 * Browser entry for dist/embed/pw-chat.js. Has no exports so the IIFE build
 * does not create a global; the only global is window.PrimewayzChat.
 */

import { installPrimewayzChat } from './install.ts';

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void installPrimewayzChat(window);
}
