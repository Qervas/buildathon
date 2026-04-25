import { startTransition, useEffect, useRef, useState } from 'react';
import {
  BvhPlayerController,
  type BvhDisplayMode,
  type BvhPlayerSnapshot,
} from '../../lib/BvhPlayerController';
import type { Job } from '../../services/api';
import { getMediaUrl, pollJob } from '../../services/api';

interface Props {
  jobId: string;
}

const INITIAL_SNAPSHOT: BvhPlayerSnapshot = {
  canToggleDisplay: false,
  currentTime: 0,
  displayMode: 'skeleton',
  duration: 0,
  error: null,
  isPlaying: false,
  ready: false,
};

function DisplayModeIcon({ mode }: { mode: BvhDisplayMode }) {
  if (mode === 'skeleton') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 7.4V12.4M8.5 10.3L12 12.4L15.5 10.3M9.2 18.2L12 12.4L14.8 18.2M9.3 23.2L9.2 18.2M14.7 23.2L14.8 18.2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.8C14.2 2.8 16 4.6 16 6.8C16 8.1 15.4 9.3 14.5 10.1C16.9 11.3 18.2 13.8 18.2 17V21.2H5.8V17C5.8 13.8 7.1 11.3 9.5 10.1C8.6 9.3 8 8.1 8 6.8C8 4.6 9.8 2.8 12 2.8Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function AnimationCard({ jobId }: Props) {
  const [job, setJob] = useState<Job | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);
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
    const unsubscribe = controller.subscribe((next) => {
      startTransition(() => {
        setSnapshot(next);
      });
    });

    return () => {
      unsubscribe();
      controller.destroy();
      controllerRef.current = null;
    };
  }, [job?.result_url]);

  const nextDisplayMode: BvhDisplayMode =
    snapshot.displayMode === 'mesh' ? 'skeleton' : 'mesh';
  const displayToggleLabel =
    nextDisplayMode === 'skeleton'
      ? 'Switch to skeleton view'
      : 'Switch to character model view';

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
        <button
          type="button"
          className="anim-card__display-toggle"
          onClick={() => controllerRef.current?.toggleDisplayMode()}
          disabled={!snapshot.canToggleDisplay}
          aria-label={displayToggleLabel}
          title={displayToggleLabel}
        >
          <DisplayModeIcon mode={nextDisplayMode} />
        </button>
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
