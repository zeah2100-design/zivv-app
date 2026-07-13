import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  date,
  jsonb,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// === Enums ===
export const mediaTypeEnum = pgEnum("media_type", [
  "text",
  "image",
  "video",
  "short",
]);

export const friendStatusEnum = pgEnum("friend_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const chatVisibilityEnum = pgEnum("chat_visibility", [
  "normal",
  "vault",
]);

export const themeEnum = pgEnum("theme", ["light", "dark", "auto"]);

// === Users ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 80 }).notNull(),
  lastName: varchar("last_name", { length: 80 }).notNull(),
  age: integer("age").notNull(),
  email: varchar("email", { length: 160 }),
  phone: varchar("phone", { length: 32 }),
  passwordHash: text("password_hash"),
  bio: text("bio").default(""),
  avatarColor: varchar("avatar_color", { length: 60 }).default("from-violet-500 to-fuchsia-500"),
  interests: jsonb("interests").$type<string[]>().default([]),
  theme: themeEnum("theme").default("dark"),
  showOnline: boolean("show_online").default(true),
  contentFilter: boolean("content_filter").default(true),
  parentalControl: boolean("parental_control").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Master account fields
  isMaster: boolean("is_master").default(false),
  fullLegalName: varchar("full_legal_name", { length: 200 }),
  birthDate: date("birth_date"),
  masterPasswordHash: text("master_password_hash"),
  // Golden subscription
  isGolden: boolean("is_golden").default(false),
});

// (OTP tables removed — login is now by first name + last name + password)

// === Sessions (simple cookie-based) ===
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Posts ===
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  mediaType: mediaTypeEnum("media_type").default("text").notNull(),
  mediaUrl: text("media_url"),
  musicUrl: text("music_url"),
  musicName: text("music_name"),
  tags: jsonb("tags").$type<string[]>().default([]),
  views: integer("views").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Comments ===
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isAi: boolean("is_ai").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Likes ===
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Friendships ===
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  addresseeId: integer("addressee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: friendStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Chats (conversations) ===
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userAId: integer("user_a_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  userBId: integer("user_b_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  visibility: chatVisibilityEnum("visibility").default("normal").notNull(),
  vaultPin: text("vault_pin"),
  autoDisappear: boolean("auto_disappear").default(false),
  hideNotifications: boolean("hide_notifications").default(false),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Messages ===
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isAi: boolean("is_ai").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Statuses (Stories) ===
export const statuses = pgTable("statuses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  backgroundColor: varchar("background_color", { length: 80 })
    .default("from-violet-500 to-fuchsia-500")
    .notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Status Views ===
export const statusViews = pgTable("status_views", {
  id: serial("id").primaryKey(),
  statusId: integer("status_id")
    .notNull()
    .references(() => statuses.id, { onDelete: "cascade" }),
  viewerId: integer("viewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

// === Notifications (real-time) ===
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 40 }).notNull(), // 'friend_request' | 'message' | 'like' | 'comment' | 'golden_approved' | etc
  fromUserId: integer("from_user_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Golden subscription perks ===
export const userPerks = pgTable("user_perks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  customAvatar: boolean("custom_avatar").default(true).notNull(), // upload custom photo
  verifiedBadge: boolean("verified_badge").default(true).notNull(), // ✓ verified
  unlimitedStorage: boolean("unlimited_storage").default(true).notNull(),
  customThemes: boolean("custom_themes").default(true).notNull(),
  prioritySupport: boolean("priority_support").default(true).notNull(),
  noAds: boolean("no_ads").default(true).notNull(),
  advancedAnalytics: boolean("advanced_analytics").default(true).notNull(),
  unlimitedFriends: boolean("unlimited_friends").default(true).notNull(),
  chatThemes: boolean("chat_themes").default(true).notNull(),
  customStatusDuration: boolean("custom_status_duration").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === Subscription Requests ===
export const subscriptionRequests = pgTable("subscription_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  masterId: integer("master_id").references(() => users.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  message: text("message"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Advanced Status Updates (text/image/video with text overlay) ===
export const statusUpdates = pgTable("status_updates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(),
  content: text("content"),
  mediaUrl: text("media_url"),
  backgroundColor: varchar("background_color", { length: 60 }).default("from-violet-500 to-fuchsia-500"),
  textColor: varchar("text_color", { length: 20 }).default("white"),
  textPosition: varchar("text_position", { length: 20 }).default("center"),
  fontSize: integer("font_size").default(24),
  fontFamily: varchar("font_family", { length: 60 }).default("cairo"),
  viewsCount: integer("views_count").default(0).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const statusUpdateViews = pgTable("status_update_views", {
  id: serial("id").primaryKey(),
  statusId: integer("status_id").notNull().references(() => statusUpdates.id, { onDelete: "cascade" }),
  viewerId: integer("viewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

// === Music library ===
export const musicLibrary = pgTable("music_library", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  artist: varchar("artist", { length: 120 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // pop, dramatic, calm, sad
  durationSec: integer("duration_sec").default(30).notNull(),
  emoji: varchar("emoji", { length: 8 }).default("🎵").notNull(),
  color: varchar("color", { length: 80 }).default("from-violet-500 to-fuchsia-500").notNull(),
  isOriginal: boolean("is_original").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Relations ===
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  statuses: many(statuses),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.userId], references: [users.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  userA: one(users, { fields: [chats.userAId], references: [users.id] }),
  userB: one(users, { fields: [chats.userBId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Status = typeof statuses.$inferSelect;
export type Music = typeof musicLibrary.$inferSelect;
