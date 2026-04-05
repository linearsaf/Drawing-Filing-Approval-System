ALTER TABLE `drawings` ADD `drawn_by_user_id` varchar(36);--> statement-breakpoint
ALTER TABLE `drawings` ADD `workflow_source` enum('STANDARD','LEGACY_READY') DEFAULT 'STANDARD' NOT NULL;--> statement-breakpoint
ALTER TABLE `drawings` ADD `legacy_ready_note` text;--> statement-breakpoint
UPDATE `drawings` SET `drawn_by_user_id` = `created_by` WHERE `drawn_by_user_id` IS NULL;--> statement-breakpoint
ALTER TABLE `drawings` MODIFY `drawn_by_user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `drawings` ADD CONSTRAINT `drawings_drawn_by_user_id_user_id_fk` FOREIGN KEY (`drawn_by_user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `drawings_drawn_by_user_idx` ON `drawings` (`drawn_by_user_id`);--> statement-breakpoint
CREATE INDEX `drawings_workflow_source_idx` ON `drawings` (`workflow_source`);
