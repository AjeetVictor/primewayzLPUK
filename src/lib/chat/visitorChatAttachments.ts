/**
 * Pending attachment gating helpers for visitor chat send control.
 */

import type { PendingChatAttachment } from './visitorChatTypes.ts';

export function hasUploadingAttachment(
  attachments: readonly PendingChatAttachment[],
): boolean {
  return attachments.some((item) => item.uploadStatus === 'uploading');
}

export function hasFailedAttachment(
  attachments: readonly PendingChatAttachment[],
): boolean {
  return attachments.some((item) => item.uploadStatus === 'failed');
}

export function hasBlockingAttachment(
  attachments: readonly PendingChatAttachment[],
): boolean {
  return hasUploadingAttachment(attachments) || hasFailedAttachment(attachments);
}

export const VISITOR_ATTACHMENT_UPLOAD_GUIDANCE =
  'Wait for the upload to finish, or remove the attachment.' as const;

export const VISITOR_ATTACHMENT_FAILED_GUIDANCE =
  'Retry or remove the failed attachment before sending.' as const;
