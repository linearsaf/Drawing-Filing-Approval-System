UPDATE `drawings` d
LEFT JOIN `drawing_revisions` r
  ON r.`id` = d.`current_revision_id`
SET d.`updated_at` = COALESCE(r.`updated_at`, d.`updated_at`);
