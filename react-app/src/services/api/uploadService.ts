import { BaseApiService } from "./baseService";

class UploadService extends BaseApiService {
  async uploadFiles(files: File[]): Promise<{
    files: Array<{
      filename: string;
      originalName: string;
      path: string;
      size: number;
      mimetype: string;
    }>;
  }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const fullUrl = `${this.apiBaseUrl}/api/upload`;
    const response = await fetch(fullUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(errorData.error || "Upload failed");
    }

    return response.json();
  }

  async deleteFile(filename: string): Promise<void> {
    return this.request<void>(`/api/upload/${filename}`, {
      method: "DELETE",
    });
  }
}

export const uploadService = new UploadService();
