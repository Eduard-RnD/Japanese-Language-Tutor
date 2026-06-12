import { Router } from "express";
import { db, wordsTable, topicsTable } from "@workspace/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import {
  GetNextPracticeWordQueryParams,
  CheckAnswerBody,
} from "@workspace/api-zod";
import { requireAuth } from "../auth";

const router = Router();

router.get("/practice/next", async (req, res) => {
  const rawTopicId = req.query.topicId;
  const topicIdNum =
    rawTopicId && rawTopicId !== "null" ? Number(rawTopicId) : undefined;

  const query = GetNextPracticeWordQueryParams.parse({
    alphabets: req.query.alphabets,
    topicId: topicIdNum,
  });

  const alphabetList = query.alphabets
    .split(",")
    .map((a) => a.trim())
    .filter((a): a is "hiragana" | "katakana" | "kanji" =>
      ["hiragana", "katakana", "kanji"].includes(a),
    );
  if (alphabetList.length === 0) {
    res.status(400).json({ error: "At least one alphabet required" });
    return;
  }

  const conditions = [inArray(wordsTable.alphabet, alphabetList)];
  if (query.topicId != null)
    conditions.push(eq(wordsTable.topicId, query.topicId));

  const words = await db
    .select({
      id: wordsTable.id,
      japanese: wordsTable.japanese,
      reading: wordsTable.reading,
      translation: wordsTable.translation,
      alphabet: wordsTable.alphabet,
      topicName: topicsTable.name,
    })
    .from(wordsTable)
    .leftJoin(topicsTable, eq(topicsTable.id, wordsTable.topicId))
    .where(and(...conditions))
    .orderBy(sql`random()`)
    .limit(1);

  if (!words[0]) {
    res.status(404).json({ error: "No words found for the given filters" });
    return;
  }

  res.json(words[0]);
});

router.post("/practice/check", async (req, res) => {
  const body = CheckAnswerBody.parse(req.body);

  const [word] = await db
    .select()
    .from(wordsTable)
    .where(eq(wordsTable.id, body.wordId));

  if (!word) {
    res.status(404).json({ error: "Word not found" });
    return;
  }

  const normalize = (s: string) => s.trim().toLowerCase();
  const readingCorrect = normalize(body.reading) === normalize(word.reading);
  const translationCorrect =
    normalize(body.translation) === normalize(word.translation);
  const correct = readingCorrect && translationCorrect;

  await db
    .update(wordsTable)
    .set(
      correct
        ? { correctCount: sql`${wordsTable.correctCount} + 1` }
        : { incorrectCount: sql`${wordsTable.incorrectCount} + 1` },
    )
    .where(eq(wordsTable.id, body.wordId));

  res.json({
    correct,
    readingCorrect,
    translationCorrect,
    correctReading: word.reading,
    correctTranslation: word.translation,
    japanese: word.japanese,
  });
});

router.get("/practice/stats", requireAuth, async (req, res) => {
  // TODO: Move statistics from global word counters to per-user practice_attempts.
  const words = await db
    .select({
      id: wordsTable.id,
      alphabet: wordsTable.alphabet,
      topicId: wordsTable.topicId,
      topicName: topicsTable.name,
      correctCount: wordsTable.correctCount,
      incorrectCount: wordsTable.incorrectCount,
    })
    .from(wordsTable)
    .leftJoin(topicsTable, eq(topicsTable.id, wordsTable.topicId));

  const totalWords = words.length;
  const totalCorrect = words.reduce((s, w) => s + w.correctCount, 0);
  const totalIncorrect = words.reduce((s, w) => s + w.incorrectCount, 0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  const alphabetMap = new Map<
    string,
    { wordCount: number; correctCount: number; incorrectCount: number }
  >();
  const topicMap = new Map<
    string,
    { wordCount: number; correctCount: number; incorrectCount: number }
  >();

  for (const w of words) {
    const a = alphabetMap.get(w.alphabet) ?? {
      wordCount: 0,
      correctCount: 0,
      incorrectCount: 0,
    };
    a.wordCount++;
    a.correctCount += w.correctCount;
    a.incorrectCount += w.incorrectCount;
    alphabetMap.set(w.alphabet, a);

    const topicKey = w.topicName ?? "No topic";
    const t = topicMap.get(topicKey) ?? {
      wordCount: 0,
      correctCount: 0,
      incorrectCount: 0,
    };
    t.wordCount++;
    t.correctCount += w.correctCount;
    t.incorrectCount += w.incorrectCount;
    topicMap.set(topicKey, t);
  }

  res.json({
    totalWords,
    totalAttempts,
    correctAttempts: totalCorrect,
    accuracy,
    topicBreakdown: Array.from(topicMap.entries()).map(([topicName, s]) => ({
      topicName,
      ...s,
    })),
    alphabetBreakdown: Array.from(alphabetMap.entries()).map(
      ([alphabet, s]) => ({ alphabet, ...s }),
    ),
  });
});

export default router;
