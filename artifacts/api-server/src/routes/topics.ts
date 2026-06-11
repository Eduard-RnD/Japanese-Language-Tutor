import { Router } from "express";
import { db, topicsTable, insertTopicSchema, wordsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateTopicBody,
  UpdateTopicBody,
  GetTopicParams,
  UpdateTopicParams,
  DeleteTopicParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/topics", async (req, res) => {
  const topics = await db
    .select({
      id: topicsTable.id,
      name: topicsTable.name,
      description: topicsTable.description,
      createdAt: topicsTable.createdAt,
      wordCount: sql<number>`cast(count(${wordsTable.id}) as int)`,
    })
    .from(topicsTable)
    .leftJoin(wordsTable, eq(wordsTable.topicId, topicsTable.id))
    .groupBy(topicsTable.id)
    .orderBy(topicsTable.name);

  res.json(
    topics.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  );
});

router.post("/topics", async (req, res) => {
  const body = CreateTopicBody.parse(req.body);
  const [topic] = await db
    .insert(topicsTable)
    .values({ name: body.name, description: body.description ?? null })
    .returning();

  res.status(201).json({ ...topic, wordCount: 0, createdAt: topic.createdAt.toISOString() });
});

router.get("/topics/:id", async (req, res) => {
  const { id } = GetTopicParams.parse({ id: Number(req.params.id) });
  const rows = await db
    .select({
      id: topicsTable.id,
      name: topicsTable.name,
      description: topicsTable.description,
      createdAt: topicsTable.createdAt,
      wordCount: sql<number>`cast(count(${wordsTable.id}) as int)`,
    })
    .from(topicsTable)
    .leftJoin(wordsTable, eq(wordsTable.topicId, topicsTable.id))
    .where(eq(topicsTable.id, id))
    .groupBy(topicsTable.id);

  if (!rows[0]) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }

  res.json({ ...rows[0], createdAt: rows[0].createdAt.toISOString() });
});

router.patch("/topics/:id", async (req, res) => {
  const { id } = UpdateTopicParams.parse({ id: Number(req.params.id) });
  const body = UpdateTopicBody.parse(req.body);

  const [topic] = await db
    .update(topicsTable)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
    })
    .where(eq(topicsTable.id, id))
    .returning();

  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }

  const [withCount] = await db
    .select({ wordCount: sql<number>`cast(count(${wordsTable.id}) as int)` })
    .from(topicsTable)
    .leftJoin(wordsTable, eq(wordsTable.topicId, topicsTable.id))
    .where(eq(topicsTable.id, id))
    .groupBy(topicsTable.id);

  res.json({ ...topic, wordCount: withCount?.wordCount ?? 0, createdAt: topic.createdAt.toISOString() });
});

router.delete("/topics/:id", async (req, res) => {
  const { id } = DeleteTopicParams.parse({ id: Number(req.params.id) });
  await db.delete(topicsTable).where(eq(topicsTable.id, id));
  res.status(204).send();
});

export default router;
