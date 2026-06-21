import { apiClient } from '@/lib/api/client'

export interface UploadResponse {
  id: string
  media_url: string
}

export const mediaApi = {
  upload: async (file: File): Promise<UploadResponse> => {
    const form = new FormData()
    form.append('image', file)
    return apiClient.postForm<UploadResponse>('/media/upload', form)
  },
}
