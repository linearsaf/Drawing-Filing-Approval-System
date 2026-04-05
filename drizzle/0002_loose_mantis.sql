CREATE TABLE `revision_approval_steps` (
	`id` varchar(36) NOT NULL,
	`revision_id` varchar(36) NOT NULL,
	`approval_level` int NOT NULL,
	`assigned_user_id` varchar(36),
	`assigned_by_user_id` varchar(36),
	`assigned_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revision_approval_steps_id` PRIMARY KEY(`id`),
	CONSTRAINT `revision_approval_steps_revision_level_unique` UNIQUE(`revision_id`,`approval_level`)
);
--> statement-breakpoint
ALTER TABLE `revision_approval_steps` ADD CONSTRAINT `revision_approval_steps_revision_id_drawing_revisions_id_fk` FOREIGN KEY (`revision_id`) REFERENCES `drawing_revisions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revision_approval_steps` ADD CONSTRAINT `revision_approval_steps_assigned_user_id_user_id_fk` FOREIGN KEY (`assigned_user_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revision_approval_steps` ADD CONSTRAINT `revision_approval_steps_assigned_by_user_id_user_id_fk` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `revision_approval_steps_assigned_user_level_idx` ON `revision_approval_steps` (`assigned_user_id`,`approval_level`);--> statement-breakpoint
CREATE INDEX `revision_approval_steps_revision_idx` ON `revision_approval_steps` (`revision_id`);--> statement-breakpoint
INSERT INTO `revision_approval_steps` (
	`id`,
	`revision_id`,
	`approval_level`,
	`assigned_user_id`,
	`assigned_by_user_id`,
	`assigned_at`,
	`updated_at`
)
SELECT
	UUID(),
	approval_seed.`revision_id`,
	approval_seed.`approval_level`,
	approval_seed.`actor_id`,
	check_seed.`actor_id`,
	COALESCE(approval_seed.`acted_at`, NOW()),
	COALESCE(approval_seed.`acted_at`, NOW())
FROM (
	SELECT
		`revision_id`,
		`approval_level`,
		`actor_id`,
		`acted_at`,
		ROW_NUMBER() OVER (
			PARTITION BY `revision_id`, `approval_level`
			ORDER BY `acted_at` ASC, `created_at` ASC
		) AS `row_no`
	FROM `approval_actions`
	WHERE `approval_level` IN (1, 2)
) AS approval_seed
LEFT JOIN (
	SELECT
		check_actor.`revision_id`,
		check_actor.`actor_id`
	FROM (
		SELECT
			`revision_id`,
			`actor_id`,
			ROW_NUMBER() OVER (
				PARTITION BY `revision_id`
				ORDER BY `acted_at` ASC, `created_at` ASC
			) AS `row_no`
		FROM `approval_actions`
		WHERE `approval_level` = 0 AND `approval_decision` = 'APPROVED'
	) AS check_actor
	WHERE check_actor.`row_no` = 1
) AS check_seed
	ON check_seed.`revision_id` = approval_seed.`revision_id`
WHERE approval_seed.`row_no` = 1;
