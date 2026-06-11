import {
  useGetPracticeStats,
  useListWords,
} from "@workspace/api-client-react";
import { Loader2, TrendingUp, BookOpen, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const ALPHABET_COLORS: Record<string, string> = {
  hiragana: "bg-blue-500",
  katakana: "bg-purple-500",
  kanji: "bg-rose-500",
};

const ALPHABET_BG: Record<string, string> = {
  hiragana: "bg-blue-50 border-blue-200",
  katakana: "bg-purple-50 border-purple-200",
  kanji: "bg-rose-50 border-rose-200",
};

export default function Stats() {
  const { data: stats, isLoading } = useGetPracticeStats();
  const { data: words } = useListWords();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading statistics...
      </div>
    );
  }

  if (!stats) return null;

  const accuracyPct = Math.round(stats.accuracy * 100);

  const hiraCount = words?.filter((w) => w.alphabet === "hiragana").length ?? 0;
  const kataCount = words?.filter((w) => w.alphabet === "katakana").length ?? 0;
  const kanjiCount = words?.filter((w) => w.alphabet === "kanji").length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-primary">Statistics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your practice history at a glance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: "0ms", animationFillMode: "both" }}>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Total Words</span>
            </div>
            <p className="text-3xl font-bold text-primary font-serif">{stats.totalWords}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Attempts</span>
            </div>
            <p className="text-3xl font-bold text-primary font-serif">{stats.totalAttempts}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs uppercase tracking-wide">Correct</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600 font-serif">{stats.correctAttempts}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-xs uppercase tracking-wide">Wrong</span>
            </div>
            <p className="text-3xl font-bold text-destructive font-serif">
              {stats.totalAttempts - stats.correctAttempts}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy Bar */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Overall Accuracy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.totalAttempts === 0 ? (
            <p className="text-muted-foreground text-sm">
              No practice sessions yet. Start practicing to see your accuracy.
            </p>
          ) : (
            <>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">
                  {stats.correctAttempts} correct out of {stats.totalAttempts}
                </span>
                <span className="text-2xl font-bold font-serif text-primary">
                  {accuracyPct}%
                </span>
              </div>
              <Progress value={accuracyPct} className="h-3" />
            </>
          )}
        </CardContent>
      </Card>

      {/* Alphabet Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: "hiragana", label: "Hiragana", count: hiraCount },
          { key: "katakana", label: "Katakana", count: kataCount },
          { key: "kanji", label: "Kanji", count: kanjiCount },
        ].map((alpha, i) => {
          const stat = stats.alphabetBreakdown.find((a) => a.alphabet === alpha.key);
          const attempts = (stat?.correctCount ?? 0) + (stat?.incorrectCount ?? 0);
          const pct = attempts > 0 ? Math.round(((stat?.correctCount ?? 0) / attempts) * 100) : 0;

          return (
            <Card
              key={alpha.key}
              className={`shadow-sm border-2 animate-in fade-in slide-in-from-bottom-2 ${ALPHABET_BG[alpha.key]}`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <CardContent className="pt-5 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-base capitalize">{alpha.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {alpha.count} words
                  </Badge>
                </div>
                {attempts > 0 ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{attempts} attempts</span>
                      <span className="font-semibold">{pct}% correct</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="text-emerald-600 font-medium">{stat?.correctCount ?? 0} correct</span>
                      <span className="text-destructive font-medium">{stat?.incorrectCount ?? 0} wrong</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No attempts yet</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Topic Breakdown */}
      {stats.topicBreakdown.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg">By Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topicBreakdown
                .sort((a, b) => b.wordCount - a.wordCount)
                .map((topic, i) => {
                  const attempts = topic.correctCount + topic.incorrectCount;
                  const pct = attempts > 0 ? Math.round((topic.correctCount / attempts) * 100) : 0;

                  return (
                    <div
                      key={topic.topicName}
                      className="space-y-2 animate-in fade-in"
                      style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{topic.topicName}</span>
                          <Badge variant="outline" className="text-xs">
                            {topic.wordCount} words
                          </Badge>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {attempts > 0 ? `${pct}%` : "—"}
                        </span>
                      </div>
                      {attempts > 0 && (
                        <div className="flex items-center gap-3">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground w-24 text-right shrink-0">
                            {topic.correctCount}/{attempts}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
