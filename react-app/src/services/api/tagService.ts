import { Tag } from "../../types";
import { BaseApiService } from "./baseService";

class TagService extends BaseApiService {
  async getTags(): Promise<Tag[]> {
    return this.request<Tag[]>("/api/tags");
  }

  async createTag(tagData: Omit<Tag, "id">): Promise<Tag> {
    return this.request<Tag>("/api/tags", {
      method: "POST",
      body: JSON.stringify(tagData),
    });
  }

  async updateTag(id: number, tagData: Partial<Omit<Tag, "id">>): Promise<Tag> {
    return this.request<Tag>(`/api/tags/${id}`, {
      method: "PUT",
      body: JSON.stringify(tagData),
    });
  }

  async deleteTag(id: number): Promise<void> {
    return this.request<void>(`/api/tags/${id}`, {
      method: "DELETE",
    });
  }
}

export const tagService = new TagService();
