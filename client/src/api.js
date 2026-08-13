const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(message, details, status) {
    super(message);
    this.details = details;
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const token = localStorage.getItem("smarttutor.token");
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let payload = {};
    try {
      payload = await response.json();
    } catch (_error) {
      payload = {};
    }
    throw new ApiError(payload.message || "Request failed", payload.details, response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function downloadUrl(path) {
  return `${API_URL}${path}`;
}

// fetch() exposes no upload progress event, so a real (non-fake-animation)
// progress bar needs XMLHttpRequest's upload.onprogress instead.
export function uploadWithProgress(path, form, onProgress) {
  const token = localStorage.getItem("smarttutor.token");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}${path}`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let payload = {};
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch (_error) {
        payload = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(payload);
      else reject(new ApiError(payload.message || "Request failed", payload.details, xhr.status));
    };
    xhr.onerror = () => reject(new ApiError("Network error during upload", undefined, 0));
    xhr.send(form);
  });
}
