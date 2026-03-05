function extractDetailFromBody(body) {
  if (!body) return null;
  if (typeof body === "string") return body;
  if (typeof body === "object") return body;
  return null;
}

function formatErrorMessage(detail, fallbackMessage) {
  if (!detail) return fallbackMessage;
  if (typeof detail === "string") return detail;

  return (
    detail?.message ||
    detail?.error ||
    detail?.detail ||
    fallbackMessage
  );
}

export async function fetchJson(url, options = {}) {
  const timeoutMs = options._timeout || 12000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { response, body };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. The server may be busy — try again.");
    }
    throw err;
  }
}

export function buildFetchError(response, body, fallbackMessage = "Request failed") {
  const detail = extractDetailFromBody(body);
  const message = formatErrorMessage(detail, fallbackMessage);
  const err = new Error(message);
  err.status = response?.status;
  err.detail = detail;
  return err;
}
