-- Neutral persistence safety-net default for visitor/request timezone.
-- Changes column default only; does not rewrite existing rows.
ALTER TABLE `ChatAppointmentRequest` MODIFY `timezone` VARCHAR(191) NULL DEFAULT 'UTC';
