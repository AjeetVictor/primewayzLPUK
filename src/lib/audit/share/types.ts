export type CreateSharedReportResult = {
  publicToken: string;
  shareUrl: string;
  createdAt: string;
};

export type ShareLinkState = CreateSharedReportResult;
