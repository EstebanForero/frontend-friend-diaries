import { apiClient } from '@/lib/api/client'

export interface UploadResponse {
  id: string
  media_url: string
  media_kind: 'image' | 'video'
  mime_type: string
  duration_seconds?: number
}

export const mediaApi = {
  upload: async (file: File): Promise<UploadResponse> => {
    const form = new FormData()
    form.append('media', file)
    form.append('filename', file.name)
    return apiClient.postForm<UploadResponse>('/media/upload', form)
  },
}
