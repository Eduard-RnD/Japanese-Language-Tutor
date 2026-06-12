import { useState } from "react";
import {
  useListWords,
  useListTopics,
  useCreateWord,
  useUpdateWord,
  useDeleteWord,
  getListWordsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Plus,
  Search,
  Pencil,
  Trash2,
  BookOpen,
  Download,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type Alphabet = "hiragana" | "katakana" | "kanji";

interface WordForm {
  japanese: string;
  reading: string;
  translation: string;
  alphabet: Alphabet;
  topicId: string;
  notes: string;
}

const EMPTY_FORM: WordForm = {
  japanese: "",
  reading: "",
  translation: "",
  alphabet: "hiragana",
  topicId: "none",
  notes: "",
};

const ALPHABET_COLORS: Record<Alphabet, string> = {
  hiragana: "bg-blue-100 text-blue-800 border-blue-200",
  katakana: "bg-purple-100 text-purple-800 border-purple-200",
  kanji: "bg-rose-100 text-rose-800 border-rose-200",
};

export default function Words() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterAlphabet, setFilterAlphabet] = useState<string>("all");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<WordForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const alphabetFilter = (["hiragana", "katakana", "kanji"] as const).includes(
    filterAlphabet as "hiragana" | "katakana" | "kanji",
  )
    ? (filterAlphabet as "hiragana" | "katakana" | "kanji")
    : undefined;

  const queryParams: {
    alphabet?: "hiragana" | "katakana" | "kanji";
    topicId?: number;
  } = {
    ...(alphabetFilter && { alphabet: alphabetFilter }),
    ...(filterTopic !== "all" && { topicId: parseInt(filterTopic) }),
  };

  const { data: words, isLoading: wordsLoading } = useListWords(queryParams, {
    query: { queryKey: getListWordsQueryKey(queryParams) },
  });
  const { data: topics } = useListTopics();
  const createWord = useCreateWord();
  const updateWord = useUpdateWord();
  const deleteWord = useDeleteWord();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListWordsQueryKey() });
  };

  const filtered =
    words?.filter((w) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        w.japanese.toLowerCase().includes(q) ||
        w.reading.toLowerCase().includes(q) ||
        w.translation.toLowerCase().includes(q)
      );
    }) ?? [];

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (w: NonNullable<typeof words>[number]) => {
    setEditingId(w.id);
    setForm({
      japanese: w.japanese,
      reading: w.reading,
      translation: w.translation,
      alphabet: w.alphabet as Alphabet,
      topicId: w.topicId ? String(w.topicId) : "none",
      notes: w.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.japanese || !form.reading || !form.translation) {
      toast({
        title: "Заполните обязательные поля",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      japanese: form.japanese,
      reading: form.reading,
      translation: form.translation,
      alphabet: form.alphabet,
      topicId: form.topicId !== "none" ? parseInt(form.topicId) : null,
      notes: form.notes || null,
    };

    if (editingId !== null) {
      updateWord.mutate(
        { id: editingId, data: payload as any },
        {
          onSuccess: () => {
            toast({ title: "Слово обновлено" });
            setDialogOpen(false);
            invalidate();
          },
          onError: () =>
            toast({
              title: "Не удалось обновить слово",
              variant: "destructive",
            }),
        },
      );
    } else {
      createWord.mutate(
        { data: payload as any },
        {
          onSuccess: () => {
            toast({ title: "Слово добавлено" });
            setDialogOpen(false);
            invalidate();
          },
          onError: () =>
            toast({
              title: "Не удалось добавить слово",
              variant: "destructive",
            }),
        },
      );
    }
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteWord.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          toast({ title: "Слово удалено" });
          setDeleteId(null);
          invalidate();
        },
        onError: () =>
          toast({ title: "Не удалось удалить слово", variant: "destructive" }),
      },
    );
  };

  const isPending = createWord.isPending || updateWord.isPending;

  const handleExportCsv = () => {
    window.location.href = "/api/words/export/csv";
  };

  const handleImportCsv = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const csv = await file.text();

    const response = await fetch("/api/words/import/csv", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ csv }),
    });

    if (!response.ok) {
      toast({
        title: "Не удалось импортировать CSV",
        description: "Проверьте файл и попробуйте ещё раз.",
        variant: "destructive",
      });
      return;
    }

    const result = await response.json();

    toast({
      title: "Импорт завершён",
      description: `Импортировано слов: ${result.imported}.`,
    });

    invalidate();
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">
            Словарь
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Всего слов: {words?.length ?? 0}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Экспорт CSV
          </Button>

          {isAdmin && (
            <label>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleImportCsv}
              />
              <Button variant="outline" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Импорт CSV
                </span>
              </Button>
            </label>
          )}

          {isAdmin && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Добавить слово
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card border rounded-lg p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Поиск по символу, чтению или значению..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterAlphabet} onValueChange={setFilterAlphabet}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Система письма" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все системы</SelectItem>
            <SelectItem value="hiragana">Хирагана</SelectItem>
            <SelectItem value="katakana">Катакана</SelectItem>
            <SelectItem value="kanji">Кандзи</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTopic} onValueChange={setFilterTopic}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Тема" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все темы</SelectItem>
            {topics?.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Word List */}
      {wordsLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Загружаем слова...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <BookOpen className="w-10 h-10 opacity-30" />
          <p className="text-lg">
            {search ? "По вашему запросу ничего не найдено" : "Слов пока нет"}
          </p>
          {!search && isAdmin && (
            <Button
              variant="outline"
              onClick={openCreate}
              className="gap-2 mt-2"
            >
              <Plus className="w-4 h-4" />
              Добавить первое слово
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((word, i) => (
            <div
              key={word.id}
              className="flex items-center gap-4 bg-card border rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow group animate-in fade-in slide-in-from-bottom-1"
              style={{
                animationDelay: `${i * 30}ms`,
                animationFillMode: "both",
              }}
            >
              <div className="w-16 text-center shrink-0">
                <span className="text-2xl font-serif text-primary" lang="ja">
                  {word.japanese}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">
                  {word.reading}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {word.translation}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ALPHABET_COLORS[word.alphabet as Alphabet]}`}
                >
                  {word.alphabet}
                </span>
                {word.topicName && (
                  <Badge variant="secondary" className="text-xs">
                    {word.topicName}
                  </Badge>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                <span className="text-green-600 font-medium">
                  {word.correctCount}✓
                </span>
                <span className="text-destructive font-medium">
                  {word.incorrectCount}✗
                </span>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(word)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(word.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      {isAdmin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif">
                {editingId !== null ? "Редактировать слово" : "Добавить слово"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Японский символ или слово *</Label>
                <Input
                  value={form.japanese}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, japanese: e.target.value }))
                  }
                  placeholder="あ, 山, コーヒー..."
                  className="text-xl font-serif"
                  lang="ja"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Чтение *</Label>
                  <Input
                    value={form.reading}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, reading: e.target.value }))
                    }
                    placeholder="e.g. koohii"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Перевод *</Label>
                  <Input
                    value={form.translation}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, translation: e.target.value }))
                    }
                    placeholder="e.g. coffee"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Система письма *</Label>
                  <Select
                    value={form.alphabet}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, alphabet: v as Alphabet }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hiragana">Хирагана</SelectItem>
                      <SelectItem value="katakana">Катакана</SelectItem>
                      <SelectItem value="kanji">Кандзи</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Тема</Label>
                  <Select
                    value={form.topicId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, topicId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Без темы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без темы</SelectItem>
                      {topics?.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Заметки (необязательно)</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Дополнительные заметки о слове"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId !== null ? "Сохранить изменения" : "Добавить слово"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {isAdmin && (
        <AlertDialog
          open={deleteId !== null}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить это слово?</AlertDialogTitle>
              <AlertDialogDescription>
                Слово и вся связанная с ним история тренировок будут удалены.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
