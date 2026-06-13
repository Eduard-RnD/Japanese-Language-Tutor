import { Router } from "express";
import {
  db,
  practiceAttemptsTable,
  wordsTable,
  topicsTable,
} from "@workspace/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import {
  GetNextPracticeWordQueryParams,
  CheckAnswerBody,
} from "@workspace/api-zod";
import { getUserFromRequest, requireAuth } from "../auth";

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
  const user = getUserFromRequest(req);

  if (user) {
    await db.insert(practiceAttemptsTable).values({
      userId: user.id,
      wordId: body.wordId,
      readingCorrect,
      translationCorrect,
      correct,
    });
  }

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
  const user = getUserFromRequest(req)!;
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
    .leftJoin(topicsTable, eq(topicsTable.id, wordsTable.topicId));

  const attempts = await db
    .select({
      wordId: practiceAttemptsTable.wordId,
      correct: practiceAttemptsTable.correct,
      createdAt: practiceAttemptsTable.createdAt,
      japanese: wordsTable.japanese,
      reading: wordsTable.reading,
      translation: wordsTable.translation,
      alphabet: wordsTable.alphabet,
      topicName: topicsTable.name,
    })
    .from(practiceAttemptsTable)
    .innerJoin(wordsTable, eq(wordsTable.id, practiceAttemptsTable.wordId))
    .leftJoin(topicsTable, eq(topicsTable.id, wordsTable.topicId))
    .where(eq(practiceAttemptsTable.userId, user.id));

  const totalWords = words.length;
  const practicedWords = new Set(attempts.map((attempt) => attempt.wordId))
    .size;
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((attempt) => attempt.correct).length;
  const incorrectAttempts = totalAttempts - correctAttempts;
  const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

  const alphabetMap = new Map<
    string,
    {
      wordCount: number;
      practicedWordIds: Set<number>;
      correctCount: number;
      incorrectCount: number;
    }
  >();
  const topicMap = new Map<
    string,
    {
      wordCount: number;
      practicedWordIds: Set<number>;
      correctCount: number;
      incorrectCount: number;
    }
  >();

  for (const w of words) {
    const a = alphabetMap.get(w.alphabet) ?? {
      wordCount: 0,
      practicedWordIds: new Set<number>(),
      correctCount: 0,
      incorrectCount: 0,
    };
    a.wordCount++;
    alphabetMap.set(w.alphabet, a);

    const topicKey = w.topicName ?? "No topic";
    const t = topicMap.get(topicKey) ?? {
      wordCount: 0,
      practicedWordIds: new Set<number>(),
      correctCount: 0,
      incorrectCount: 0,
    };
    t.wordCount++;
    topicMap.set(topicKey, t);
  }

  const weakWordMap = new Map<
    number,
    {
      id: number;
      japanese: string;
      reading: string;
      translation: string;
      alphabet: string;
      topicName: string | null;
      correctCount: number;
      incorrectCount: number;
    }
  >();

  for (const attempt of attempts) {
    const alphabet = alphabetMap.get(attempt.alphabet)!;
    alphabet.practicedWordIds.add(attempt.wordId);
    if (attempt.correct) alphabet.correctCount++;
    else alphabet.incorrectCount++;

    const topic = topicMap.get(attempt.topicName ?? "No topic")!;
    topic.practicedWordIds.add(attempt.wordId);
    if (attempt.correct) topic.correctCount++;
    else topic.incorrectCount++;

    const weakWord = weakWordMap.get(attempt.wordId) ?? {
      id: attempt.wordId,
      japanese: attempt.japanese,
      reading: attempt.reading,
      translation: attempt.translation,
      alphabet: attempt.alphabet,
      topicName: attempt.topicName,
      correctCount: 0,
      incorrectCount: 0,
    };
    if (attempt.correct) weakWord.correctCount++;
    else weakWord.incorrectCount++;
    weakWordMap.set(attempt.wordId, weakWord);
  }

  const activityMap = new Map<
    string,
    { attempts: number; correct: number; incorrect: number }
  >();
  for (const attempt of attempts) {
    const date = attempt.createdAt.toISOString().slice(0, 10);
    const activity = activityMap.get(date) ?? {
      attempts: 0,
      correct: 0,
      incorrect: 0,
    };
    activity.attempts++;
    if (attempt.correct) activity.correct++;
    else activity.incorrect++;
    activityMap.set(date, activity);
  }

  const activityLast30Days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (29 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      ...(activityMap.get(key) ?? { attempts: 0, correct: 0, incorrect: 0 }),
    };
  });

  const alphabetBreakdown = Array.from(alphabetMap.entries()).map(
    ([alphabet, stat]) => {
      const attemptsCount = stat.correctCount + stat.incorrectCount;
      return {
        alphabet,
        wordCount: stat.wordCount,
        practicedWords: stat.practicedWordIds.size,
        correctCount: stat.correctCount,
        incorrectCount: stat.incorrectCount,
        attempts: attemptsCount,
        accuracy: attemptsCount > 0 ? stat.correctCount / attemptsCount : 0,
      };
    },
  );

  const topicBreakdown = Array.from(topicMap.entries())
    .map(([topicName, stat]) => {
      const attemptsCount = stat.correctCount + stat.incorrectCount;
      return {
        topicName,
        wordCount: stat.wordCount,
        practicedWords: stat.practicedWordIds.size,
        correctCount: stat.correctCount,
        incorrectCount: stat.incorrectCount,
        attempts: attemptsCount,
        accuracy: attemptsCount > 0 ? stat.correctCount / attemptsCount : 0,
      };
    })
    .filter((topic) => topic.attempts > 0)
    .sort((a, b) => a.accuracy - b.accuracy);

  const weakWords = Array.from(weakWordMap.values())
    .map((word) => {
      const attemptsCount = word.correctCount + word.incorrectCount;
      return {
        ...word,
        attempts: attemptsCount,
        accuracy: attemptsCount > 0 ? word.correctCount / attemptsCount : 0,
      };
    })
    .sort(
      (a, b) =>
        b.incorrectCount - a.incorrectCount ||
        a.accuracy - b.accuracy ||
        b.attempts - a.attempts,
    )
    .slice(0, 10);

  const practicedKanji = alphabetBreakdown.some(
    (item) => item.alphabet === "kanji" && item.attempts > 0,
  );

  res.json({
    totalWords,
    practicedWords,
    totalAttempts,
    correctAttempts,
    incorrectAttempts,
    accuracy,
    alphabetBreakdown,
    topicBreakdown,
    weakWords,
    activityLast30Days,
    achievements: [
      {
        key: "first-practice",
        title: "Первая тренировка",
        description: "Завершить первую попытку",
        achieved: totalAttempts >= 1,
      },
      {
        key: "ten-attempts",
        title: "10 попыток",
        description: "Завершить 10 попыток",
        achieved: totalAttempts >= 10,
      },
      {
        key: "hundred-attempts",
        title: "100 попыток",
        description: "Завершить 100 попыток",
        achieved: totalAttempts >= 100,
      },
      {
        key: "accuracy-80",
        title: "Точность выше 80%",
        description: "Достичь точности 80% после 20 попыток",
        achieved: totalAttempts >= 20 && accuracy >= 0.8,
      },
      {
        key: "ten-words",
        title: "Первые 10 слов",
        description: "Попрактиковать 10 разных слов",
        achieved: practicedWords >= 10,
      },
      {
        key: "first-kanji",
        title: "Первые кандзи",
        description: "Попрактиковать кандзи",
        achieved: practicedKanji,
      },
    ],
  });
});

export default router;
