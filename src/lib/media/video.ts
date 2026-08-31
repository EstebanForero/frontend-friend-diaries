const MAX_VIDEO_SECONDS = 180
const MAX_VIDEO_BYTES = 32 * 1024 * 1024
const TARGET_VIDEO_BITRATE = 1_150_000
const TARGET_AUDIO_BITRATE = 96_000
const MAX_AVERAGE_BITRATE = 1_550_000

export interface PreparedVideo {
  file: File
  duration: number
  wasCompressed: boolean
}

export async function prepareVideoForUpload(
  sourceFile: File,
  onProgress?: (progress: number) => void,
): Promise<PreparedVideo> {
  const { video, url, duration } = await loadVideo(sourceFile)

  try {
    if (duration > MAX_VIDEO_SECONDS + 0.1) {
      throw new Error('Videos can be at most 3 minutes long.')
    }

    const averageBitrate = (sourceFile.size * 8) / duration
    const supportedContainer = sourceFile.type === 'video/webm' || sourceFile.type === 'video/mp4'
    if (supportedContainer && sourceFile.size <= MAX_VIDEO_BYTES && averageBitrate <= MAX_AVERAGE_BITRATE) {
      onProgress?.(1)
      return { file: sourceFile, duration, wasCompressed: false }
    }

    const compressed = await compressWithBrowser(video, sourceFile.name, duration, onProgress)
    const compressedBitrate = (compressed.size * 8) / duration
    if (compressed.size > MAX_VIDEO_BYTES || compressedBitrate > MAX_AVERAGE_BITRATE) {
      throw new Error('This video could not be compressed below the 32 MB upload limit.')
    }

    return { file: compressed, duration, wasCompressed: true }
  } finally {
    URL.revokeObjectURL(url)
    video.remove()
  }
}

async function loadVideo(file: File) {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.playsInline = true
  video.src = url

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('This video format cannot be read on this device.'))
  })

  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    URL.revokeObjectURL(url)
    throw new Error('The video does not contain valid duration information.')
  }
  return { video, url, duration: video.duration }
}

async function compressWithBrowser(
  video: HTMLVideoElement,
  originalName: string,
  duration: number,
  onProgress?: (progress: number) => void,
): Promise<File> {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Video compression is not supported on this device.')
  }

  const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((type) =>
    MediaRecorder.isTypeSupported(type),
  )
  if (!mimeType) {
    throw new Error('This browser cannot create a compressed WebM video.')
  }

  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 1280 / video.videoWidth, 720 / video.videoHeight)
  canvas.width = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2)
  canvas.height = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2)
  const context = canvas.getContext('2d', { alpha: false })
  if (!context || !canvas.captureStream) {
    throw new Error('Video compression is not supported on this device.')
  }

  const outputStream = canvas.captureStream(24)
  let audioContext: AudioContext | undefined
  try {
    audioContext = new AudioContext()
    const source = audioContext.createMediaElementSource(video)
    const destination = audioContext.createMediaStreamDestination()
    source.connect(destination)
    destination.stream.getAudioTracks().forEach((track) => outputStream.addTrack(track))
    await audioContext.resume()
  } catch {
    // Some embedded browsers cannot route local-file audio into MediaRecorder.
    // The video is still compressed and remains usable without an audio track.
    await audioContext?.close().catch(() => undefined)
    audioContext = undefined
  }

  const chunks: BlobPart[] = []
  const recorder = new MediaRecorder(outputStream, {
    mimeType,
    videoBitsPerSecond: TARGET_VIDEO_BITRATE,
    audioBitsPerSecond: TARGET_AUDIO_BITRATE,
  })
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }

  const stopped = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('The browser could not compress this video.'))
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
  })

  let animationFrame = 0
  const drawFrame = () => {
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    onProgress?.(Math.min(0.99, video.currentTime / duration))
    if (!video.ended && !video.paused) animationFrame = requestAnimationFrame(drawFrame)
  }

  video.currentTime = 0
  recorder.start(1000)
  try {
    await video.play()
  } catch {
    recorder.stop()
    throw new Error('Allow video playback so the app can compress this memory.')
  }
  drawFrame()

  await new Promise<void>((resolve, reject) => {
    video.onended = () => resolve()
    video.onerror = () => reject(new Error('The video could not be decoded during compression.'))
  })
  cancelAnimationFrame(animationFrame)
  recorder.stop()
  const blob = await stopped
  outputStream.getTracks().forEach((track) => track.stop())
  await audioContext?.close().catch(() => undefined)
  onProgress?.(1)

  const stem = originalName.replace(/\.[^.]+$/, '') || 'memory'
  return new File([blob], `${stem}-compressed.webm`, {
    type: 'video/webm',
    lastModified: Date.now(),
  })
}
