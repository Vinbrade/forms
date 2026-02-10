import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Circle, CircleDot, Moon } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import {
  fetchFormById,
  fetchFieldsByFormId,
  submitPublicForm,
  ApiError,
  type Field as ApiField,
} from "@/helpers/api";
import { toast } from "sonner";
import { Toggle } from "@/components/ui/toggle";
import { useTheme } from "@/contexts/ThemeContext";

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface ViewField {
  id: number;
  question_text: string;
  answer_type: string;
  options: string[];
}

export function PublicForm() {
  const { id: formIdParam } = useParams<{ id: string }>();
  const formId = formIdParam ? Number(formIdParam) : NaN;
  const { toggleDarkMode } = useTheme();

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [fields, setFields] = useState<ViewField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

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
          setLoading(false);
          return;
        }
        if (form.status.toLowerCase() !== "published") {
          setError("This form is not available.");
          setLoading(false);
          return;
        }
        setFormName(form.name);
        setFormDescription(form.description ?? "");
        const mapped: ViewField[] = apiFields.map((f: ApiField) => ({
          id: f.field_id,
          question_text: f.question_text,
          answer_type:
            f.answer_type === "checkbox" || f.answer_type === "radio"
              ? f.answer_type
              : "text",
          options: f.options_json
            ? (() => {
                try {
                  const parsed = JSON.parse(f.options_json) as unknown;
                  return Array.isArray(parsed)
                    ? (parsed as string[]).filter(
                        (x): x is string => typeof x === "string"
                      )
                    : [];
                } catch {
                  return [];
                }
              })()
            : [],
        }));
        setFields(mapped);
        const initial: Record<string, string | string[]> = {};
        mapped.forEach((f) => {
          if (f.answer_type === "checkbox") initial[String(f.id)] = [];
          else initial[String(f.id)] = "";
        });
        setAnswers(initial);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load form");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [formId]);

  const setAnswer = useCallback((fieldId: number, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [String(fieldId)]: value }));
  }, []);

  const setCheckboxOption = useCallback(
    (fieldId: number, option: string, checked: boolean) => {
      setAnswers((prev) => {
        const key = String(fieldId);
        const current = (prev[key] as string[]) ?? [];
        const next = checked
          ? [...current, option]
          : current.filter((x) => x !== option);
        return { ...prev, [key]: next };
      });
    },
    []
  );

  const validate = useCallback((): string | null => {
    const name = clientName.trim();
    const email = clientEmail.trim();
    if (!name) return "Please enter your name.";
    if (!email) return "Please enter your email.";
    if (!EMAIL_REGEX.test(email)) return "Please enter a valid email address.";
    for (const field of fields) {
      const val = answers[String(field.id)];
      if (field.answer_type === "checkbox") {
        const arr = Array.isArray(val) ? val : [];
        if (arr.length === 0)
          return `Please answer: ${field.question_text}`;
      } else {
        const str = typeof val === "string" ? val.trim() : "";
        if (!str) return `Please answer: ${field.question_text}`;
      }
    }
    return null;
  }, [clientName, clientEmail, fields, answers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err, { position: "bottom-center" });
      return;
    }
    if (!Number.isInteger(formId) || formId <= 0) return;

    setSubmitLoading(true);
    try {
      const payload: Record<string, string | string[]> = {};
      for (const field of fields) {
        const val = answers[String(field.id)];
        if (field.answer_type === "checkbox" && Array.isArray(val)) {
          payload[String(field.id)] = val.length ? val.join(", ") : "";
        } else {
          payload[String(field.id)] = typeof val === "string" ? val : "";
        }
      }
      await submitPublicForm(formId, {
        name: clientName.trim(),
        email: clientEmail.trim(),
        answers: payload,
      });
      setSubmitted(true);
      toast.success("Thank you! Your response has been submitted.", {
        position: "bottom-center",
      });
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 409) {
          toast.error(
            "A response with this email has already been submitted for this form.",
            { position: "bottom-center" }
          );
          return;
        }
        toast.error(e.message, { position: "bottom-center" });
      } else {
        toast.error("Failed to submit. Please try again.", {
          position: "bottom-center",
        });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading form...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive text-center">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">{formName}</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Thank you! Your response has been submitted successfully.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-2xl py-8 px-6">
        <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black dark:text-white mb-2">
          {formName}
        </h1>
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
        {formDescription && (
          <p className="text-sm text-muted-foreground mb-8">
            {formDescription}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Your information</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label htmlFor="client-name">Name *</Label>
                <Input
                  id="client-name"
                  className="mt-1"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="client-email">Email *</Label>
                <Input
                  id="client-email"
                  type="email"
                  className="mt-1"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            {fields.map((field, index) => (
              <Card
                key={field.id}
                className={`border-l-4 rounded-l-none ${
                  field.answer_type === "text"
                    ? "border-l-cyan-400 dark:border-l-cyan-600"
                    : field.answer_type === "checkbox"
                      ? "border-l-purple-400 dark:border-l-purple-700"
                      : "border-l-pink-400 dark:border-l-pink-700"
                }`}
              >
                <CardHeader className="pb-2">
                  <p className="font-medium">
                    {index + 1}. {field.question_text} *
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  {field.answer_type === "text" && (
                    <Input
                      className="max-w-md"
                      placeholder="Your answer..."
                      value={(answers[String(field.id)] as string) ?? ""}
                      onChange={(e) =>
                        setAnswer(field.id, e.target.value)
                      }
                    />
                  )}
                  {field.answer_type === "radio" && (
                    <div className="flex flex-col gap-2">
                      {field.options.map((opt) => {
                        const isSelected =
                          (answers[String(field.id)] as string) === opt;
                        return (
                          <label
                            key={opt}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name={`field-${field.id}`}
                              value={opt}
                              checked={isSelected}
                              onChange={() => setAnswer(field.id, opt)}
                              className="sr-only"
                            />
                            {isSelected ? (
                              <CircleDot className="w-5 h-5 shrink-0 text-primary" />
                            ) : (
                              <Circle className="w-4 h-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="text-sm">{opt || "(Option)"}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {field.answer_type === "checkbox" && (
                    <div className="flex flex-col gap-2">
                      {field.options.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            className="cursor-pointer"
                            checked={(
                              (answers[String(field.id)] as string[]) ?? []
                            ).includes(opt)}
                            onCheckedChange={(checked) =>
                              setCheckboxOption(
                                field.id,
                                opt,
                                checked === true
                              )
                            }
                          />
                          <span className="text-sm">{opt || "(Option)"}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={submitLoading}
          >
            {submitLoading ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </main>
    </div>
  );
}

export default PublicForm;
