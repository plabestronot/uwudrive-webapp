const API_BASE_URL = "https://drive.plabuwu.workers.dev/api/drive";

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "An unknown error occurred" }));
    throw new Error(
      errorData.error || response.statusText || "API request failed"
    );
  }
  if (response.status === 204) {
    return null;
  }
  // For file downloads, the response body is the file itself, not JSON
  if (response.headers.get("Content-Disposition")?.includes("attachment")) {
    return response.blob();
  }
  return response.json();
}

// Updated: Now only sends PIN
export async function authenticateVault(pin) {
  const response = await fetch(`${API_BASE_URL}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pin }), // Only send PIN
  });
  return handleResponse(response);
}

export async function getVaultUsage(vaultName) {
  if (!vaultName) throw new Error("Vault name is required to get usage.");
  const response = await fetch(
    `${API_BASE_URL}/usage?vaultName=${encodeURIComponent(vaultName)}`,
    {
      method: "GET",
    }
  );
  return handleResponse(response);
}

export async function changePin(vaultName, oldPin, newPin) {
  if (!vaultName || !oldPin || !newPin) {
    throw new Error("Vault name, old PIN, and new PIN are required.");
  }
  const response = await fetch(`${API_BASE_URL}/change-pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ vaultName, oldPin, newPin }),
  });
  return handleResponse(response);
}

export async function renameVault(currentVaultName, newVaultName, pin) {
  if (!currentVaultName || !newVaultName || !pin) {
    throw new Error(
      "Current vault name, new vault name, and PIN are required."
    );
  }
  const response = await fetch(`${API_BASE_URL}/rename-vault`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentVaultName, newVaultName, pin }),
  });
  return handleResponse(response);
}

export async function createNote(vaultName, noteTitle, noteContent) {
  if (!vaultName || !noteTitle || typeof noteContent !== "string") {
    throw new Error(
      "Vault name, note title, and content are required to create a note."
    );
  }

  const formData = new FormData();
  formData.append("vaultName", vaultName);
  formData.append("noteTitle", noteTitle);
  formData.append("noteContent", noteContent);

  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: "POST",
    body: formData, // FormData sets Content-Type to multipart/form-data automatically
  });

  return handleResponse(response);
}

export async function listFiles(vaultName) {
  if (!vaultName) throw new Error("Vault name is required to list files.");
  const response = await fetch(
    `${API_BASE_URL}/files?vaultName=${encodeURIComponent(vaultName)}`,
    {
      method: "GET",
    }
  );
  return handleResponse(response);
}

export function uploadFile(vaultName, file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!vaultName) {
      return reject(new Error("Vault name is required for upload."));
    }
    if (!file) {
      return reject(new Error("File is required for upload."));
    }

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `${API_BASE_URL}/upload?vaultName=${encodeURIComponent(vaultName)}`,
      true
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === "function") {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      // Simulate handleResponse logic for XMLHttpRequest
      if (xhr.status >= 200 && xhr.status < 300) {
        if (xhr.status === 204) {
          resolve(null);
        } else {
          try {
            // For file downloads, the response body is the file itself, not JSON
            if (
              xhr
                .getResponseHeader("Content-Disposition")
                ?.includes("attachment")
            ) {
              resolve(new Blob([xhr.response])); // Assuming responseType is blob or arraybuffer
            } else {
              resolve(JSON.parse(xhr.responseText));
            }
          } catch (e) {
            // If JSON parsing fails, but status is OK, consider it a success with raw text
            // Or handle as an error if JSON is strictly expected
            resolve(xhr.responseText);
          }
        }
      } else {
        let errorData;
        try {
          errorData = JSON.parse(xhr.responseText);
        } catch (e) {
          errorData = { message: "An unknown error occurred during upload" };
        }
        reject(
          new Error(errorData.error || xhr.statusText || "API request failed")
        );
      }
    };

    xhr.onerror = () => {
      // Also handle network errors
      reject(new Error("Network error during upload."));
    };

    xhr.send(formData);
  });
}

// This function returns the URL directly, as the download is handled by the browser navigating to it.
export function getDownloadFileUrl(vaultName, fileName) {
  if (!vaultName || !fileName)
    throw new Error("Vault name and file name are required for download.");
  return `${API_BASE_URL}/download?vaultName=${encodeURIComponent(
    vaultName
  )}&fileName=${encodeURIComponent(fileName)}`;
}

export async function deleteFile(vaultName, fileName) {
  if (!vaultName || !fileName)
    throw new Error("Vault name and file name are required for deletion.");
  const response = await fetch(`${API_BASE_URL}/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ vaultName, fileName }),
  });
  return handleResponse(response);
}
