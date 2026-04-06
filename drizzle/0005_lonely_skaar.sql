CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`recipient_user_id` varchar(36) NOT NULL,
	`notification_type` enum('WAITING_CHECK','WAITING_APPROVAL_1','WAITING_APPROVAL_2','CHECK_REJECTED','APPROVAL_1_REJECTED','APPROVAL_2_REJECTED','DRAWING_COMPLETED','ACCESS_REQUEST_PENDING') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`audit_entity_type` enum('DRAWING','REVISION','USER','ACCESS_REQUEST') NOT NULL,
	`entity_id` varchar(36) NOT NULL,
	`action_url` varchar(500) NOT NULL,
	`source_key` varchar(255) NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `notifications_source_key_unique` UNIQUE(`source_key`)
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipient_user_id_user_id_fk` FOREIGN KEY (`recipient_user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notifications_recipient_created_idx` ON `notifications` (`recipient_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_read_created_idx` ON `notifications` (`recipient_user_id`,`is_read`,`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_entity_idx` ON `notifications` (`audit_entity_type`,`entity_id`);