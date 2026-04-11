import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from "drizzle-orm/mysql-core";

export const userRoleValues = [
  "ADMIN",
  "DRAFTER",
  "DRAFT_LEADER",
  "APPROVER_L1",
  "HEAD",
  "CONSUMER"
] as const;

export const accessRequestStatusValues = ["PENDING", "APPROVED", "REJECTED"] as const;
export const drawingRequestStatusValues = [
  "PENDING_REVIEW",
  "REVIEW_REJECTED",
  "WAITING_DRAFTER_ACCEPTANCE",
  "DRAFTER_REJECTED",
  "IN_PROGRESS",
  "CLOSED"
] as const;

export const revisionStatusValues = [
  "DRAFT",
  "WAITING_CHECK",
  "CHECK_REJECTED",
  "WAITING_APPROVAL_1",
  "APPROVAL_1_REJECTED",
  "WAITING_APPROVAL_2",
  "APPROVAL_2_REJECTED",
  "COMPLETED",
  "OBSOLETE"
] as const;

export const approvalDecisionValues = ["APPROVED", "REJECTED"] as const;
export const approvalStepStateValues = ["UNASSIGNED", "PENDING", "APPROVED", "REJECTED"] as const;
export const workflowSourceValues = ["STANDARD", "LEGACY_READY"] as const;
export const notificationTypeValues = [
  "WAITING_CHECK",
  "WAITING_APPROVAL_1",
  "WAITING_APPROVAL_2",
  "CHECK_REJECTED",
  "APPROVAL_1_REJECTED",
  "APPROVAL_2_REJECTED",
  "DRAWING_COMPLETED",
  "ACCESS_REQUEST_PENDING",
  "DRAWING_REQUEST_PENDING_REVIEW",
  "DRAWING_REQUEST_REVIEW_REJECTED",
  "DRAWING_REQUEST_ASSIGNED",
  "DRAWING_REQUEST_DRAFTER_REJECTED",
  "DRAWING_REQUEST_ACCEPTED"
] as const;

export const auditEntityTypeValues = [
  "DRAWING",
  "REVISION",
  "USER",
  "ACCESS_REQUEST",
  "DRAWING_REQUEST"
] as const;

export const userRoleEnum = mysqlEnum("user_role", userRoleValues);
export const accessRequestStatusEnum = mysqlEnum(
  "access_request_status",
  accessRequestStatusValues
);
export const drawingRequestStatusEnum = mysqlEnum(
  "drawing_request_status",
  drawingRequestStatusValues
);
export const revisionStatusEnum = mysqlEnum("revision_status", revisionStatusValues);
export const approvalDecisionEnum = mysqlEnum("approval_decision", approvalDecisionValues);
export const approvalStepStateEnum = mysqlEnum("approval_step_state", approvalStepStateValues);
export const workflowSourceEnum = mysqlEnum("workflow_source", workflowSourceValues);
export const notificationTypeEnum = mysqlEnum("notification_type", notificationTypeValues);
export const auditEntityTypeEnum = mysqlEnum("audit_entity_type", auditEntityTypeValues);

export const user = mysqlTable(
  "user",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: varchar("image", { length: 500 }),
    username: varchar("username", { length: 80 }).notNull(),
    displayUsername: varchar("displayUsername", { length: 120 }),
    role: userRoleEnum.notNull().default("CONSUMER"),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow()
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex("user_email_unique").on(table.email),
    usernameUniqueIdx: uniqueIndex("user_username_unique").on(table.username),
    roleIdx: index("user_role_idx").on(table.role)
  })
);

export const session = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
    ipAddress: varchar("ipAddress", { length: 255 }),
    userAgent: text("userAgent"),
    userId: varchar("userId", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
  },
  (table) => ({
    tokenUniqueIdx: uniqueIndex("session_token_unique").on(table.token),
    userIdx: index("session_user_idx").on(table.userId)
  })
);

export const account = mysqlTable(
  "account",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: varchar("accountId", { length: 255 }).notNull(),
    providerId: varchar("providerId", { length: 255 }).notNull(),
    userId: varchar("userId", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: varchar("scope", { length: 255 }),
    password: varchar("password", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow()
  },
  (table) => ({
    providerAccountUniqueIdx: uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId
    ),
    userIdx: index("account_user_idx").on(table.userId)
  })
);

export const verification = mysqlTable(
  "verification",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow()
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier)
  })
);

export const userAccessRequests = mysqlTable(
  "user_access_requests",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    username: varchar("username", { length: 80 }).notNull(),
    requestedRole: userRoleEnum.notNull().default("CONSUMER"),
    status: accessRequestStatusEnum.notNull().default("PENDING"),
    adminReviewNote: text("admin_review_note"),
    approvedUserId: varchar("approved_user_id", { length: 36 }).references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
    reviewedAt: timestamp("reviewed_at")
  },
  (table) => ({
    emailIdx: index("access_requests_email_idx").on(table.email),
    usernameIdx: index("access_requests_username_idx").on(table.username),
    statusIdx: index("access_requests_status_idx").on(table.status)
  })
);

export const drawings = mysqlTable(
  "drawings",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    drawingNumber: varchar("drawing_number", { length: 100 }).notNull(),
    drawingName: varchar("drawing_name", { length: 255 }).notNull(),
    sacCode: varchar("sac_code", { length: 100 }).notNull(),
    area: varchar("area", { length: 100 }).notNull(),
    discipline: varchar("discipline", { length: 100 }).notNull(),
    description: text("description"),
    createdBy: varchar("created_by", { length: 36 })
      .notNull()
      .references(() => user.id),
    drawnByUserId: varchar("drawn_by_user_id", { length: 36 })
      .notNull()
      .references(() => user.id),
    workflowSource: workflowSourceEnum.notNull().default("STANDARD"),
    legacyReadyNote: text("legacy_ready_note"),
    currentRevisionId: varchar("current_revision_id", { length: 36 }),
    currentStatus: revisionStatusEnum.notNull().default("DRAFT"),
    latestCompletedRevisionId: varchar("latest_completed_revision_id", { length: 36 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow()
  },
  (table) => ({
    drawingNumberUniqueIdx: uniqueIndex("drawings_number_unique").on(table.drawingNumber),
    statusIdx: index("drawings_status_idx").on(table.currentStatus),
    createdByIdx: index("drawings_created_by_idx").on(table.createdBy),
    drawnByIdx: index("drawings_drawn_by_user_idx").on(table.drawnByUserId),
    workflowSourceIdx: index("drawings_workflow_source_idx").on(table.workflowSource)
  })
);

export const drawingRequests = mysqlTable(
  "drawing_requests",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    requestNumber: varchar("request_number", { length: 50 }).notNull(),
    requestedByUserId: varchar("requested_by_user_id", { length: 36 })
      .notNull()
      .references(() => user.id),
    reviewedByDraftLeaderId: varchar("reviewed_by_draft_leader_id", { length: 36 }).references(
      () => user.id,
      { onDelete: "set null" }
    ),
    assignedDrafterId: varchar("assigned_drafter_id", { length: 36 }).references(() => user.id, {
      onDelete: "set null"
    }),
    drawingId: varchar("drawing_id", { length: 36 }).references(() => drawings.id, {
      onDelete: "set null"
    }),
    sacCode: varchar("sac_code", { length: 100 }).notNull(),
    area: varchar("area", { length: 100 }).notNull(),
    description: text("description").notNull(),
    purpose: text("purpose").notNull(),
    referenceImagePath: varchar("reference_image_path", { length: 500 }),
    referenceImagePaths: text("reference_image_paths"),
    status: drawingRequestStatusEnum.notNull().default("PENDING_REVIEW"),
    draftLeaderReviewNote: text("draft_leader_review_note"),
    drafterDecisionNote: text("drafter_decision_note"),
    closedReason: text("closed_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
    reviewedAt: timestamp("reviewed_at"),
    assignedAt: timestamp("assigned_at"),
    closedAt: timestamp("closed_at")
  },
  (table) => ({
    requestNumberUniqueIdx: uniqueIndex("drawing_requests_number_unique").on(table.requestNumber),
    requestedByIdx: index("drawing_requests_requested_by_idx").on(table.requestedByUserId),
    statusIdx: index("drawing_requests_status_idx").on(table.status),
    assignedDrafterIdx: index("drawing_requests_assigned_drafter_idx").on(table.assignedDrafterId),
    reviewQueueIdx: index("drawing_requests_review_queue_idx").on(
      table.status,
      table.reviewedByDraftLeaderId
    )
  })
);

export const drawingRevisions = mysqlTable(
  "drawing_revisions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    drawingId: varchar("drawing_id", { length: 36 })
      .notNull()
      .references(() => drawings.id, { onDelete: "cascade" }),
    revisionNo: varchar("revision_no", { length: 50 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileOriginalPath: varchar("file_original_path", { length: 500 }).notNull(),
    fileWatermarkedPath: varchar("file_watermarked_path", { length: 500 }),
    status: revisionStatusEnum.notNull().default("DRAFT"),
    changeNote: text("change_note"),
    submittedBy: varchar("submitted_by", { length: 36 }).references(() => user.id),
    submittedAt: timestamp("submitted_at"),
    isLatest: boolean("is_latest").notNull().default(true),
    isCompleted: boolean("is_completed").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow()
  },
  (table) => ({
    drawingRevisionUniqueIdx: uniqueIndex("drawing_revision_unique").on(
      table.drawingId,
      table.revisionNo
    ),
    drawingIdx: index("drawing_revisions_drawing_idx").on(table.drawingId),
    statusIdx: index("drawing_revisions_status_idx").on(table.status)
  })
);

export const approvalActions = mysqlTable(
  "approval_actions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    revisionId: varchar("revision_id", { length: 36 })
      .notNull()
      .references(() => drawingRevisions.id, { onDelete: "cascade" }),
    approvalLevel: int("approval_level").notNull(),
    actorId: varchar("actor_id", { length: 36 })
      .notNull()
      .references(() => user.id),
    actorRole: userRoleEnum.notNull(),
    decision: approvalDecisionEnum.notNull(),
    decisionNote: text("decision_note"),
    decisionImagePaths: text("decision_image_paths"),
    actedAt: timestamp("acted_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => ({
    revisionIdx: index("approval_actions_revision_idx").on(table.revisionId),
    actorIdx: index("approval_actions_actor_idx").on(table.actorId)
  })
);

export const revisionApprovalSteps = mysqlTable(
  "revision_approval_steps",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    revisionId: varchar("revision_id", { length: 36 })
      .notNull()
      .references(() => drawingRevisions.id, { onDelete: "cascade" }),
    approvalLevel: int("approval_level").notNull(),
    assignedUserId: varchar("assigned_user_id", { length: 36 }).references(() => user.id, {
      onDelete: "set null"
    }),
    assignedByUserId: varchar("assigned_by_user_id", { length: 36 }).references(() => user.id, {
      onDelete: "set null"
    }),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow()
  },
  (table) => ({
    revisionLevelUniqueIdx: uniqueIndex("revision_approval_steps_revision_level_unique").on(
      table.revisionId,
      table.approvalLevel
    ),
    assignedUserLevelIdx: index("revision_approval_steps_assigned_user_level_idx").on(
      table.assignedUserId,
      table.approvalLevel
    ),
    revisionIdx: index("revision_approval_steps_revision_idx").on(table.revisionId)
  })
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    entityType: auditEntityTypeEnum.notNull(),
    entityId: varchar("entity_id", { length: 36 }).notNull(),
    action: varchar("action", { length: 120 }).notNull(),
    userId: varchar("user_id", { length: 36 }).references(() => user.id),
    note: text("note"),
    metadataJson: json("metadata_json"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => ({
    entityIdx: index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    actionIdx: index("audit_logs_action_idx").on(table.action)
  })
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    recipientUserId: varchar("recipient_user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum.notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    entityType: auditEntityTypeEnum.notNull(),
    entityId: varchar("entity_id", { length: 36 }).notNull(),
    actionUrl: varchar("action_url", { length: 500 }).notNull(),
    sourceKey: varchar("source_key", { length: 255 }).notNull(),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => ({
    sourceKeyUniqueIdx: uniqueIndex("notifications_source_key_unique").on(table.sourceKey),
    recipientCreatedIdx: index("notifications_recipient_created_idx").on(
      table.recipientUserId,
      table.createdAt
    ),
    recipientReadCreatedIdx: index("notifications_recipient_read_created_idx").on(
      table.recipientUserId,
      table.isRead,
      table.createdAt
    ),
    entityIdx: index("notifications_entity_idx").on(table.entityType, table.entityId)
  })
);

export const downloadLogs = mysqlTable(
  "download_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    revisionId: varchar("revision_id", { length: 36 })
      .notNull()
      .references(() => drawingRevisions.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).references(() => user.id),
    downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
    source: varchar("source", { length: 50 }).default("APP")
  },
  (table) => ({
    revisionIdx: index("download_logs_revision_idx").on(table.revisionId)
  })
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  accessRequests: many(userAccessRequests),
  drawingRequests: many(drawingRequests, { relationName: "drawing_request_requester" }),
  reviewedDrawingRequests: many(drawingRequests, { relationName: "drawing_request_reviewer" }),
  assignedDrawingRequests: many(drawingRequests, { relationName: "drawing_request_assignee" }),
  drawings: many(drawings, { relationName: "drawing_creator" }),
  assignedDrawings: many(drawings, { relationName: "drawing_drawn_by" }),
  revisions: many(drawingRevisions),
  approvalActions: many(approvalActions),
  notifications: many(notifications)
}));

export const accessRequestRelations = relations(userAccessRequests, ({ one }) => ({
  approvedUser: one(user, {
    fields: [userAccessRequests.approvedUserId],
    references: [user.id]
  })
}));

export const drawingRequestRelations = relations(drawingRequests, ({ one }) => ({
  requester: one(user, {
    relationName: "drawing_request_requester",
    fields: [drawingRequests.requestedByUserId],
    references: [user.id]
  }),
  reviewer: one(user, {
    relationName: "drawing_request_reviewer",
    fields: [drawingRequests.reviewedByDraftLeaderId],
    references: [user.id]
  }),
  assignedDrafter: one(user, {
    relationName: "drawing_request_assignee",
    fields: [drawingRequests.assignedDrafterId],
    references: [user.id]
  }),
  drawing: one(drawings, {
    fields: [drawingRequests.drawingId],
    references: [drawings.id]
  })
}));

export const drawingRelations = relations(drawings, ({ one, many }) => ({
  creator: one(user, {
    relationName: "drawing_creator",
    fields: [drawings.createdBy],
    references: [user.id]
  }),
  drawnBy: one(user, {
    relationName: "drawing_drawn_by",
    fields: [drawings.drawnByUserId],
    references: [user.id]
  }),
  revisions: many(drawingRevisions),
  sourceRequests: many(drawingRequests)
}));

export const revisionRelations = relations(drawingRevisions, ({ one, many }) => ({
  drawing: one(drawings, {
    fields: [drawingRevisions.drawingId],
    references: [drawings.id]
  }),
  submitter: one(user, {
    fields: [drawingRevisions.submittedBy],
    references: [user.id]
  }),
  approvals: many(approvalActions),
  approvalSteps: many(revisionApprovalSteps),
  downloads: many(downloadLogs)
}));

export const approvalActionRelations = relations(approvalActions, ({ one }) => ({
  revision: one(drawingRevisions, {
    fields: [approvalActions.revisionId],
    references: [drawingRevisions.id]
  }),
  actor: one(user, {
    fields: [approvalActions.actorId],
    references: [user.id]
  })
}));

export const revisionApprovalStepRelations = relations(revisionApprovalSteps, ({ one }) => ({
  revision: one(drawingRevisions, {
    fields: [revisionApprovalSteps.revisionId],
    references: [drawingRevisions.id]
  }),
  assignedUser: one(user, {
    fields: [revisionApprovalSteps.assignedUserId],
    references: [user.id]
  }),
  assignedByUser: one(user, {
    fields: [revisionApprovalSteps.assignedByUserId],
    references: [user.id]
  })
}));

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
  actor: one(user, {
    fields: [auditLogs.userId],
    references: [user.id]
  })
}));

export const downloadLogRelations = relations(downloadLogs, ({ one }) => ({
  revision: one(drawingRevisions, {
    fields: [downloadLogs.revisionId],
    references: [drawingRevisions.id]
  }),
  actor: one(user, {
    fields: [downloadLogs.userId],
    references: [user.id]
  })
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  recipient: one(user, {
    fields: [notifications.recipientUserId],
    references: [user.id]
  })
}));

export const schema = {
  user,
  session,
  account,
  verification,
  userAccessRequests,
  drawingRequests,
  drawings,
  drawingRevisions,
  approvalActions,
  revisionApprovalSteps,
  auditLogs,
  downloadLogs,
  notifications
};
