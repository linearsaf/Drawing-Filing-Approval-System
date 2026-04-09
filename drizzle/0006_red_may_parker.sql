CREATE TABLE `drawing_requests` (
	`id` varchar(36) NOT NULL,
	`request_number` varchar(50) NOT NULL,
	`requested_by_user_id` varchar(36) NOT NULL,
	`reviewed_by_draft_leader_id` varchar(36),
	`assigned_drafter_id` varchar(36),
	`drawing_id` varchar(36),
	`sac_code` varchar(100) NOT NULL,
	`area` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`purpose` text NOT NULL,
	`reference_image_path` varchar(500),
	`drawing_request_status` enum('PENDING_REVIEW','REVIEW_REJECTED','WAITING_DRAFTER_ACCEPTANCE','DRAFTER_REJECTED','IN_PROGRESS','CLOSED') NOT NULL DEFAULT 'PENDING_REVIEW',
	`draft_leader_review_note` text,
	`drafter_decision_note` text,
	`closed_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`reviewed_at` timestamp,
	`assigned_at` timestamp,
	`closed_at` timestamp,
	CONSTRAINT `drawing_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `drawing_requests_number_unique` UNIQUE(`request_number`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `audit_entity_type` enum('DRAWING','REVISION','USER','ACCESS_REQUEST','DRAWING_REQUEST') NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `notification_type` enum('WAITING_CHECK','WAITING_APPROVAL_1','WAITING_APPROVAL_2','CHECK_REJECTED','APPROVAL_1_REJECTED','APPROVAL_2_REJECTED','DRAWING_COMPLETED','ACCESS_REQUEST_PENDING','DRAWING_REQUEST_PENDING_REVIEW','DRAWING_REQUEST_REVIEW_REJECTED','DRAWING_REQUEST_ASSIGNED','DRAWING_REQUEST_DRAFTER_REJECTED','DRAWING_REQUEST_ACCEPTED') NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `audit_entity_type` enum('DRAWING','REVISION','USER','ACCESS_REQUEST','DRAWING_REQUEST') NOT NULL;--> statement-breakpoint
ALTER TABLE `drawing_requests` ADD CONSTRAINT `drawing_requests_requested_by_user_id_user_id_fk` FOREIGN KEY (`requested_by_user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drawing_requests` ADD CONSTRAINT `drawing_requests_reviewed_by_draft_leader_id_user_id_fk` FOREIGN KEY (`reviewed_by_draft_leader_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drawing_requests` ADD CONSTRAINT `drawing_requests_assigned_drafter_id_user_id_fk` FOREIGN KEY (`assigned_drafter_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drawing_requests` ADD CONSTRAINT `drawing_requests_drawing_id_drawings_id_fk` FOREIGN KEY (`drawing_id`) REFERENCES `drawings`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `drawing_requests_requested_by_idx` ON `drawing_requests` (`requested_by_user_id`);--> statement-breakpoint
CREATE INDEX `drawing_requests_status_idx` ON `drawing_requests` (`drawing_request_status`);--> statement-breakpoint
CREATE INDEX `drawing_requests_assigned_drafter_idx` ON `drawing_requests` (`assigned_drafter_id`);--> statement-breakpoint
CREATE INDEX `drawing_requests_review_queue_idx` ON `drawing_requests` (`drawing_request_status`,`reviewed_by_draft_leader_id`);