export class DatabaseError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "DatabaseError";
    this.cause = cause;
  }
}

export class DatabaseQueryError extends DatabaseError {
  constructor(operation: string, cause?: unknown) {
    super(`Database query failed during ${operation}`, cause);
    this.name = "DatabaseQueryError";
  }
}

export function toDatabaseError(operation: string, error: unknown): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  return new DatabaseQueryError(operation, error);
}

