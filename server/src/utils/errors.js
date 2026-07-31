export function badRequest(message, details) {
  const error = new Error(message);
  error.status = 400;
  error.details = details;
  return error;
}

export function forbidden(message = "Forbidden") {
  const error = new Error(message);
  error.status = 403;
  return error;
}

export function notFound(message = "Not found") {
  const error = new Error(message);
  error.status = 404;
  return error;
}
