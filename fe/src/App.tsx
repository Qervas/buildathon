import { useState } from 'react';
import { BvhPlayer } from './components/BvhPlayer';
import { ChatView } from './components/chat/ChatView';
import { Gallery } from './components/chat/Gallery';

type Page = 'landing' | 'chat' | 'gallery';

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
  const [page, setPage] = useState<Page>('landing');

  if (page === 'chat') {
    return (
      <>
        <nav className="topnav">
          <button className="topnav__back" onClick={() => setPage('landing')}>
            &larr; Back
          </button>
          <span className="topnav__title">Motion Studio</span>
          <button className="topnav__link" onClick={() => setPage('gallery')}>
            Gallery
          </button>
        </nav>
        <ChatView />
      </>
    );
  }

  if (page === 'gallery') {
    return (
      <>
        <nav className="topnav">
          <button className="topnav__back" onClick={() => setPage('landing')}>
            &larr; Back
          </button>
          <span className="topnav__title">Gallery</span>
          <button className="topnav__link" onClick={() => setPage('chat')}>
            New Chat
          </button>
        </nav>
        <Gallery />
      </>
    );
  }

  return <Landing onEnter={() => setPage('chat')} onGallery={() => setPage('gallery')} />;
}
