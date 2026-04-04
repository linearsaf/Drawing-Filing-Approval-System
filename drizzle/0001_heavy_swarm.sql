CREATE TABLE `user_access_requests` (
	`id` varchar(36) NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(191) NOT NULL,
	`username` varchar(80) NOT NULL,
	`user_role` enum('ADMIN','DRAFTER','DRAFT_LEADER','APPROVER_L1','HEAD','CONSUMER') NOT NULL DEFAULT 'CONSUMER',
	`access_request_status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`admin_review_note` text,
	`approved_user_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`reviewed_at` timestamp,
	CONSTRAINT `user_access_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `audit_entity_type` enum('DRAWING','REVISION','USER','ACCESS_REQUEST') NOT NULL;--> statement-breakpoint
ALTER TABLE `user_access_requests` ADD CONSTRAINT `user_access_requests_approved_user_id_user_id_fk` FOREIGN KEY (`approved_user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `access_requests_email_idx` ON `user_access_requests` (`email`);--> statement-breakpoint
CREATE INDEX `access_requests_username_idx` ON `user_access_requests` (`username`);--> statement-breakpoint
CREATE INDEX `access_requests_status_idx` ON `user_access_requests` (`access_request_status`);