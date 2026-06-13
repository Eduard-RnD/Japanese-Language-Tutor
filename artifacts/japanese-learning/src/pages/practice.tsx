import { useState, useEffect } from "react";
import {
  useGetNextPracticeWord,
  useCheckAnswer,
  useListTopics,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeak } from "@/hooks/use-speak";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  basicKanji,
  hiraganaChart,
  katakanaChart,
} from "@/lib/japanese-alphabets";
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Volume2,
  X,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const answerSchema = z.object({
  reading: z.string().min(1, "Введите чтение"),
  translation: z.string().min(1, "Введите перевод"),
});

const alphabetLabels: Record<string, string> = {
  hiragana: "Хирагана",
  katakana: "Катакана",
  kanji: "Кандзи",
};

type ReferenceTab = "hiragana" | "katakana" | "kanji";

const referenceTabs: Array<{ key: ReferenceTab; label: string }> = [
  { key: "hiragana", label: "Хирагана" },
  { key: "katakana", label: "Катакана" },
  { key: "kanji", label: "Кандзи" },
];

function ReferenceTabs({
  activeTab,
  onSelect,
  mobile = false,
}: {
  activeTab: ReferenceTab | null;
  onSelect: (tab: ReferenceTab) => void;
  mobile?: boolean;
}) {
  return (
    <div
      className={
        mobile ? "flex justify-center gap-2" : "flex flex-col gap-1 pt-6"
      }
    >
      {referenceTabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          aria-pressed={activeTab === tab.key}
          onClick={() => onSelect(tab.key)}
          className={`border text-sm font-medium transition-colors ${
            mobile
              ? "rounded-md px-3 py-2"
              : "h-28 w-10 rounded-r-md [writing-mode:vertical-rl]"
          } ${
            activeTab === tab.key
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ReferencePanel({
  activeTab,
  onClose,
  mobile = false,
}: {
  activeTab: ReferenceTab;
  onClose: () => void;
  mobile?: boolean;
}) {
  const chart = activeTab === "hiragana" ? hiraganaChart : katakanaChart;

  return (
    <Card
      className={mobile ? "shadow-sm" : "h-[620px] w-72 shrink-0 shadow-md"}
    >
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-primary">
              Справочник
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Откройте алфавит, если забыли символ.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть справочник"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="pt-2 text-sm font-semibold">
          {referenceTabs.find((tab) => tab.key === activeTab)?.label}
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ScrollArea className={mobile ? "h-[460px]" : "h-[490px]"}>
          {activeTab === "kanji" ? (
            <div className="grid grid-cols-2 gap-2 pr-3">
              {basicKanji.map((kanji) => (
                <div
                  key={kanji.symbol}
                  className="rounded-md border bg-background/60 p-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="font-serif text-2xl text-primary" lang="ja">
                    {kanji.symbol}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {kanji.meaning}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 pr-3">
              {chart.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`grid gap-1 ${row.length === 5 ? "grid-cols-5" : "grid-cols-3"}`}
                >
                  {row.map((item) => (
                    <div
                      key={item.symbol}
                      className="rounded-md border bg-background/60 py-2 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div
                        className="font-serif text-2xl text-primary"
                        lang="ja"
                      >
                        {item.symbol}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {item.romaji}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function Practice() {
  const { toast } = useToast();
  const { speak, speaking } = useSpeak();
  const [alphabets, setAlphabets] = useState<string[]>([
    "hiragana",
    "katakana",
    "kanji",
  ]);
  const [topicId, setTopicId] = useState<string>("all");
  const [referenceTab, setReferenceTab] = useState<ReferenceTab | null>(null);

  const { data: topics, isLoading: topicsLoading } = useListTopics();

  const queryParams = {
    alphabets: alphabets.join(","),
    topicId: topicId === "all" ? null : parseInt(topicId),
  };

  const {
    data: practiceWord,
    isLoading: wordLoading,
    refetch: fetchNextWord,
    isFetching: isFetchingWord,
    isError: wordError,
  } = useGetNextPracticeWord(queryParams, {
    query: {
      queryKey: ["practice-word", queryParams],
      enabled: alphabets.length > 0,
      staleTime: 0,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  });

  const checkAnswer = useCheckAnswer();
  const [result, setResult] = useState<any>(null);
  const [showReading, setShowReading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const form = useForm<z.infer<typeof answerSchema>>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      reading: "",
      translation: "",
    },
  });

  useEffect(() => {
    if (practiceWord) {
      form.reset({ reading: "", translation: "" });
      setResult(null);
      setShowReading(false);
      setShowTranslation(false);
    }
  }, [practiceWord, form]);

  const onSubmit = (values: z.infer<typeof answerSchema>) => {
    if (!practiceWord) return;

    checkAnswer.mutate(
      {
        data: {
          wordId: practiceWord.id,
          reading: values.reading,
          translation: values.translation,
        },
      },
      {
        onSuccess: (data) => {
          setResult(data);
        },
        onError: () => {
          toast({
            title: "Не удалось проверить ответ",
            description: "Попробуйте ещё раз.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleNext = () => {
    fetchNextWord();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-[1100px] space-y-8">
        {/* Controls */}
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm sm:flex-row">
          <div className="space-y-1.5 w-full sm:w-auto">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Системы письма
            </Label>
            <ToggleGroup
              type="multiple"
              value={alphabets}
              onValueChange={(val) => {
                if (val.length > 0) setAlphabets(val);
              }}
              className="justify-start"
            >
              <ToggleGroupItem
                value="hiragana"
                aria-label="Переключить хирагану"
              >
                Хирагана
              </ToggleGroupItem>
              <ToggleGroupItem
                value="katakana"
                aria-label="Переключить катакану"
              >
                Катакана
              </ToggleGroupItem>
              <ToggleGroupItem value="kanji" aria-label="Переключить кандзи">
                Кандзи
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-1.5 w-full sm:w-48">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Тема
            </Label>
            <Select
              value={topicId}
              onValueChange={setTopicId}
              disabled={topicsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите тему" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все темы</SelectItem>
                {topics?.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Card */}
        <div className="flex items-start justify-center">
          <Card className="relative w-full max-w-2xl overflow-hidden border-2 bg-card/80 shadow-md backdrop-blur-sm lg:w-[672px] lg:shrink-0">
            {(wordLoading || isFetchingWord) && !result ? (
              <div className="h-[400px] flex items-center justify-center flex-col gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Готовим следующее слово...</p>
              </div>
            ) : wordError ? (
              <div className="flex h-[400px] flex-col items-center justify-center gap-4 p-8 text-center text-muted-foreground">
                <p className="text-lg font-medium text-foreground">
                  Не удалось загрузить слово
                </p>
                <p className="max-w-md text-sm">
                  Проверьте подключение к интернету и попробуйте ещё раз.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchNextWord()}
                >
                  Повторить загрузку
                </Button>
              </div>
            ) : !practiceWord ? (
              <div className="h-[400px] flex items-center justify-center flex-col gap-4 text-muted-foreground p-8 text-center">
                <p className="text-lg">
                  По выбранным параметрам слова не найдены.
                </p>
                <p className="text-sm">
                  Измените систему письма или тему либо сначала добавьте слова в
                  библиотеку.
                </p>
              </div>
            ) : (
              <>
                <CardHeader className="text-center pb-0 pt-12">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
                    {alphabetLabels[practiceWord.alphabet] ||
                      practiceWord.alphabet}{" "}
                    • {practiceWord.topicName || "Общая"}
                  </div>

                  {/* Japanese character + pronounce button */}
                  <div className="flex flex-col items-center gap-4 mb-8">
                    <h2
                      className="text-7xl md:text-9xl font-serif text-primary"
                      lang="ja"
                    >
                      {practiceWord.japanese}
                    </h2>
                    <button
                      type="button"
                      onClick={() => speak(practiceWord.japanese)}
                      disabled={speaking}
                      title="Произнести"
                      className={`
                      flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium
                      transition-all duration-200 select-none
                      ${
                        speaking
                          ? "border-primary/40 text-primary bg-primary/10 cursor-default"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 active:scale-95"
                      }
                    `}
                    >
                      <Volume2
                        className={`w-4 h-4 transition-transform ${speaking ? "scale-110 animate-pulse" : ""}`}
                      />
                      <span>
                        {speaking ? "Воспроизводится..." : "Произнести"}
                      </span>
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="px-6 md:px-12 pb-12">
                  {!result ? (
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="reading"
                            render={({ field }) => (
                              <div>
                                <FormItem>
                                  <FormLabel className="text-muted-foreground">
                                    Чтение (кана/ромадзи)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="например, arigatou"
                                      className="text-lg py-6 bg-background/50 focus:bg-background transition-colors"
                                      autoFocus
                                      autoComplete="off"
                                      autoCapitalize="off"
                                      autoCorrect="off"
                                      spellCheck="false"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>

                                <Button
                                  type="button"
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() => setShowReading((v) => !v)}
                                >
                                  {showReading
                                    ? "Скрыть чтение"
                                    : "Показать чтение"}
                                </Button>

                                {showReading && practiceWord && (
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    Правильное чтение:{" "}
                                    <span className="font-semibold">
                                      {practiceWord.reading}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="translation"
                            render={({ field }) => (
                              <div>
                                <FormItem>
                                  <FormLabel className="text-muted-foreground">
                                    Значение
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="например, спасибо"
                                      className="text-lg py-6 bg-background/50 focus:bg-background transition-colors"
                                      autoComplete="off"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>

                                <Button
                                  type="button"
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() => setShowTranslation((v) => !v)}
                                >
                                  {showTranslation
                                    ? "Скрыть значение"
                                    : "Показать значение"}
                                </Button>

                                {showTranslation && practiceWord && (
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    Правильное значение:{" "}
                                    <span className="font-semibold">
                                      {practiceWord.translation}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          />
                        </div>
                        <div className="pt-4 flex justify-center">
                          <Button
                            type="submit"
                            size="lg"
                            className="w-full md:w-auto px-12 py-6 text-lg font-medium shadow-sm hover:shadow-md transition-all"
                            disabled={checkAnswer.isPending}
                          >
                            {checkAnswer.isPending ? (
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : null}
                            Проверить ответ
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-300">
                      <div className="p-6 rounded-lg bg-background border shadow-sm">
                        <div className="flex items-center justify-center gap-3 mb-6">
                          {result.correct ? (
                            <>
                              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                              <h3 className="text-2xl font-bold text-emerald-600">
                                Отлично!
                              </h3>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-8 w-8 text-destructive" />
                              <h3 className="text-2xl font-bold text-destructive">
                                Продолжайте тренироваться
                              </h3>
                            </>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left divide-y md:divide-y-0 md:divide-x">
                          <div className="pt-4 md:pt-0 md:px-4">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                              Чтение
                            </Label>
                            <div
                              className={`text-xl font-medium ${result.readingCorrect ? "text-emerald-600" : "text-destructive"}`}
                            >
                              Ваш ответ: {form.getValues().reading}
                            </div>
                            {!result.readingCorrect && (
                              <div className="text-lg text-foreground mt-2 bg-secondary/50 p-2 rounded">
                                Правильно:{" "}
                                <span className="font-bold font-serif">
                                  {result.correctReading}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 md:pt-0 md:px-4">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                              Значение
                            </Label>
                            <div
                              className={`text-xl font-medium ${result.translationCorrect ? "text-emerald-600" : "text-destructive"}`}
                            >
                              Ваш ответ: {form.getValues().translation}
                            </div>
                            {!result.translationCorrect && (
                              <div className="text-lg text-foreground mt-2 bg-secondary/50 p-2 rounded">
                                Правильно:{" "}
                                <span className="font-bold">
                                  {result.correctTranslation}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <Button
                          onClick={handleNext}
                          size="lg"
                          className="w-full md:w-auto px-12 py-6 text-lg font-medium"
                        >
                          Следующее слово
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </>
            )}
          </Card>
          <div className="hidden lg:block">
            <ReferenceTabs
              activeTab={referenceTab}
              onSelect={(tab) =>
                setReferenceTab((current) => (current === tab ? null : tab))
              }
            />
          </div>
          {referenceTab && (
            <div className="ml-3 hidden lg:block">
              <ReferencePanel
                activeTab={referenceTab}
                onClose={() => setReferenceTab(null)}
              />
            </div>
          )}
        </div>

        <div className="space-y-3 lg:hidden">
          <ReferenceTabs
            activeTab={referenceTab}
            onSelect={(tab) =>
              setReferenceTab((current) => (current === tab ? null : tab))
            }
            mobile
          />
          {referenceTab && (
            <ReferencePanel
              activeTab={referenceTab}
              onClose={() => setReferenceTab(null)}
              mobile
            />
          )}
        </div>
      </div>
    </div>
  );
}
