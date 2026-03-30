import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  Film, Download, Trash2, Play, X, Clock,
  Search, RefreshCw, BookOpen, FileText, Video
} from 'lucide-react'

const API = 'http://localhost:8000'

function fmtDur(s) {
  if (!s) return '—'
  const m = Math.floor(s / 60), sec = Math.round(s % 60)
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function VideoModal({ job, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(6px)', padding: 20,
    }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', width: '100%', maxWidth: 700, position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <video
          src={`${API}${job.video_url}`}
          controls autoPlay
          style={{ width: '100%', display: 'block', background: '#000' }}
        />
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{job.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {fmtDate(job.created_at)} · {fmtDur(job.duration)}
              · {job.source === 'notebooklm' ? '📓 NotebookLM' : '📝 Script'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={`${API}${job.video_url}`} download
              className="btn-primary" style={{ textDecoration: 'none' }}
            >
              <Download size={14} /> Download
            </a>
            <button className="btn-ghost" onClick={onClose}><X size={15} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

function VideoCard({ job, onDelete, onPlay }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      className="card"
      style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '100%', aspectRatio: '16/9', position: 'relative',
          background: 'var(--bg-elevated)',
          backgroundImage: job.thumb_url ? `url(${API}${job.thumb_url})` : 'none',
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={() => onPlay(job)}
      >
        {!job.thumb_url && <Video size={24} color="var(--text-muted)" />}
        {hover && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(249,115,22,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
            }}>
              <Play size={18} color="#fff" style={{ marginLeft: 3 }} />
            </div>
          </div>
        )}
        {/* Duration badge */}
        {job.duration && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(0,0,0,0.75)', borderRadius: 4,
            padding: '2px 6px', fontSize: 11, fontWeight: 600,
          }}>
            {fmtDur(job.duration)}
          </div>
        )}
        {/* Source badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(0,0,0,0.6)', borderRadius: 4,
          padding: '2px 7px', fontSize: 10, fontWeight: 700,
        }}>
          {job.source === 'notebooklm' ? '📓 NLM' : '📝 Script'}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
            {fmtDate(job.created_at)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 }}>
          <a
            href={`${API}${job.video_url}`} download
            className="btn-ghost"
            style={{ padding: '5px 8px' }}
            onClick={e => e.stopPropagation()}
          >
            <Download size={13} />
          </a>
          <button
            className="btn-ghost"
            style={{ padding: '5px 8px', color: 'var(--rose)' }}
            onClick={e => { e.stopPropagation(); onDelete(job.id) }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VideoLibrary() {
  const [videos,   setVideos]   = useState([])
  const [jobs,     setJobs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')   // all | script | notebooklm
  const [playing,  setPlaying]  = useState(null)
  const pollRef = useRef()

  const fetchAll = async () => {
    const r = await axios.get(`${API}/api/jobs`)
    const all = r.data.jobs
    setJobs(all)
    setVideos(all.filter(j => j.status === 'completed'))
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    // Poll for in-progress jobs
    pollRef.current = setInterval(() => {
      fetchAll()
    }, 3000)
    return () => clearInterval(pollRef.current)
  }, [])

  const handleDelete = async (jobId) => {
    if (!confirm('Delete this video?')) return
    await axios.delete(`${API}/api/videos/${jobId}`)
    fetchAll()
  }

  const inProgress = jobs.filter(j => ['queued','processing'].includes(j.status))

  const filtered = videos.filter(v => {
    const matchSearch = !search || v.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || v.source === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--saffron)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Library
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Video Library
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
            {videos.length} video{videos.length !== 1 ? 's' : ''} generated
          </p>
        </div>
        <button className="btn-ghost" onClick={fetchAll}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* In-progress jobs */}
      {inProgress.length > 0 && (
        <div style={{
          background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)',
          borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 24,
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--saffron)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            In Progress ({inProgress.length})
          </div>
          {inProgress.map(job => (
            <div key={job.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{job.title}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{job.step}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${job.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            placeholder="Search videos…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        {/* Source filter */}
        {[
          { key: 'all',          label: 'All',         icon: Film },
          { key: 'script',       label: 'From Script', icon: FileText },
          { key: 'notebooklm',   label: 'NotebookLM',  icon: BookOpen },
        ].map(f => (
          <button
            key={f.key}
            className={filter === f.key ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: 13 }}
            onClick={() => setFilter(f.key)}
          >
            <f.icon size={13} /> {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="shimmer" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <Film size={40} style={{ opacity: 0.25, marginBottom: 14, display: 'block', margin: '0 auto 14px' }} />
          <p style={{ fontWeight: 600, marginBottom: 6 }}>
            {search ? 'No videos match your search' : 'No videos yet'}
          </p>
          <p style={{ fontSize: 13 }}>
            {search ? 'Try a different search term' : 'Create a video from a script or import from NotebookLM'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {filtered.map(job => (
            <VideoCard key={job.id} job={job} onDelete={handleDelete} onPlay={setPlaying} />
          ))}
        </div>
      )}

      {/* Modal */}
      {playing && <VideoModal job={playing} onClose={() => setPlaying(null)} />}
    </div>
  )
}
