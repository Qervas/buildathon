import { useEffect, useRef, useState } from 'react';
import { BvhPlayerController } from '../../lib/BvhPlayerController';
import type { Job } from '../../services/api';
import { getMediaUrl, pollJob } from '../../services/api';

interface Props {
  jobId: string;
}

export function AnimationCard({ jobId }: Props) {
  const [job, setJob] = useState<Job | null>(null);
  const [expanded, setExpanded] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<BvhPlayerController | null>(null);

  useEffect(() => {
    const cleanup = pollJob(jobId, setJob);
    return cleanup;
  }, [jobId]);

  useEffect(() => {
    if (!expanded || !viewerRef.current || !job?.result_url) return;
    if (controllerRef.current) return;

    const url = getMediaUrl(job.result_url);
    const controller = new BvhPlayerController(viewerRef.current, url);
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [expanded, job?.result_url]);

  if (!job) {
    return (
      <div className="anim-card anim-card--loading">
        <div className="anim-card__spinner" />
        <span>Submitting...</span>
      </div>
    );
  }

  if (job.status === 'pending' || job.status === 'processing') {
    return (
      <div className="anim-card anim-card--loading">
        <div className="anim-card__spinner" />
        <span>Generating animation on GPU...</span>
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
    <div className="anim-card">
      <div className="anim-card__header">
        <span className="anim-card__badge">Animation</span>
        {job.meta && (
          <span className="anim-card__meta">
            {job.meta.frames} frames &middot; {job.meta.fps}fps
          </span>
        )}
        <button
          className="anim-card__toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Collapse' : 'Preview'}
        </button>
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
      {expanded && (
        <div className="anim-card__viewer">
          <div ref={viewerRef} className="anim-card__viewer-inner" />
        </div>
      )}
    </div>
  );
}
