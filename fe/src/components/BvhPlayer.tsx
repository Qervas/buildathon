import { startTransition, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  BvhPlayerController,
  type BvhPlayerSnapshot,
} from '../lib/BvhPlayerController';

const DEMO_BVH_URL = '/demo/running_animation.bvh';

const INITIAL_SNAPSHOT: BvhPlayerSnapshot = {
  currentTime: 0,
  duration: 0,
  error: null,
  isPlaying: false,
  ready: false,
};

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);

  return `${minutes}:${wholeSeconds.toString().padStart(2, '0')}`;
}

function getProgress(currentTime: number, duration: number) {
  if (!duration) {
    return 0;
  }

  return Math.min(currentTime / duration, 1);
}

function clampRatio(ratio: number) {
  return Math.min(Math.max(ratio, 0), 1);
}

export function BvhPlayer() {
  const controllerRef = useRef<BvhPlayerController | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const viewerFrameRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const hasAutoFocusedRef = useRef(false);

  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);
  const [dragState, setDragState] = useState<{
    pointerId: number;
    resumeAfterDrag: boolean;
  } | null>(null);

  useEffect(() => {
    if (!viewerRef.current) {
      return undefined;
    }

    const controller = new BvhPlayerController(viewerRef.current, DEMO_BVH_URL);
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
  }, []);

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    const updateFromPointer = (clientX: number) => {
      const track = trackRef.current;
      const controller = controllerRef.current;

      if (!track || !controller || !snapshot.duration) {
        return;
      }

      const rect = track.getBoundingClientRect();
      const ratio = clampRatio((clientX - rect.left) / rect.width);
      const nextTime = ratio * snapshot.duration;
      controller.seekTo(nextTime);
    };

    const handlePointerMove = (event: PointerEvent) => {
      updateFromPointer(event.clientX);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) {
        return;
      }

      updateFromPointer(event.clientX);
      const controller = controllerRef.current;
      if (dragState.resumeAfterDrag) {
        controller?.play();
      }
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, snapshot.duration]);

  useEffect(() => {
    if (!snapshot.ready || hasAutoFocusedRef.current || !viewerFrameRef.current) {
      return;
    }

    hasAutoFocusedRef.current = true;
    viewerFrameRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    window.requestAnimationFrame(() => {
      viewerFrameRef.current?.focus({ preventScroll: true });
    });
  }, [snapshot.ready]);

  const progress = getProgress(snapshot.currentTime, snapshot.duration);

  const handleTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!snapshot.ready || !snapshot.duration) {
      return;
    }

    const controller = controllerRef.current;
    controller?.pause();

    setDragState({
      pointerId: event.pointerId,
      resumeAfterDrag: snapshot.isPlaying,
    });

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = clampRatio((event.clientX - rect.left) / rect.width);
    controller?.seekTo(ratio * snapshot.duration);
  };

  const togglePlayback = () => {
    controllerRef.current?.toggle();
  };

  const handleTrackKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!snapshot.ready || !snapshot.duration) {
      return;
    }

    const controller = controllerRef.current;
    if (!controller) {
      return;
    }

    const step = Math.max(snapshot.duration / 40, 0.1);

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        controller.seekTo(snapshot.currentTime - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        controller.seekTo(snapshot.currentTime + step);
        break;
      case 'Home':
        event.preventDefault();
        controller.seekTo(0);
        break;
      case 'End':
        event.preventDefault();
        controller.seekTo(snapshot.duration);
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        controller.toggle();
        break;
      default:
        break;
    }
  };

  const toggleLabel = snapshot.isPlaying ? 'Pause playback' : 'Resume playback';

  return (
    <main className="page-shell">
      <section className="player-card">
        <div className="player-copy">
          <p className="eyebrow">Buildathon Motion Viewer</p>
          <h1>BVH animation preview with direct timeline control.</h1>
          <p className="lede">
            Bundled sample motion, autoplay on load, and a controller-owned
            timeline that stays in sync while you scrub.
          </p>
        </div>

        <div
          ref={viewerFrameRef}
          className="viewer-frame"
          tabIndex={-1}
          aria-label="BVH animation preview"
        >
          <div ref={viewerRef} className="viewer" />

          <div className="viewer-overlay">
            <div className="viewer-status">
              {snapshot.error
                ? snapshot.error
                : snapshot.ready
                  ? 'Autoplay preview ready'
                  : 'Loading bundled BVH sample...'}
            </div>

            <div className="control-dock">
              <div
                ref={trackRef}
                className={`control-dock__track ${dragState ? 'control-dock__track--dragging' : ''}`}
                onPointerDown={handleTrackPointerDown}
                role="slider"
                aria-label="Playback timeline"
                aria-valuemin={0}
                aria-valuemax={snapshot.duration}
                aria-valuenow={snapshot.currentTime}
                aria-valuetext={`${formatTime(snapshot.currentTime)} of ${formatTime(snapshot.duration)}`}
                onKeyDown={handleTrackKeyDown}
                tabIndex={snapshot.ready ? 0 : -1}
              >
                <div
                  className="control-dock__fill"
                  style={{ transform: `scaleX(${progress})` }}
                />
                <div
                  className="control-dock__needle"
                  style={{ left: `calc(${progress * 100}% - 1px)` }}
                />
              </div>

              <div className="control-top">
                <span className="time-readout">{formatTime(snapshot.currentTime)}</span>

                <button
                  type="button"
                  className="play-toggle"
                  onClick={togglePlayback}
                  disabled={!snapshot.ready}
                  aria-label={toggleLabel}
                  title={toggleLabel}
                >
                  {snapshot.isPlaying ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 5H10V19H7zM14 5H17V19H14z" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5.5L18 12L8 18.5V5.5z" fill="currentColor" />
                    </svg>
                  )}
                </button>

                <span className="time-readout">{formatTime(snapshot.duration)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
