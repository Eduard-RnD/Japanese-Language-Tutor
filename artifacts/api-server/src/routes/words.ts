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
import { stringify } from "csv-stringify/sync";
import { parse } from "csv-parse/sync";
import { requireAdmin } from "../auth";

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

  res.json(rows.map((r) => ({
  ...r,
  notes: r.notes ?? "",
  topicName: r.topicName ?? null,
  createdAt: r.createdAt.toISOString(),
})));
});

router.post("/words", requireAdmin, async (req, res) => {
  const body = CreateWordBody.parse({
    ...req.body,
    notes: req.body.notes ?? "",
    topicId: req.body.topicId ?? null,
  });

  const [word] = await db
    .insert(wordsTable)
    .values({
      japanese: body.japanese,
      reading: body.reading,
      translation: body.translation,
      alphabet: body.alphabet,
      topicId: body.topicId,
      notes: body.notes,
    })
    .returning();

  const topicName = body.topicId
    ? (await db.select({ name: topicsTable.name }).from(topicsTable).where(eq(topicsTable.id, body.topicId)))[0]?.name
    : null;

  res.status(201).json({ ...word, topicName: topicName ?? null, createdAt: word.createdAt.toISOString() });
});

router.get("/words/export/csv", async (req, res) => {
  const rows = await db
    .select({
      japanese: wordsTable.japanese,
      reading: wordsTable.reading,
      translation: wordsTable.translation,
      alphabet: wordsTable.alphabet,
      topicId: wordsTable.topicId,
      notes: wordsTable.notes,
    })
    .from(wordsTable)
    .orderBy(wordsTable.createdAt);

  const csv = stringify(rows, {
    header: true,
    columns: ["japanese", "reading", "translation", "alphabet", "topicId", "notes"],
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=words.csv");
  res.send("\uFEFF" + csv);
});

router.post("/words/import/csv", requireAdmin, async (req, res) => {
  const csvText = req.body?.csv;

  if (!csvText || typeof csvText !== "string") {
    res.status(400).json({ error: "CSV text is required" });
    return;
  }

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  let imported = 0;

  for (const row of records) {
    if (!row.japanese || !row.reading || !row.translation || !row.alphabet) {
      continue;
    }

    if (!["hiragana", "katakana", "kanji"].includes(row.alphabet)) {
      continue;
    }

    await db.insert(wordsTable).values({
      japanese: row.japanese,
      reading: row.reading,
      translation: row.translation,
      alphabet: row.alphabet,
      topicId: row.topicId ? Number(row.topicId) : null,
      notes: row.notes ?? "",
    });

    imported++;
  }

  res.json({ imported });
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

router.patch("/words/:id", requireAdmin, async (req, res) => {
  const { id } = UpdateWordParams.parse({ id: Number(req.params.id) });
  const body = UpdateWordBody.parse({
  ...req.body,
  notes: req.body.notes ?? "",
});

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

router.delete("/words/:id", requireAdmin, async (req, res) => {
  const { id } = DeleteWordParams.parse({ id: Number(req.params.id) });
  await db.delete(wordsTable).where(eq(wordsTable.id, id));
  res.status(204).send();
});

export default router;
