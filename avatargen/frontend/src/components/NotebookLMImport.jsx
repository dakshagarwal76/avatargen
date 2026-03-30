import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { BookOpen, Upload, Video, CheckCircle, Loader, AlertTriangle } from 'lucide-react'

const API = 'http://localhost:8000'

export default function NotebookLMImport() {
  const [avatars, setAvatars] = useState([])
  const [avatarId, setAvatarId] = useState('')
  const [videoMeta, setVideoMeta] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [mode, setMode] = useState('background_avatar_corner')
  const [ttsText, setTtsText] = useState('')
  const [ttsVoice, setTtsVoice] = useState('hi-IN-SwaraNeural')
  const [job, setJob] = useState(null)
  const [jobId, setJobId] = useState(null)
  const inputRef = useRef()
  const pollRef = useRef()

  useEffect(() => {
    axios.get(`${API}/api/avatars`).then(r => {
      setAvatars(r.data.avatars)
      if (r.data.avatars.length) setAvatarId(r.data.avatars[0].id)
    })
  }, [])

  useEffect(() => {
    if (!jobId) return
    const poll = async () => {
      const r = await axios.get(`${API}/api/jobs/${jobId}`)
      setJob(r.data)
      if (['completed', 'failed'].includes(r.data.status)) clearInterval(pollRef.current)
    }
    poll(); pollRef.current = setInterval(poll, 2500)
    return () => clearInterval(pollRef.current)
  }, [jobId])

  const uploadVideo = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await axios.post(`${API}/api/imports/video`, fd)
      setVideoMeta(r.data)
    } catch (e) {
      alert(e.response?.data?.detail || e.message)
    } finally {
      setUploading(false)
    }
  }

  const start = async () => {
    if (!videoMeta || !avatarId) return alert('Upload video and select avatar first')
    const r = await axios.post(`${API}/api/videos/from-import`, {
      avatar_id: avatarId,
      import_video_id: videoMeta.import_video_id,
      mode,
      tts_text: ttsText || undefined,
      tts_voice: ttsVoice,
      title: 'NotebookLM video remix',
    })
    setJobId(r.data.job_id)
    setJob({ status: 'queued', progress: 0, step: 'Queued...' })
  }

  return (
    <div style={{ padding: 32, maxWidth: 850, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', display: 'flex', gap: 10, alignItems: 'center' }}><BookOpen size={22} /> NotebookLM Video Import</h1>
      <p style={{ color: 'var(--text-muted)', margin: '8px 0 18px' }}>Upload a NotebookLM video (not just audio), then choose what to do.</p>

      {!job && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <label className="field-label">Upload source video</label>
            <div onClick={() => inputRef.current?.click()} style={{ border: '2px dashed var(--border-normal)', borderRadius: 12, padding: 26, textAlign: 'center', cursor: 'pointer' }}>
              {uploading ? <Loader style={{ animation: 'spin 1s linear infinite' }} /> : <Upload />}
              <div style={{ marginTop: 8 }}>{videoMeta ? `Uploaded: ${videoMeta.filename}` : 'Click to choose MP4/MOV/WebM'}</div>
            </div>
            <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => uploadVideo(e.target.files?.[0])} />
            {videoMeta && <video src={`${API}${videoMeta.video_url}`} controls style={{ width: '100%', marginTop: 12, borderRadius: 10 }} />}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <label className="field-label">Import option</label>
            <select className="input" value={mode} onChange={e => setMode(e.target.value)}>
              <option value="background_avatar_corner">Keep uploaded video in background + avatar in corner</option>
              <option value="replace_voice_with_avatar">Replace voice with Indian AI voice + avatar lip sync</option>
              <option value="extract_script">Extract transcript (coming soon)</option>
              <option value="overlay_avatar">Add avatar overlay on top</option>
            </select>
            <label className="field-label" style={{ marginTop: 10 }}>Optional replacement script (for AI voice)</label>
            <textarea className="input" rows={3} value={ttsText} onChange={e => setTtsText(e.target.value)} placeholder="If empty, audio extracted from uploaded video will be used" />
            <label className="field-label" style={{ marginTop: 10 }}>Voice</label>
            <input className="input" value={ttsVoice} onChange={e => setTtsVoice(e.target.value)} />
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <label className="field-label">Avatar</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 10 }}>
              {avatars.map(a => (
                <div key={a.id} onClick={() => setAvatarId(a.id)} style={{ cursor: 'pointer', border: `2px solid ${avatarId === a.id ? 'var(--saffron)' : 'var(--border-subtle)'}`, borderRadius: 8 }}>
                  <img src={`${API}${a.thumb_url}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6 }} />
                </div>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={start}><Video size={15} /> Generate</button>
        </>
      )}

      {job && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {job.status === 'failed' ? <AlertTriangle color="var(--rose)" /> : job.status === 'completed' ? <CheckCircle color="var(--emerald)" /> : <Loader style={{ animation: 'spin 1s linear infinite' }} />}
            <strong>{job.step}</strong>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${job.progress || 0}%` }} /></div>
          {job.status === 'completed' && <video src={`${API}${job.video_url}`} controls style={{ marginTop: 12, width: '100%' }} />}
        </div>
      )}
    </div>
  )
}
