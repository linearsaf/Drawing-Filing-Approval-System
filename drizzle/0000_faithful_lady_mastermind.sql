CREATE TABLE `account` (
	`id` varchar(36) NOT NULL,
	`accountId` varchar(255) NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` timestamp,
	`refreshTokenExpiresAt` timestamp,
	`scope` varchar(255),
	`password` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `account_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_provider_account_unique` UNIQUE(`providerId`,`accountId`)
);
--> statement-breakpoint
CREATE TABLE `approval_actions` (
	`id` varchar(36) NOT NULL,
	`revision_id` varchar(36) NOT NULL,
	`approval_level` int NOT NULL,
	`actor_id` varchar(36) NOT NULL,
	`user_role` enum('ADMIN','DRAFTER','DRAFT_LEADER','APPROVER_L1','HEAD','CONSUMER') NOT NULL DEFAULT 'CONSUMER',
	`approval_decision` enum('APPROVED','REJECTED') NOT NULL,
	`decision_note` text,
	`acted_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`audit_entity_type` enum('DRAWING','REVISION','USER') NOT NULL,
	`entity_id` varchar(36) NOT NULL,
	`action` varchar(120) NOT NULL,
	`user_id` varchar(36),
	`note` text,
	`metadata_json` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `download_logs` (
	`id` varchar(36) NOT NULL,
	`revision_id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`downloaded_at` timestamp NOT NULL DEFAULT (now()),
	`source` varchar(50) DEFAULT 'APP',
	CONSTRAINT `download_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drawing_revisions` (
	`id` varchar(36) NOT NULL,
	`drawing_id` varchar(36) NOT NULL,
	`revision_no` varchar(50) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_original_path` varchar(500) NOT NULL,
	`file_watermarked_path` varchar(500),
	`revision_status` enum('DRAFT','WAITING_CHECK','CHECK_REJECTED','WAITING_APPROVAL_1','APPROVAL_1_REJECTED','WAITING_APPROVAL_2','APPROVAL_2_REJECTED','COMPLETED','OBSOLETE') NOT NULL DEFAULT 'DRAFT',
	`change_note` text,
	`submitted_by` varchar(36),
	`submitted_at` timestamp,
	`is_latest` boolean NOT NULL DEFAULT true,
	`is_completed` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drawing_revisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `drawing_revision_unique` UNIQUE(`drawing_id`,`revision_no`)
);
--> statement-breakpoint
CREATE TABLE `drawings` (
	`id` varchar(36) NOT NULL,
	`drawing_number` varchar(100) NOT NULL,
	`drawing_name` varchar(255) NOT NULL,
	`sac_code` varchar(100) NOT NULL,
	`area` varchar(100) NOT NULL,
	`discipline` varchar(100) NOT NULL,
	`description` text,
	`created_by` varchar(36) NOT NULL,
	`current_revision_id` varchar(36),
	`revision_status` enum('DRAFT','WAITING_CHECK','CHECK_REJECTED','WAITING_APPROVAL_1','APPROVAL_1_REJECTED','WAITING_APPROVAL_2','APPROVAL_2_REJECTED','COMPLETED','OBSOLETE') NOT NULL DEFAULT 'DRAFT',
	`latest_completed_revision_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drawings_id` PRIMARY KEY(`id`),
	CONSTRAINT `drawings_number_unique` UNIQUE(`drawing_number`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(36) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`token` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`ipAddress` varchar(255),
	`userAgent` text,
	`userId` varchar(36) NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(36) NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(191) NOT NULL,
	`emailVerified` boolean NOT NULL DEFAULT false,
	`image` varchar(500),
	`username` varchar(80) NOT NULL,
	`displayUsername` varchar(120),
	`user_role` enum('ADMIN','DRAFTER','DRAFT_LEADER','APPROVER_L1','HEAD','CONSUMER') NOT NULL DEFAULT 'CONSUMER',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`),
	CONSTRAINT `user_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_actions` ADD CONSTRAINT `approval_actions_revision_id_drawing_revisions_id_fk` FOREIGN KEY (`revision_id`) REFERENCES `drawing_revisions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_actions` ADD CONSTRAINT `approval_actions_actor_id_user_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `download_logs` ADD CONSTRAINT `download_logs_revision_id_drawing_revisions_id_fk` FOREIGN KEY (`revision_id`) REFERENCES `drawing_revisions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `download_logs` ADD CONSTRAINT `download_logs_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drawing_revisions` ADD CONSTRAINT `drawing_revisions_drawing_id_drawings_id_fk` FOREIGN KEY (`drawing_id`) REFERENCES `drawings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drawing_revisions` ADD CONSTRAINT `drawing_revisions_submitted_by_user_id_fk` FOREIGN KEY (`submitted_by`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drawings` ADD CONSTRAINT `drawings_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE INDEX `approval_actions_revision_idx` ON `approval_actions` (`revision_id`);--> statement-breakpoint
CREATE INDEX `approval_actions_actor_idx` ON `approval_actions` (`actor_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`audit_entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `download_logs_revision_idx` ON `download_logs` (`revision_id`);--> statement-breakpoint
CREATE INDEX `drawing_revisions_drawing_idx` ON `drawing_revisions` (`drawing_id`);--> statement-breakpoint
CREATE INDEX `drawing_revisions_status_idx` ON `drawing_revisions` (`revision_status`);--> statement-breakpoint
CREATE INDEX `drawings_status_idx` ON `drawings` (`revision_status`);--> statement-breakpoint
CREATE INDEX `drawings_created_by_idx` ON `drawings` (`created_by`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE INDEX `user_role_idx` ON `user` (`user_role`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);