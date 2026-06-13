import { useGetPracticeStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Flame,
  Loader2,
  RotateCcw,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BreakdownStat {
  alphabet?: string;
  topicName?: string;
  wordCount: number;
  practicedWords: number;
  correctCount: number;
  incorrectCount: number;
  attempts: number;
  accuracy: number;
}

interface StatsData {
  totalWords: number;
  practicedWords: number;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracy: number;
  alphabetBreakdown: BreakdownStat[];
  topicBreakdown: BreakdownStat[];
  weakWords: Array<{
    id: number;
    japanese: string;
    reading: string;
    translation: string;
    alphabet: string;
    topicName: string | null;
    correctCount: number;
    incorrectCount: number;
    attempts: number;
    accuracy: number;
  }>;
  activityLast30Days: Array<{
    date: string;
    attempts: number;
    correct: number;
    incorrect: number;
  }>;
  achievements: Array<{
    key: string;
    title: string;
    description: string;
    achieved: boolean;
  }>;
}

const ALPHABETS = [
  { key: "hiragana", label: "Хирагана", border: "border-blue-200" },
  { key: "katakana", label: "Катакана", border: "border-purple-200" },
  { key: "kanji", label: "Кандзи", border: "border-rose-200" },
];

const alphabetLabels: Record<string, string> = {
  hiragana: "Хирагана",
  katakana: "Катакана",
  kanji: "Кандзи",
};

function getAttempts(
  stat: Pick<BreakdownStat, "correctCount" | "incorrectCount">,
) {
  return stat.correctCount + stat.incorrectCount;
}

function getAccuracy(correct: number, incorrect: number) {
  const attempts = correct + incorrect;
  return attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
}

export default function Stats() {
  const { data: rawStats, isLoading: statsLoading } = useGetPracticeStats();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Загружаем статистику...
      </div>
    );
  }

  if (!rawStats) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          Не удалось загрузить статистику. Попробуйте обновить страницу.
        </CardContent>
      </Card>
    );
  }

  const stats = rawStats as StatsData;
  const accuracyPct = Math.round(stats.accuracy * 100);
  const firstInactiveDay = [...stats.activityLast30Days]
    .reverse()
    .findIndex((day) => day.attempts === 0);
  const currentStreak =
    firstInactiveDay === -1
      ? stats.activityLast30Days.length
      : firstInactiveDay;

  const sortedTopics = [...stats.topicBreakdown].sort((a, b) => {
    const aAttempts = getAttempts(a);
    const bAttempts = getAttempts(b);
    if (aAttempts === 0 && bAttempts > 0) return 1;
    if (bAttempts === 0 && aAttempts > 0) return -1;
    return (
      getAccuracy(a.correctCount, a.incorrectCount) -
      getAccuracy(b.correctCount, b.incorrectCount)
    );
  });

  const weakWords = stats.weakWords;
  const achievements = stats.achievements;

  const summaryCards = [
    { label: "Изучено слов", value: stats.practicedWords, icon: BookOpen },
    { label: "Всего попыток", value: stats.totalAttempts, icon: TrendingUp },
    { label: "Точность", value: `${accuracyPct}%`, icon: Target },
    { label: "Текущая серия", value: `${currentStreak} дней`, icon: Flame },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-primary">
          Статистика
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ваш прогресс, слабые места и следующие цели
        </p>
      </div>

      {stats.totalAttempts === 0 && (
        <Card className="border-dashed shadow-sm">
          <CardContent className="space-y-2 py-12 text-center">
            <h2 className="font-serif text-xl font-bold text-primary">
              У вас пока нет статистики
            </h2>
            <p className="text-sm text-muted-foreground">
              Пройдите первую тренировку, чтобы здесь появился прогресс.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.label} className="shadow-sm">
            <CardContent className="pb-4 pt-5">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <item.icon className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">
                  {item.label}
                </span>
              </div>
              <p className="font-serif text-2xl font-bold text-primary md:text-3xl">
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Общая точность</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.totalAttempts === 0 ? (
            <p className="text-sm text-muted-foreground">
              Пока нет попыток. Начните обучение, чтобы увидеть прогресс.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">
                  {stats.correctAttempts} правильных и {stats.incorrectAttempts}{" "}
                  неправильных ответов
                </span>
                <span className="font-serif text-2xl font-bold text-primary">
                  {accuracyPct}%
                </span>
              </div>
              <Progress value={accuracyPct} className="h-3" />
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-primary">
          Прогресс по системам письма
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ALPHABETS.map((alphabet) => {
            const stat = stats.alphabetBreakdown.find(
              (item) => item.alphabet === alphabet.key,
            );
            const correct = stat?.correctCount ?? 0;
            const incorrect = stat?.incorrectCount ?? 0;
            const attempts = stat?.attempts ?? 0;
            const accuracy = Math.round((stat?.accuracy ?? 0) * 100);

            return (
              <Card
                key={alphabet.key}
                className={`border-2 shadow-sm ${alphabet.border}`}
              >
                <CardContent className="space-y-4 pb-5 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-lg font-bold">
                      {alphabet.label}
                    </span>
                    <Badge variant="secondary">
                      {stat?.practicedWords ?? 0}/{stat?.wordCount ?? 0} слов
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Попытки</p>
                      <p className="text-lg font-semibold">{attempts}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Точность</p>
                      <p className="text-lg font-semibold">{accuracy}%</p>
                    </div>
                  </div>
                  <Progress value={accuracy} className="h-2" />
                  {attempts === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Попыток пока нет
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg">
            Прогресс по темам
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Темы пока не добавлены.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тема</TableHead>
                  <TableHead className="text-right">Слова</TableHead>
                  <TableHead className="text-right">Попытки</TableHead>
                  <TableHead className="text-right">Точность</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTopics.map((topic) => {
                  const attempts = topic.attempts;
                  return (
                    <TableRow key={topic.topicName}>
                      <TableCell className="font-medium">
                        {topic.topicName || "Без темы"}
                      </TableCell>
                      <TableCell className="text-right">
                        {topic.wordCount}
                      </TableCell>
                      <TableCell className="text-right">{attempts}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {attempts > 0
                          ? `${Math.round(topic.accuracy * 100)}%`
                          : "Нет попыток"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="font-serif text-lg">
              Слова для повторения
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Слова с наибольшим количеством ошибок
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/">
              <RotateCcw className="h-4 w-4" />
              Повторить слабые слова
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {weakWords.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Слабых слов пока нет. Продолжайте заниматься.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Слово</TableHead>
                  <TableHead>Чтение и перевод</TableHead>
                  <TableHead>Система</TableHead>
                  <TableHead className="text-right">Ошибки</TableHead>
                  <TableHead className="text-right">Точность</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weakWords.map((word) => (
                  <TableRow key={word.id}>
                    <TableCell
                      className="font-serif text-xl font-bold text-primary"
                      lang="ja"
                    >
                      {word.japanese}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{word.reading}</p>
                      <p className="text-xs text-muted-foreground">
                        {word.translation}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {alphabetLabels[word.alphabet] ?? word.alphabet}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {word.incorrectCount}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {Math.round(word.accuracy * 100)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Активность за 30 дней
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-1 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
              {stats.activityLast30Days.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.attempts} попыток`}
                  className={`aspect-square rounded-sm border ${
                    day.attempts === 0
                      ? "bg-muted/40"
                      : day.attempts < 3
                        ? "bg-primary/25"
                        : day.attempts < 6
                          ? "bg-primary/55"
                          : "bg-primary"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Award className="h-5 w-5 text-primary" />
              Достижения
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.title}
                className={`flex items-center gap-3 rounded-md border p-3 ${
                  achievement.achieved ? "bg-primary/5" : "opacity-50"
                }`}
              >
                <CheckCircle2
                  className={`h-5 w-5 shrink-0 ${
                    achievement.achieved
                      ? "text-emerald-600"
                      : "text-muted-foreground"
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
