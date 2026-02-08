import { useTheme } from "@/contexts/ThemeContext";
import { Toggle } from "@/components/ui/toggle";
import { ArrowLeft, Moon, Plus, Trash2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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
import { useState, useCallback } from "react";

export type FieldType = "text" | "checkbox" | "radio";

export interface FormField {
  id: string;
  question: string;
  type: FieldType;
  options: string[];
}

function createField(overrides?: Partial<FormField>): FormField {
  return {
    id: crypto.randomUUID(),
    question: "",
    type: "text",
    options: [],
    ...overrides,
  };
}

export function FormEditor() {
  const { toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [fields, setFields] = useState<FormField[]>(() => [createField()]);

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
            ? { ...f, type, options: type === "text" ? [] : f.options.length ? f.options : [""] }
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

  const removeOption = useCallback((fieldId: string, index: number) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f;
        const next = f.options.filter((_, i) => i !== index);
        return { ...f, options: next.length ? next : [""] };
      })
    );
  }, []);

  const addField = useCallback(() => {
    setFields((prev) => [...prev, createField()]);
  }, []);

  const removeField = useCallback((id: string) => {
    setFields((prev) => (prev.length <= 1 ? prev : prev.filter((f) => f.id !== id)));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto py-4 px-6 h-16 md:h-20 mb-2 md:mb-4 border-border flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-black xl:ml-45 dark:text-white">Saturday</h1>
        <div className="flex items-center gap-6">
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
          No description provided Lorem, ipsum dolor sit amet consectetur adipisicing elit. Exercitationem error vel temporibus? Ipsa odit, aliquam aliquid quasi recusandae non deserunt enim voluptas voluptates soluta sint laborum, voluptatem alias deleniti possimus.
        </p>
        <div className="flex flex-col col-span-2 gap-4">
          {fields.map((field, index) => (
            <Card key={field.id} className={`relative
            ${field.type === "text" ? "border-l-cyan-400 dark:border-l-cyan-600" :
            field.type === "checkbox" ? "border-l-purple-400 dark:border-l-purple-700" :
            field.type === "radio" ? "border-l-pink-400 dark:border-l-pink-700" : ""} border-l-5 
            rounded-l-none border-y-2 border-b-2 border-r-2`}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground font-medium pt-2 shrink-0">
                    {index + 1}.
                  </span>
                  <Textarea
                    className="flex-1 min-h-[60px] resize-none ring-0 border-0 border-b-3 
                    focus-visible:ring-0 focus-visible:border-0 rounded-b-none shadow-none focus-visible:border-b-3
                    focus-visible:border-b-primary not-dark:bg-accent "
                    autoFocus
                    rows={2}
                    placeholder="Enter your question"
                    value={field.question}
                    onChange={(e) => setFieldQuestion(field.id, e.target.value)}
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive cursor-pointer"
                      onClick={() => removeField(field.id)}
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
                  onValueChange={(v) => setFieldType(field.id, v as FieldType)}
                >
                  <SelectTrigger className="w-full max-w-48 focus-visible:ring-primary cursor-pointer">
                    <SelectValue placeholder="Select Answer Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Answer Type</SelectLabel>
                      <SelectItem value="text" className="cursor-pointer">Short Text</SelectItem>
                      <SelectItem value="checkbox" className="cursor-pointer">Checkbox</SelectItem>
                      <SelectItem value="radio" className="cursor-pointer">Radio Button</SelectItem>
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
                          onClick={() => removeOption(field.id, i)}
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
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 py-6 border-dashed cursor-pointer"
            onClick={addField}
          >
            <Plus className="w-4 h-4" />
            Add question
          </Button>
        </div>
      </main>
    </div>
  );
}

export default FormEditor;
