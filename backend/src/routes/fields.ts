import { Router, Request, Response } from 'express'; 
import {
  createField,
  deleteField,
  getFieldById,
  getFieldsByFormId,
  updateField,
} from "../database/fields";
import { DatabaseError } from "../database/errors/handler";

const router = Router();

router.get("/api/fields/form/:formId", async (req: Request, res: Response) => {
  try {
    const formId = Number(req.params.formId);
    if (!Number.isInteger(formId) || formId <= 0) {
      return res
        .status(400)
        .json({ error: "formId must be a positive integer" });
    }

    const fields = await getFieldsByFormId(formId);
    res.json(fields);
  } catch (error) {
    handleError(res, error, "Failed to fetch fields for form");
  }
});

router.get("/api/fields/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "field id must be a positive integer" });
    }

    const field = await getFieldById(id);
    if (!field) {
      return res.status(404).json({ error: "Field not found" });
    }

    res.json(field);
  } catch (error) {
    handleError(res, error, "Failed to fetch field");
  }
});

router.post("/api/fields", async (req: Request, res: Response) => {
  try {
    const { form_id, question_text, answer_type, options_json } = req.body ?? {};

    const formId = Number(form_id);
    if (!Number.isInteger(formId) || formId <= 0) {
      return res
        .status(400)
        .json({ error: "form_id must be a positive integer" });
    }
    if (typeof question_text !== "string" || !question_text.trim()) {
      return res.status(400).json({ error: "question_text is required" });
    }
    if (typeof answer_type !== "string" || !answer_type.trim()) {
      return res.status(400).json({ error: "answer_type is required" });
    }

    const field = await createField({
      form_id: formId,
      question_text,
      answer_type,
      options_json,
    });

    res.status(201).json(field);
  } catch (error) {
    handleError(res, error, "Failed to create field");
  }
});

router.patch("/api/fields/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "field id must be a positive integer" });
    }

    const { question_text, answer_type, options_json } = req.body ?? {};

    const updated = await updateField(id, {
      question_text,
      answer_type,
      options_json,
    });

    if (!updated) {
      return res.status(404).json({ error: "Field not found" });
    }

    res.json(updated);
  } catch (error) {
    handleError(res, error, "Failed to update field");
  }
});

router.delete("/api/fields/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "field id must be a positive integer" });
    }

    await deleteField(id);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, "Failed to delete field");
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

