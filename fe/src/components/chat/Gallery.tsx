import { useEffect, useRef, useState } from 'react';
import { getSessions, hideSession, getMediaUrl, type ChatSession } from '../../services/api';
import { BvhPlayerController } from '../../lib/BvhPlayerController';

interface Props {
  onOpenSession?: (sessionId: string) => void;
}

function GalleryViewer({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<BvhPlayerController | null>(null);

  useEffect(() => {
    if (!ref.current || controllerRef.current) return;
    const controller = new BvhPlayerController(ref.current, url);
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [url]);

  return <div ref={ref} className="gallery-viewer" />;
}

export function Gallery({ onOpenSession }: Props) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  const load = () => {
    getSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleHide = async (id: string) => {
    await hideSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleViewer = (jobId: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="gallery-loading">
        <div className="anim-card__spinner" />
        <span>Loading sessions...</span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="gallery-empty">
        <p>No sessions yet. Try the Motion Studio to create one.</p>
      </div>
    );
  }

  return (
    <div className="gallery">
      {sessions.map((session) => (
        <div key={session.id} className="gallery-card">
          <div className="gallery-card__header">
            <span className="gallery-card__title">{session.title}</span>
            <span className="gallery-card__time">
              {new Date(session.created_at).toLocaleString()}
            </span>
            {onOpenSession && (
              <button
                className="gallery-card__resume"
                onClick={() => onOpenSession(session.id)}
              >
                Resume
              </button>
            )}
            <button
              className="gallery-card__hide"
              onClick={() => handleHide(session.id)}
              title="Hide this session"
            >
              Hide
            </button>
          </div>
          <div className="gallery-card__messages">
            {session.messages.map((msg, i) => (
              <div key={i}>
                <div className={`gallery-msg gallery-msg--${msg.role}`}>
                  <span className="gallery-msg__role">{msg.role}</span>
                  <span className="gallery-msg__text">{msg.content}</span>
                </div>
                {msg.job && msg.job.status === 'completed' && msg.job.result_url && (
                  <div className="gallery-msg__result">
                    <span className="anim-card__badge">Animation</span>
                    {msg.job.meta && (
                      <span className="anim-card__meta">
                        {msg.job.meta.frames} frames &middot; {msg.job.meta.fps}fps
                      </span>
                    )}
                    <button
                      className="anim-card__toggle"
                      onClick={() => toggleViewer(msg.job!.id)}
                    >
                      {expandedJobs.has(msg.job.id) ? 'Collapse' : 'Preview'}
                    </button>
                    <a
                      className="anim-card__download"
                      href={getMediaUrl(msg.job.result_url)}
                      download="animation.bvh"
                    >
                      Download BVH
                    </a>
                  </div>
                )}
                {msg.job && expandedJobs.has(msg.job.id) && msg.job.result_url && (
                  <div className="gallery-viewer-wrap">
                    <GalleryViewer url={getMediaUrl(msg.job.result_url)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
