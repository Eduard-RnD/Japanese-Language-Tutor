import { Router } from "express";
import { db, wordsTable, topicsTable, insertWordSchema } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import {
  CreateWordBody,
  UpdateWordBody,
  ListWordsQueryParams,
  GetWordParams,
  UpdateWordParams,
  DeleteWordParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/words", async (req, res) => {
  const query = ListWordsQueryParams.parse({
    topicId: req.query.topicId ? Number(req.query.topicId) : undefined,
    alphabet: req.query.alphabet,
  });

  const conditions = [];
  if (query.topicId != null) conditions.push(eq(wordsTable.topicId, query.topicId));
  if (query.alphabet != null) conditions.push(eq(wordsTable.alphabet, query.alphabet));

  const rows = await db
    .select({
      id: wordsTable.id,
      japanese: wordsTable.japanese,
      reading: wordsTable.reading,
      translation: wordsTable.translation,
      alphabet: wordsTable.alphabet,
      topicId: wordsTable.topicId,
      topicName: topicsTable.name,
      notes: wordsTable.notes,
      correctCount: wordsTable.correctCount,
      incorrectCount: wordsTable.incorrectCount,
      createdAt: wordsTable.createdAt,
    })
    .from(wordsTable)
    .leftJoin(topicsTable, eq(topicsTable.id, wordsTable.topicId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(wordsTable.createdAt);

  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/words", async (req, res) => {
  const body = CreateWordBody.parse(req.body);
  const [word] = await db
    .insert(wordsTable)
    .values({
      japanese: body.japanese,
      reading: body.reading,
      translation: body.translation,
      alphabet: body.alphabet,
      topicId: body.topicId ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  const topicName = body.topicId
    ? (await db.select({ name: topicsTable.name }).from(topicsTable).where(eq(topicsTable.id, body.topicId)))[0]?.name
    : null;

  res.status(201).json({ ...word, topicName: topicName ?? null, createdAt: word.createdAt.toISOString() });
});

router.get("/words/:id", async (req, res) => {
  const { id } = GetWordParams.parse({ id: Number(req.params.id) });
  const rows = await db
    .select({
      id: wordsTable.id,
      japanese: wordsTable.japanese,
      reading: wordsTable.reading,
      translation: wordsTable.translation,
      alphabet: wordsTable.alphabet,
      topicId: wordsTable.topicId,
      topicName: topicsTable.name,
      notes: wordsTable.notes,
      correctCount: wordsTable.correctCount,
      incorrectCount: wordsTable.incorrectCount,
      createdAt: wordsTable.createdAt,
    })
    .from(wordsTable)
    .leftJoin(topicsTable, eq(topicsTable.id, wordsTable.topicId))
    .where(eq(wordsTable.id, id));

  if (!rows[0]) {
    res.status(404).json({ error: "Word not found" });
    return;
  }

  res.json({ ...rows[0], createdAt: rows[0].createdAt.toISOString() });
});

router.patch("/words/:id", async (req, res) => {
  const { id } = UpdateWordParams.parse({ id: Number(req.params.id) });
  const body = UpdateWordBody.parse(req.body);

  const [word] = await db
    .update(wordsTable)
    .set({
      ...(body.japanese !== undefined && { japanese: body.japanese }),
      ...(body.reading !== undefined && { reading: body.reading }),
      ...(body.translation !== undefined && { translation: body.translation }),
      ...(body.alphabet !== undefined && { alphabet: body.alphabet }),
      ...(body.topicId !== undefined && { topicId: body.topicId }),
      ...(body.notes !== undefined && { notes: body.notes }),
    })
    .where(eq(wordsTable.id, id))
    .returning();

  if (!word) {
    res.status(404).json({ error: "Word not found" });
    return;
  }

  const topicName = word.topicId
    ? (await db.select({ name: topicsTable.name }).from(topicsTable).where(eq(topicsTable.id, word.topicId)))[0]?.name
    : null;

  res.json({ ...word, topicName: topicName ?? null, createdAt: word.createdAt.toISOString() });
});

router.delete("/words/:id", async (req, res) => {
  const { id } = DeleteWordParams.parse({ id: Number(req.params.id) });
  await db.delete(wordsTable).where(eq(wordsTable.id, id));
  res.status(204).send();
});

export default router;
