import { useCallback, useState } from 'react';
import { BvhPlayer } from './components/BvhPlayer';
import { ChatView } from './components/chat/ChatView';
import { Gallery } from './components/chat/Gallery';

type Page = { view: 'landing' } | { view: 'chat'; sessionId?: string } | { view: 'gallery' };

function Landing({ onEnter, onGallery }: { onEnter: () => void; onGallery: () => void }) {
  return (
    <main className="page-shell">
      <section className="landing">
        <div className="landing__hero">
          <p className="eyebrow">ohao &middot; AI Animation Platform</p>
          <h1>
            Type a sentence.
            <br />
            <em>Get a skeleton animation.</em>
          </h1>
          <p className="lede">
            We deploy cutting-edge open-source AI models and deliver them as
            simple APIs. Describe a motion in words, or upload a video — get
            production-quality skeletal animation in seconds.
          </p>
          <div className="landing__actions">
            <button className="landing__cta" onClick={onEnter}>
              Try Motion Studio
            </button>
            <button className="landing__cta-secondary" onClick={onGallery}>
              View Gallery
            </button>
          </div>
        </div>

        <div className="landing__demo">
          <BvhPlayer />
        </div>

        <section className="landing__features">
          <div className="feature-card">
            <p className="eyebrow">Text to Motion</p>
            <h3>Describe it, generate it</h3>
            <p>
              Type "a person doing a victory dance" and get a 77-joint SOMA
              skeleton animation. Powered by NVIDIA Kimodo.
            </p>
          </div>
          <div className="feature-card">
            <p className="eyebrow">Video Motion Capture</p>
            <h3>No suit. No studio.</h3>
            <p>
              Upload any video — phone camera, webcam, anything. Get
              professional motion capture data. Powered by NVIDIA GEM-X.
            </p>
          </div>
          <div className="feature-card">
            <p className="eyebrow">Industry Standard</p>
            <h3>BVH format, ready to use</h3>
            <p>
              Output is standard BVH — import directly into Blender, Unity,
              Unreal Engine, or any 3D tool.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>(() => {
    // Restore from URL hash: #chat/sessionId or #gallery
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('chat/')) {
      return { view: 'chat', sessionId: hash.slice(5) };
    }
    if (hash === 'chat') return { view: 'chat' };
    if (hash === 'gallery') return { view: 'gallery' };
    return { view: 'landing' };
  });

  const navigate = useCallback((next: Page) => {
    setPage(next);
    if (next.view === 'chat' && next.sessionId) {
      window.location.hash = `chat/${next.sessionId}`;
    } else if (next.view === 'chat') {
      window.location.hash = 'chat';
    } else if (next.view === 'gallery') {
      window.location.hash = 'gallery';
    } else {
      window.location.hash = '';
    }
  }, []);

  // Called by ChatView once it creates/loads a session
  const handleSessionReady = useCallback((sessionId: string) => {
    window.location.hash = `chat/${sessionId}`;
  }, []);

  if (page.view === 'chat') {
    return (
      <>
        <nav className="topnav">
          <button className="topnav__back" onClick={() => navigate({ view: 'landing' })}>
            &larr; Back
          </button>
          <span className="topnav__title">Motion Studio</span>
          <button className="topnav__link" onClick={() => navigate({ view: 'gallery' })}>
            Gallery
          </button>
        </nav>
        <ChatView
          initialSessionId={page.sessionId}
          onSessionReady={handleSessionReady}
        />
      </>
    );
  }

  if (page.view === 'gallery') {
    return (
      <>
        <nav className="topnav">
          <button className="topnav__back" onClick={() => navigate({ view: 'landing' })}>
            &larr; Back
          </button>
          <span className="topnav__title">Gallery</span>
          <button className="topnav__link" onClick={() => navigate({ view: 'chat' })}>
            New Chat
          </button>
        </nav>
        <Gallery onOpenSession={(id) => navigate({ view: 'chat', sessionId: id })} />
      </>
    );
  }

  return (
    <Landing
      onEnter={() => navigate({ view: 'chat' })}
      onGallery={() => navigate({ view: 'gallery' })}
    />
  );
}
