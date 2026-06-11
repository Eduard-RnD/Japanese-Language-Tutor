import { useState, useEffect } from "react";
import { 
  useGetNextPracticeWord, 
  useCheckAnswer, 
  useListTopics 
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeak } from "@/hooks/use-speak";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, ArrowRight, CheckCircle2, XCircle, Volume2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const answerSchema = z.object({
  reading: z.string().min(1, "Reading is required"),
  translation: z.string().min(1, "Translation is required"),
});

export default function Practice() {
  const { toast } = useToast();
  const { speak, speaking } = useSpeak();
  const [alphabets, setAlphabets] = useState<string[]>(["hiragana", "katakana", "kanji"]);
  const [topicId, setTopicId] = useState<string>("all");
  
  const { data: topics, isLoading: topicsLoading } = useListTopics();

  const queryParams = {
    alphabets: alphabets.join(","),
    topicId: topicId === "all" ? null : parseInt(topicId),
  };

  const { 
    data: practiceWord, 
    isLoading: wordLoading,
    refetch: fetchNextWord,
    isFetching: isFetchingWord
  } = useGetNextPracticeWord(queryParams, {
    query: {
      enabled: alphabets.length > 0,
      staleTime: 0,
    }
  });

  const checkAnswer = useCheckAnswer();
  const [result, setResult] = useState<any>(null);

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
        }
      },
      {
        onSuccess: (data) => {
          setResult(data);
        },
        onError: () => {
          toast({
            title: "Error checking answer",
            description: "Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleNext = () => {
    fetchNextWord();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-2xl space-y-8">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg shadow-sm border">
          <div className="space-y-1.5 w-full sm:w-auto">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Alphabets</Label>
            <ToggleGroup 
              type="multiple" 
              value={alphabets} 
              onValueChange={(val) => {
                if (val.length > 0) setAlphabets(val);
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="hiragana" aria-label="Toggle hiragana">Hiragana</ToggleGroupItem>
              <ToggleGroupItem value="katakana" aria-label="Toggle katakana">Katakana</ToggleGroupItem>
              <ToggleGroupItem value="kanji" aria-label="Toggle kanji">Kanji</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-1.5 w-full sm:w-48">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Topic</Label>
            <Select value={topicId} onValueChange={setTopicId} disabled={topicsLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topics?.map(t => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-2 shadow-md relative overflow-hidden bg-card/80 backdrop-blur-sm">
          {(wordLoading || isFetchingWord) && !result ? (
            <div className="h-[400px] flex items-center justify-center flex-col gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Preparing next word...</p>
            </div>
          ) : !practiceWord ? (
            <div className="h-[400px] flex items-center justify-center flex-col gap-4 text-muted-foreground p-8 text-center">
              <p className="text-lg">No words found for this selection.</p>
              <p className="text-sm">Try changing your alphabet or topic filters, or add some words to your library first.</p>
            </div>
          ) : (
            <>
              <CardHeader className="text-center pb-0 pt-12">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
                  {practiceWord.alphabet} • {practiceWord.topicName || "General"}
                </div>

                {/* Japanese character + pronounce button */}
                <div className="flex flex-col items-center gap-4 mb-8">
                  <h2 className="text-7xl md:text-9xl font-serif text-primary" lang="ja">
                    {practiceWord.japanese}
                  </h2>
                  <button
                    type="button"
                    onClick={() => speak(practiceWord.japanese)}
                    disabled={speaking}
                    title="Pronounce"
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium
                      transition-all duration-200 select-none
                      ${speaking
                        ? "border-primary/40 text-primary bg-primary/10 cursor-default"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 active:scale-95"
                      }
                    `}
                  >
                    <Volume2
                      className={`w-4 h-4 transition-transform ${speaking ? "scale-110 animate-pulse" : ""}`}
                    />
                    <span>{speaking ? "Playing..." : "Pronounce"}</span>
                  </button>
                </div>
              </CardHeader>

              <CardContent className="px-6 md:px-12 pb-12">
                {!result ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="reading"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-muted-foreground">Reading (Kana/Romaji)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. arigatou" 
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
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="translation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-muted-foreground">Meaning (English)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. thank you" 
                                  className="text-lg py-6 bg-background/50 focus:bg-background transition-colors"
                                  autoComplete="off"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
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
                          {checkAnswer.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                          Check Answer
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
                            <h3 className="text-2xl font-bold text-emerald-600">Perfect!</h3>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-8 w-8 text-destructive" />
                            <h3 className="text-2xl font-bold text-destructive">Keep practicing</h3>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left divide-y md:divide-y-0 md:divide-x">
                        <div className="pt-4 md:pt-0 md:px-4">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Reading</Label>
                          <div className={`text-xl font-medium ${result.readingCorrect ? 'text-emerald-600' : 'text-destructive'}`}>
                            Your answer: {form.getValues().reading}
                          </div>
                          {!result.readingCorrect && (
                            <div className="text-lg text-foreground mt-2 bg-secondary/50 p-2 rounded">
                              Correct: <span className="font-bold font-serif">{result.correctReading}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-4 md:pt-0 md:px-4">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Meaning</Label>
                          <div className={`text-xl font-medium ${result.translationCorrect ? 'text-emerald-600' : 'text-destructive'}`}>
                            Your answer: {form.getValues().translation}
                          </div>
                          {!result.translationCorrect && (
                            <div className="text-lg text-foreground mt-2 bg-secondary/50 p-2 rounded">
                              Correct: <span className="font-bold">{result.correctTranslation}</span>
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
                        Next Word
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
