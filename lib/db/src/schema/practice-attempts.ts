import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { wordsTable } from "./words";

export const practiceAttemptsTable = pgTable(
  "practice_attempts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    wordId: integer("word_id")
      .notNull()
      .references(() => wordsTable.id, { onDelete: "cascade" }),
    readingCorrect: boolean("reading_correct").default(false).notNull(),
    translationCorrect: boolean("translation_correct").default(false).notNull(),
    correct: boolean("correct").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_practice_attempts_user_id").on(table.userId),
    index("idx_practice_attempts_user_word").on(table.userId, table.wordId),
    index("idx_practice_attempts_created_at").on(table.createdAt),
  ],
);

export type PracticeAttempt = typeof practiceAttemptsTable.$inferSelect;
