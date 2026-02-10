import { Router, Request, Response } from "express";
import {
  createForm,
  deleteForm,
  getAllForms,
  getFormById,
  updateForm,
} from "../database/forms";
import { DatabaseError } from "../database/errors/handler";

const router = Router();

router.get("/api/forms", async (_req: Request, res: Response) => {
  try {
    const forms = await getAllForms();
    res.json(forms);
  } catch (error) {
    handleError(res, error, "Failed to fetch forms");
  }
});

router.get("/api/forms/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "Form id must be a positive integer" });
    }

    const form = await getFormById(id);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.json(form);
  } catch (error) {
    handleError(res, error, "Failed to fetch form");
  }
});

router.post("/api/forms", async (req: Request, res: Response) => {
  try {
    const { name, description, status, date_published, date_closed } = req.body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    if (typeof status !== "string" || !status.trim()) {
      return res.status(400).json({ error: "status is required" });
    }

    const form = await createForm({
      name,
      description,
      status,
      date_published,
      date_closed,
    });

    res.status(201).json(form);
  } catch (error) {
    handleError(res, error, "Failed to create form");
  }
});

router.patch("/api/forms/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "Form id must be a positive integer" });
    }

    const { name, description, status, date_published, date_closed } = req.body ?? {};

    const updated = await updateForm(id, {
      name,
      description,
      status,
      date_published,
      date_closed,
    });

    if (!updated) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.json(updated);
  } catch (error) {
    handleError(res, error, "Failed to update form");
  }
});

router.delete("/api/forms/:id", async (req: Request, res: Response) => {  
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "Form id must be a positive integer" });
    }

    await deleteForm(id);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, "Failed to delete form");
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

