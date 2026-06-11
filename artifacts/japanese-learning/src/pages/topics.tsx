import { useState } from "react";
import {
  useListTopics,
  useCreateTopic,
  useUpdateTopic,
  useDeleteTopic,
  getListTopicsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, Pencil, Trash2, Tags, BookOpen } from "lucide-react";
import { Link } from "wouter";

interface TopicForm {
  name: string;
  description: string;
}

const EMPTY_FORM: TopicForm = { name: "", description: "" };

export default function Topics() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TopicForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: topics, isLoading } = useListTopics();
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTopicsQueryKey() });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (t: NonNullable<typeof topics>[number]) => {
    setEditingId(t.id);
    setForm({ name: t.name, description: t.description ?? "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Topic name is required", variant: "destructive" });
      return;
    }

    const payload = {
      name: form.name.trim(),
      ...(form.description && { description: form.description }),
    };

    if (editingId !== null) {
      updateTopic.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Topic updated" });
            setDialogOpen(false);
            invalidate();
          },
          onError: () => toast({ title: "Failed to update topic", variant: "destructive" }),
        }
      );
    } else {
      createTopic.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "Topic created" });
            setDialogOpen(false);
            invalidate();
          },
          onError: () => toast({ title: "Failed to create topic", variant: "destructive" }),
        }
      );
    }
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteTopic.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          toast({ title: "Topic deleted" });
          setDeleteId(null);
          invalidate();
        },
        onError: () => toast({ title: "Failed to delete topic", variant: "destructive" }),
      }
    );
  };

  const isPending = createTopic.isPending || updateTopic.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Topics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organise your vocabulary by theme
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New Topic
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading topics...
        </div>
      ) : !topics || topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Tags className="w-10 h-10 opacity-30" />
          <p className="text-lg">No topics yet</p>
          <Button variant="outline" onClick={openCreate} className="gap-2 mt-2">
            <Plus className="w-4 h-4" />
            Create your first topic
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic, i) => (
            <div
              key={topic.id}
              className="bg-card border rounded-lg p-5 shadow-sm hover:shadow-md transition-all group flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-lg text-primary leading-tight">
                    {topic.name}
                  </h3>
                  {topic.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {topic.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(topic)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(topic.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>{topic.wordCount} word{topic.wordCount !== 1 ? "s" : ""}</span>
                </div>
                <Link href={`/words?topic=${topic.id}`}>
                  <button className="text-xs text-primary hover:underline font-medium">
                    View words
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId !== null ? "Edit Topic" : "New Topic"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Food & Drinks, Numbers, Nature..."
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description for this topic..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId !== null ? "Save Changes" : "Create Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this topic?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the topic. Words assigned to it will remain but become untagged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
