import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { topicsTable } from "./topics";

export const alphabetEnum = ["hiragana", "katakana", "kanji"] as const;
export type Alphabet = (typeof alphabetEnum)[number];

export const wordsTable = pgTable("words", {
  id: serial("id").primaryKey(),
  japanese: text("japanese").notNull(),
  reading: text("reading").notNull(),
  translation: text("translation").notNull(),
  alphabet: text("alphabet").notNull().$type<Alphabet>(),
  topicId: integer("topic_id").references(() => topicsTable.id, { onDelete: "set null" }),
  notes: text("notes"),
  correctCount: integer("correct_count").default(0).notNull(),
  incorrectCount: integer("incorrect_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWordSchema = createInsertSchema(wordsTable).omit({
  id: true,
  correctCount: true,
  incorrectCount: true,
  createdAt: true,
});
export type InsertWord = z.infer<typeof insertWordSchema>;
export type Word = typeof wordsTable.$inferSelect;
