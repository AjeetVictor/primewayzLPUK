-- Increase contact enquiry message capacity to match the application's
-- validated 2,000-character limit.
ALTER TABLE `FormResponse`
  MODIFY COLUMN `message` TEXT NOT NULL;
