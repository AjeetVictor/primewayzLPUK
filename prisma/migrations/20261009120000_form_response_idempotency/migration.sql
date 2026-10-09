ALTER TABLE `FormResponse`
  ADD COLUMN `submissionId` VARCHAR(64) NULL,
  ADD UNIQUE INDEX `FormResponse_submissionId_key` (`submissionId`);
