import { useTheme } from "@/contexts/ThemeContext";
import { Toggle } from "@/components/ui/toggle";
import { ArrowLeft, Moon, Plus, Trash2, Circle, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  fetchFormById,
  fetchFieldsByFormId,
  createField,
  updateField as updateFieldApi,
  updateForm,
  deleteField,
  ApiError,
  type Field as ApiField,
} from "@/helpers/api";
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
import { toast } from "sonner";

export type FieldType = "text" | "checkbox" | "radio";

export interface FormField {
  id: string;
  fieldId?: number;
  question: string;
  type: FieldType;
  options: string[];
}

function createBlankField(overrides?: Partial<FormField>): FormField {
  return {
    id: crypto.randomUUID(),
    question: "",
    type: "text",
    options: [],
    ...overrides,
  };
}

function apiFieldToFormField(f: ApiField): FormField {
  const options: string[] = f.options_json
    ? (() => {
        try {
          const parsed = JSON.parse(f.options_json) as unknown;
          return Array.isArray(parsed)
            ? parsed.filter((x): x is string => typeof x === "string")
            : [];
        } catch {
          return [];
        }
      })()
    : [];
  return {
    id: String(f.field_id),
    fieldId: f.field_id,
    question: f.question_text,
    type: (f.answer_type === "checkbox" || f.answer_type === "radio"
      ? f.answer_type
      : "text") as FieldType,
    options: options.length ? options : [""],
  };
}

export function FormEditor() {
  const { id: formIdParam } = useParams<{ id: string }>();
  const formId = formIdParam ? Number(formIdParam) : NaN;
  const { toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [formName, setFormName] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<FormField | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [navigateSaving, setNavigateSaving] = useState(false);
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<
    Record<string, { question: string; type: FieldType; options: string[] }>
  >({});
  const fieldsRef = useRef<FormField[]>([]);
  fieldsRef.current = fields;

  function isFieldDirty(
    field: FormField,
    snapshot: Record<string, { question: string; type: FieldType; options: string[] }>
  ): boolean {
    const snap = snapshot[field.id];
    if (!snap) {
      return (
        field.question.trim() !== "" ||
        field.type !== "text" ||
        field.options.some((o) => o.trim() !== "")
      );
    }
    return (
      snap.question !== field.question ||
      snap.type !== field.type ||
      JSON.stringify(snap.options) !== JSON.stringify(field.options)
    );
  }

  useEffect(() => {
    if (!Number.isInteger(formId) || formId <= 0) {
      setError("Invalid form");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [form, apiFields] = await Promise.all([
          fetchFormById(formId),
          fetchFieldsByFormId(formId),
        ]);
        if (cancelled) return;
        if (!form) {
          setError("Form not found");
          setFields([createBlankField()]);
          setSavedSnapshot({});
          setLoading(false);
          return;
        }
        setFormName(form.name);
        setFormDescription(form.description ?? "");
        const mapped = apiFields.map(apiFieldToFormField);
        setFields(mapped.length ? mapped : [createBlankField()]);
        const snapshot: Record<string, { question: string; type: FieldType; options: string[] }> = {};
        mapped.forEach((f) => {
          snapshot[f.id] = { question: f.question, type: f.type, options: [...f.options] };
        });
        setSavedSnapshot(snapshot);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load form");
        setFields([createBlankField()]);
        setSavedSnapshot({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [formId]);

  const updateField = useCallback((id: string, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }, []);

  const setFieldQuestion = useCallback(
    (id: string, question: string) => updateField(id, { question }),
    [updateField]
  );

  const setFieldType = useCallback(
    (id: string, type: FieldType) => {
      setFields((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                type,
                options:
                  type === "text" ? [] : f.options.length ? f.options : [""],
              }
            : f
        )
      );
    },
    []
  );

  const setFieldOption = useCallback(
    (fieldId: string, index: number, value: string) => {
      setFields((prev) =>
        prev.map((f) => {
          if (f.id !== fieldId) return f;
          const next = [...f.options];
          next[index] = value;
          return { ...f, options: next };
        })
      );
    },
    []
  );

  const addOption = useCallback((fieldId: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId ? { ...f, options: [...f.options, ""] } : f
      )
    );
  }, []);

  const removeOption = useCallback(
    async (field: FormField, index: number) => {
      const nextOptions = field.options.filter((_, i) => i !== index);
      const next = nextOptions.length ? nextOptions : [""];

      setFields((prev) =>
        prev.map((f) =>
          f.id !== field.id ? f : { ...f, options: next }
        )
      );

      if (field.fieldId != null) {
        const toStore = next
          .map((o) => o.trim())
          .filter(Boolean);
        const optionsJson =
          toStore.length === 0 ? null : JSON.stringify(toStore);
        try {
          await updateFieldApi(field.fieldId, {
            options_json: optionsJson ?? undefined,
          });
          setSavedSnapshot((prev) => ({
            ...prev,
            [field.id]: {
              question: field.question,
              type: field.type,
              options: next,
            },
          }));
        } catch (err) {
          const msg =
            err instanceof ApiError
              ? err.message
              : "Failed to update options.";
          toast.error(msg, { position: "bottom-center" });
        }
      }
    },
    []
  );

  const validateFieldForSave = (field: FormField): string | null => {
    const question = field.question.trim();
    if (!question) return "Please enter a question.";
    if (field.type === "checkbox" || field.type === "radio") {
      const labels = field.options.map((o) => o.trim()).filter(Boolean);
      if (labels.length === 0)
        return "Checkbox and radio questions must have at least one option label.";
    }
    return null;
  };

  const handleSaveField = useCallback(
    async (field: FormField) => {
      if (!Number.isInteger(formId) || formId <= 0) return;
      const err = validateFieldForSave(field);
      if (err) {
        toast.error(err, { position: "bottom-center" });
        return;
      }
      setSavingFieldId(field.id);
      try {
        const question = field.question.trim();
        const isChoice = field.type === "checkbox" || field.type === "radio";
        const labels = field.options.map((o) => o.trim()).filter(Boolean);
        const answerType = isChoice && labels.length === 0 ? "text" : field.type;
        const optionsJson =
          answerType === "text" ? null : JSON.stringify(labels);

        if (field.fieldId == null) {
          const created = await createField({
            form_id: formId,
            question_text: question,
            answer_type: answerType,
            options_json: optionsJson ?? undefined,
          });
          setFields((prev) =>
            prev.map((f) =>
              f.id === field.id
                ? {
                    ...f,
                    id: String(created.field_id),
                    fieldId: created.field_id,
                  }
                : f
            )
          );
          setSavedSnapshot((prev) => ({
            ...prev,
            [String(created.field_id)]: {
              question: field.question,
              type: answerType as FieldType,
              options: field.options,
            },
          }));
        } else {
          await updateFieldApi(field.fieldId, {
            question_text: question,
            answer_type: answerType,
            options_json: optionsJson ?? undefined,
          });
          setSavedSnapshot((prev) => ({
            ...prev,
            [field.id]: {
              question: field.question,
              type: answerType as FieldType,
              options: [...field.options],
            },
          }));
        }
        toast.success("Saved.", { position: "bottom-center" });
      } catch (e) {
        const msg =
          e instanceof ApiError ? e.message : "Failed to save question.";
        toast.error(msg, { position: "bottom-center" });
      } finally {
        setSavingFieldId(null);
      }
    },
    [formId]
  );

  const handleAddQuestion = useCallback(() => {
    setFields((prev) => [...prev, createBlankField()]);
  }, []);

  const removeField = useCallback((field: FormField) => {
    setFieldToDelete(field);
  }, []);

  const confirmDeleteField = useCallback(async () => {
    const field = fieldToDelete;
    setFieldToDelete(null);
    if (!field) return;

    if (field.fieldId != null) {
      try {
        await deleteField(field.fieldId);
        setFields((prev) =>
          prev.length <= 1
            ? [createBlankField()]
            : prev.filter((f) => f.id !== field.id)
        );
        setSavedSnapshot((prev) => {
          const next = { ...prev };
          delete next[field.id];
          return next;
        });
        toast.success("Question deleted.", { position: "bottom-center" });
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "Failed to delete question.";
        toast.error(msg, { position: "bottom-center" });
      }
    } else {
      setFields((prev) =>
        prev.length <= 1 ? [createBlankField()] : prev.filter((f) => f.id !== field.id)
      );
    }
  }, [fieldToDelete]);

  const saveUnsavedFieldsOnNavigate = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(formId) || formId <= 0) return;
    const current = fieldsRef.current;
    const unsaved = current.filter(
      (f) => f.fieldId == null && f.question.trim() !== ""
    );
    if (unsaved.length === 0) return;

    for (const field of unsaved) {
      const question = field.question.trim();
      const isChoice =
        field.type === "checkbox" || field.type === "radio";
      const labels = field.options.map((o) => o.trim()).filter(Boolean);

      const answerType =
        isChoice && labels.length === 0 ? "text" : field.type;
      const optionsJson =
        answerType === "text"
          ? null
          : JSON.stringify(labels);

      try {
        await createField({
          form_id: formId,
          question_text: question,
          answer_type: answerType,
          options_json: optionsJson ?? undefined,
        });
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "Failed to save question.";
        toast.error(msg, { position: "bottom-center" });
      }
    }
  }, [formId]);

  const handleBackWithSave = useCallback(async () => {
    setNavigateSaving(true);
    try {
      await saveUnsavedFieldsOnNavigate();
      navigate("/?tab=drafts");
    } finally {
      setNavigateSaving(false);
    }
  }, [navigate, saveUnsavedFieldsOnNavigate]);

  const handlePublishConfirm = useCallback(async () => {
    if (!Number.isInteger(formId) || formId <= 0) return;
    setPublishLoading(true);
    try {
      await updateForm(formId, {
        status: "published",
        date_published: new Date().toISOString(),
      });
      toast.success("Form published.", { position: "bottom-center" });
      setPublishDialogOpen(false);
      navigate(`/form-viewer/${formId}`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to publish form.";
      toast.error(msg, { position: "bottom-center" });
    } finally {
      setPublishLoading(false);
    }
  }, [formId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading form...</p>
      </div>
    );
  }

  if (error && !formName) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => navigate("/?tab=drafts")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto py-4 px-6 h-16 md:h-20 mb-2 md:mb-4 border-border flex items-center justify-between">
        <Button
          variant="ghost"
          className="cursor-pointer"
          size="icon"
          onClick={handleBackWithSave}
          disabled={navigateSaving}
          aria-label={navigateSaving ? "Saving..." : "Back"}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-black xl:ml-45 dark:text-white">
          {formName || "Form"}
        </h1>
        <div className="flex items-center gap-6">
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 cursor-pointer"
            onClick={() => setPublishDialogOpen(true)}
          >
            <Send className="h-4 w-4" />
            Publish
          </Button>
          <Toggle
            aria-label="Toggle theme"
            size="default"
            variant="outline"
            className="p-0 cursor-pointer xl:mr-45"
            onClick={() => toggleDarkMode()}
          >
            <Moon className="dark:fill-foreground dark:text-white" />
          </Toggle>
        </div>
      </header>
      <main className="mx-auto py-4 px-6 grid grid-cols-1 lg:grid-cols-4 gap-4 mb-30">
        <p className="text-sm md:text-md text-muted-foreground">
          {formDescription || "No description provided."}
        </p>
        <div className="flex flex-col col-span-2 gap-4">
          {fields.map((field, index) => (
            <Card
              key={field.id}
              className={`relative
            ${
              field.type === "text"
                ? "border-l-cyan-400 dark:border-l-cyan-600"
                : field.type === "checkbox"
                  ? "border-l-purple-400 dark:border-l-purple-700"
                  : field.type === "radio"
                    ? "border-l-pink-400 dark:border-l-pink-700"
                    : ""
            } border-l-5 
            rounded-l-none border-y-2 border-b-2 border-r-2`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground font-medium pt-2 shrink-0">
                    {index + 1}.
                  </span>
                  <Textarea
                    className="flex-1 min-h-[60px] resize-none ring-0 border-0 border-b-3 
                    focus-visible:ring-0 focus-visible:border-0 rounded-b-none shadow-none focus-visible:border-b-3
                    focus-visible:border-b-primary not-dark:bg-accent "
                    autoFocus={index === 0}
                    rows={2}
                    placeholder="Enter your question"
                    value={field.question}
                    onChange={(e) =>
                      setFieldQuestion(field.id, e.target.value)
                    }
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive cursor-pointer"
                      onClick={() => removeField(field)}
                      aria-label="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pl-8">
                <Select
                  value={field.type}
                  onValueChange={(v) =>
                    setFieldType(field.id, v as FieldType)
                  }
                >
                  <SelectTrigger className="w-full max-w-48 focus-visible:ring-primary cursor-pointer">
                    <SelectValue placeholder="Select Answer Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Answer Type</SelectLabel>
                      <SelectItem
                        value="text"
                        className="cursor-pointer"
                      >
                        Short Text
                      </SelectItem>
                      <SelectItem
                        value="checkbox"
                        className="cursor-pointer"
                      >
                        Checkbox
                      </SelectItem>
                      <SelectItem
                        value="radio"
                        className="cursor-pointer"
                      >
                        Radio Button
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {field.type === "text" && (
                  <div className="rounded-md border border-input bg-muted/30 px-3 py-2">
                    <Input
                      className="bg-transparent border-0 focus-visible:ring-0 h-8"
                      placeholder="Short text answer..."
                      readOnly
                      disabled
                    />
                  </div>
                )}

                {(field.type === "checkbox" || field.type === "radio") && (
                  <div className="flex flex-col gap-2">
                    {field.options.map((opt, i) => (
                      <div
                        key={`${field.id}-opt-${i}`}
                        className="flex items-center gap-2"
                      >
                        {field.type === "checkbox" ? (
                          <Checkbox className="pointer-events-none shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 shrink-0 text-muted-foreground" />
                        )}
                        <Input
                          className="flex-1 focus-visible:ring-primary"
                          placeholder="Option label"
                          value={opt}
                          onChange={(e) =>
                            setFieldOption(field.id, i, e.target.value)
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8 cursor-pointer"
                          onClick={() => removeOption(field, i)}
                          aria-label="Remove option"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-fit cursor-pointer gap-1.5 mt-4 bg-indigo-500 text-white
                      border-indigo-500 
                      hover:bg-indigo-600
                      hover:border-indigo-600
                      dark:bg-indigo-800
                      dark:border-indigo-800
                      dark:hover:bg-indigo-900
                      dark:hover:border-indigo-800"
                      onClick={() => addOption(field.id)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add option
                    </Button>
                  </div>
                )}

                {isFieldDirty(field, savedSnapshot) && (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 w-fit gap-1.5 cursor-pointer"
                    onClick={() => handleSaveField(field)}
                    disabled={savingFieldId === field.id}
                  >
                    <Save className="h-4 w-4" />
                    {savingFieldId === field.id ? "Saving..." : "Save"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 py-6 border-dashed cursor-pointer"
            onClick={handleAddQuestion}
          >
            <Plus className="w-4 h-4" />
            Add question
          </Button>
        </div>
      </main>

      <AlertDialog
        open={fieldToDelete !== null}
        onOpenChange={(open) => !open && setFieldToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the question permanently. You cannot undo this
              action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteField();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={publishDialogOpen}
        onOpenChange={(open) => !publishLoading && setPublishDialogOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish form?</AlertDialogTitle>
            <AlertDialogDescription>
              Once published, this form cannot be edited later. You can still
              view it and collect responses. Are you sure you want to publish?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={publishLoading}
              onClick={(e) => {
                e.preventDefault();
                handlePublishConfirm();
              }}
            >
              {publishLoading ? "Publishing..." : "Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default FormEditor;
