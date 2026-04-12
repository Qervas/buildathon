import { useEffect, useRef, useState } from 'react';
import { BvhPlayerController } from '../../lib/BvhPlayerController';
import type { Job } from '../../services/api';
import { getMediaUrl, pollJob } from '../../services/api';

interface Props {
  jobId: string;
}

export function AnimationCard({ jobId }: Props) {
  const [job, setJob] = useState<Job | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<BvhPlayerController | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const cleanup = pollJob(jobId, setJob);
    return cleanup;
  }, [jobId]);

  // Elapsed timer while processing
  useEffect(() => {
    if (job?.status === 'completed' || job?.status === 'failed') return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [job?.status]);

  // Auto-init viewer when completed
  useEffect(() => {
    if (!viewerRef.current || !job?.result_url) return;
    if (controllerRef.current) return;

    const url = getMediaUrl(job.result_url);
    const controller = new BvhPlayerController(viewerRef.current, url);
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [job?.result_url]);

  if (!job || job.status === 'pending' || job.status === 'processing') {
    return (
      <div className="anim-card anim-card--processing">
        <div className="anim-card__progress-bar">
          <div className="anim-card__progress-fill" />
        </div>
        <div className="anim-card__status-row">
          <div className="anim-card__spinner" />
          <div className="anim-card__status-text">
            <span className="anim-card__status-label">
              {elapsed < 5 ? 'Warming up GPU...' :
               elapsed < 15 ? 'Loading model on A10G...' :
               elapsed < 30 ? 'Generating motion...' :
               elapsed < 50 ? 'Denoising animation...' :
               'Finalizing BVH export...'}
            </span>
            <span className="anim-card__elapsed">{elapsed}s</span>
          </div>
        </div>
      </div>
    );
  }

  if (job.status === 'failed') {
    return (
      <div className="anim-card anim-card--error">
        <span>Generation failed: {job.error || 'Unknown error'}</span>
      </div>
    );
  }

  return (
    <div className="anim-card anim-card--complete">
      <div className="anim-card__viewer">
        <div ref={viewerRef} className="anim-card__viewer-inner" />
      </div>
      <div className="anim-card__footer">
        <span className="anim-card__badge">Animation</span>
        {job.meta && (
          <span className="anim-card__meta">
            {job.meta.frames} frames &middot; {job.meta.fps}fps
            {job.meta.gpu_seconds && <> &middot; {job.meta.gpu_seconds}s GPU</>}
          </span>
        )}
        {job.result_url && (
          <a
            className="anim-card__download"
            href={getMediaUrl(job.result_url)}
            download="animation.bvh"
          >
            Download BVH
          </a>
        )}
      </div>
    </div>
  );
}
