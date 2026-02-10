import { Router, Request, Response } from "express";
import {
  createResponse,
  deleteResponse,
  getResponseById,
  getResponsesByClientId,
  getResponsesByFieldId,
  updateResponse,
} from "../database/responses";
import { DatabaseError } from "../database/errors/handler";

const router = Router();

router.get("/api/responses/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "response id must be a positive integer" });
    }

    const response = await getResponseById(id);
    if (!response) {
      return res.status(404).json({ error: "Response not found" });
    }

    res.json(response);
  } catch (error) {
    handleError(res, error, "Failed to fetch response");
  }
});

router.get("/api/responses/client/:clientId", async (req: Request, res: Response) => {
  try {
    const clientId = Number(req.params.clientId);
    if (!Number.isInteger(clientId) || clientId <= 0) {
      return res
        .status(400)
        .json({ error: "clientId must be a positive integer" });
    }

    const responses = await getResponsesByClientId(clientId);
    res.json(responses);
  } catch (error) {
    handleError(res, error, "Failed to fetch responses for client");
  }
});

router.get("/api/responses/field/:fieldId", async (req: Request, res: Response) => {
  try {
    const fieldId = Number(req.params.fieldId);
    if (!Number.isInteger(fieldId) || fieldId <= 0) {
      return res
        .status(400)
        .json({ error: "fieldId must be a positive integer" });
    }

    const responses = await getResponsesByFieldId(fieldId);
    res.json(responses);
  } catch (error) {
    handleError(res, error, "Failed to fetch responses for field");
  }
});

router.post("/api/responses", async (req: Request, res: Response) => {
  try {
    const { client_id, field_id, response_text } = req.body ?? {};

    const clientId = Number(client_id);
    const fieldId = Number(field_id);

    if (!Number.isInteger(clientId) || clientId <= 0) {
      return res
        .status(400)
        .json({ error: "client_id must be a positive integer" });
    }
    if (!Number.isInteger(fieldId) || fieldId <= 0) {
      return res
        .status(400)
        .json({ error: "field_id must be a positive integer" });
    }
    if (typeof response_text !== "string" || !response_text.trim()) {
      return res.status(400).json({ error: "response_text is required" });
    }

    const response = await createResponse({
      client_id: clientId,
      field_id: fieldId,
      response_text,
    });

    res.status(201).json(response);
  } catch (error) {
    handleError(res, error, "Failed to create response");
  }
});

router.patch("/api/responses/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "response id must be a positive integer" });
    }

    const { response_text } = req.body ?? {};

    const updated = await updateResponse(id, { response_text });
    if (!updated) {
      return res.status(404).json({ error: "Response not found" });
    }

    res.json(updated);
  } catch (error) {
    handleError(res, error, "Failed to update response");
  }
});

router.delete("/api/responses/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "response id must be a positive integer" });
    }

    await deleteResponse(id);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, "Failed to delete response");
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

