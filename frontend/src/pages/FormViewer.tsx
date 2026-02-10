import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Lock } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import {
  fetchFormById,
  fetchFieldsByFormId,
  fetchClientsByFormId,
  fetchResponsesByClientId,
  updateForm,
  ApiError,
  type Field as ApiField,
  type Client,
  type ResponseRow,
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

interface ViewField {
  id: number;
  question_text: string;
}

interface ClientWithResponses {
  client: Client;
  responses: ResponseRow[];
}

export function FormViewer() {
  const { id: formIdParam } = useParams<{ id: string }>();
  const formId = formIdParam ? Number(formIdParam) : NaN;
  const navigate = useNavigate();

  const [form, setForm] = useState<{
    name: string;
    description: string;
    status: string;
    date_published: string | null;
    date_closed: string | null;
  } | null>(null);
  const [fields, setFields] = useState<ViewField[]>([]);
  const [clientsWithResponses, setClientsWithResponses] = useState<
    ClientWithResponses[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isInteger(formId) || formId <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const [formData, apiFields, clients] = await Promise.all([
        fetchFormById(formId),
        fetchFieldsByFormId(formId),
        fetchClientsByFormId(formId),
      ]);
      if (!formData) {
        setError("Form not found");
        setLoading(false);
        return;
      }
      setForm({
        name: formData.name,
        description: formData.description ?? "",
        status: formData.status,
        date_published: formData.date_published,
        date_closed: formData.date_closed,
      });
      setFields(
        apiFields.map((f: ApiField) => ({
          id: f.field_id,
          question_text: f.question_text,
        }))
      );
      const withResponses: ClientWithResponses[] = await Promise.all(
        clients.map(async (client) => {
          const responses = await fetchResponsesByClientId(client.client_id);
          return { client, responses };
        })
      );
      setClientsWithResponses(withResponses);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load form");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    load();
  }, [load]);

  const getAnswer = (responses: ResponseRow[], fieldId: number): string => {
    const r = responses.find((x) => x.field_id === fieldId);
    return r?.response_text ?? "—";
  };

  const handleCloseForm = useCallback(async () => {
    if (!Number.isInteger(formId) || formId <= 0) return;
    setCloseLoading(true);
    try {
      await updateForm(formId, {
        status: "closed",
        date_closed: new Date().toISOString(),
      });
      toast.success("Form closed. It will no longer accept responses.", {
        position: "bottom-center",
      });
      setCloseDialogOpen(false);
      load();
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Failed to close form.";
      toast.error(msg, { position: "bottom-center" });
    } finally {
      setCloseLoading(false);
    }
  }, [formId, load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading form...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  if (!form) return null;

  const isClosed = form.status.toLowerCase() === "closed";

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto py-4 px-6 h-16 md:h-20 mb-2 md:mb-4 border-border flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          onClick={() => navigate("/")}
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-black xl:ml-45 dark:text-white">
          {form.name || "Form"}
        </h1>
        <div className="flex items-center gap-2 xl:mr-45">
          {!isClosed && (
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 cursor-pointer"
              onClick={() => setCloseDialogOpen(true)}
            >
              <Lock className="h-4 w-4" />
              Close form
            </Button>
          )}
        </div>
      </header>
      <main className="container mx-auto max-w-5xl py-4 px-6">
        {form.description && (
          <p className="text-sm text-muted-foreground mb-6">
            {form.description}
          </p>
        )}

        {isClosed && (
          <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
            <CardContent className="py-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <span className="text-sm font-medium">
                This form is closed and no longer accepting responses.
              </span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Responses ({clientsWithResponses.length})
            </h2>
          </CardHeader>
          <CardContent>
            {clientsWithResponses.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                No responses yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium">
                        Respondent
                      </th>
                      <th className="text-left py-3 px-2 font-medium">Email</th>
                      <th className="text-left py-3 px-2 font-medium">Date</th>
                      {fields.map((f) => (
                        <th
                          key={f.id}
                          className="text-left py-3 px-2 font-medium max-w-[200px]"
                        >
                          {f.question_text}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clientsWithResponses.map(({ client, responses }) => (
                      <tr
                        key={client.client_id}
                        className="border-b border-border/70"
                      >
                        <td className="py-3 px-2">{client.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {client.email}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                          {new Date(
                            client.date_responded
                          ).toLocaleDateString()}
                        </td>
                        {fields.map((f) => (
                          <td
                            key={f.id}
                            className="py-3 px-2 max-w-[200px] wrap-break-word"
                          >
                            {getAnswer(responses, f.id)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog
        open={closeDialogOpen}
        onOpenChange={(open) => !closeLoading && setCloseDialogOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this form?</AlertDialogTitle>
            <AlertDialogDescription>
              Closing the form will stop new responses. Existing responses will
              remain visible. You can still view this page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closeLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={closeLoading}
              onClick={(e) => {
                e.preventDefault();
                handleCloseForm();
              }}
            >
              {closeLoading ? "Closing..." : "Close form"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default FormViewer;
