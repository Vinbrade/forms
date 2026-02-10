import { Router, Request, Response } from 'express'; 
import { createClient, deleteClient, getClientById, getClientsByFormId, updateClient } from "../database/clients";
import { DatabaseError } from "../database/errors/handler";

const router = Router();

router.get("/api/clients/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "client id must be a positive integer" });
    }

    const client = await getClientById(id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    handleError(res, error, "Failed to fetch client");
  }
});

router.get("/api/clients/form/:formId", async (req: Request, res: Response) => {
  try {
    const formId = Number(req.params.formId);
    if (!Number.isInteger(formId) || formId <= 0) {
      return res
        .status(400)
        .json({ error: "formId must be a positive integer" });
    }

    const clients = await getClientsByFormId(formId);
    res.json(clients);
  } catch (error) {
    handleError(res, error, "Failed to fetch clients for form");
  }
});

router.post("/api/clients", async (req: Request, res: Response) => {
  try {
    const { name, email, form_id, date_responded } = req.body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "email is required" });
    }
    const formId =
      form_id === null || form_id === undefined ? null : Number(form_id);
    if (formId !== null && (!Number.isInteger(formId) || formId <= 0)) {
      return res
        .status(400)
        .json({ error: "If provided, form_id must be a positive integer" });
    }
    if (typeof date_responded !== "string" || !date_responded.trim()) {
      return res.status(400).json({ error: "date_responded is required" });
    }

    const client = await createClient({
      name,
      email,
      form_id: formId,
      date_responded,
    });

    res.status(201).json(client);
  } catch (error) {
    handleError(res, error, "Failed to create client");
  }
});

router.patch("/api/clients/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "client id must be a positive integer" });
    }

    const { name, email, form_id, date_responded } = req.body ?? {};
    const formId =
      form_id === null || form_id === undefined ? null : Number(form_id);

    const updated = await updateClient(id, {
      name,
      email,
      form_id: formId,
      date_responded,
    });

    if (!updated) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(updated);
  } catch (error) {
    handleError(res, error, "Failed to update client");
  }
});

router.delete("/api/clients/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "client id must be a positive integer" });
    }

    await deleteClient(id);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, "Failed to delete client");
  }
});

function handleError(
  res: Response,
  error: unknown,
  defaultMessage: string
) {
  if (error instanceof DatabaseError) {
    return res.status(400).json({ error: error.message });
  }
  console.error(defaultMessage, error);
  return res.status(500).json({ error: defaultMessage });
}

export default router;

