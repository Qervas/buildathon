import { useCallback, useState } from 'react';
import { BvhPlayer } from './components/BvhPlayer';
import { ChatView } from './components/chat/ChatView';
import { Gallery } from './components/chat/Gallery';

const API_BASE = 'https://backend-production-b095.up.railway.app';

type Page = { view: 'landing' } | { view: 'chat'; sessionId?: string } | { view: 'gallery' };

const LOGOS = [
  'Anthropic', 'OpenAI', 'NVIDIA', 'Cursor', 'Windsurf',
  'OpenClaw', 'Hermes', 'LangGraph', 'CrewAI', 'Codex',
];

function Landing({ onEnter, onGallery }: { onEnter: () => void; onGallery: () => void }) {
  return (
    <main className="land">
      {/* ── Nav ── */}
      <nav className="land__nav">
        <span className="land__wordmark">ohao</span>
        <div className="land__nav-links">
          <button className="land__nav-btn" onClick={onGallery}>Gallery</button>
          <button className="land__nav-btn land__nav-btn--primary" onClick={onEnter}>Try it</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="land__hero">
        <h1 className="land__title">
          Type a sentence.<br />
          <span className="land__title--accent">Get a skeleton animation.</span>
        </h1>
        <p className="land__sub">
          Open-source AI motion generation. Text to animation in 30 seconds.
          Video to motion capture without a studio. $0.001 per generation.
        </p>
        <div className="land__ctas">
          <button className="land__btn" onClick={onEnter}>Open Motion Studio</button>
          <button className="land__btn land__btn--ghost" onClick={onGallery}>Browse Gallery</button>
        </div>
      </section>

      {/* ── Trust Bar / Company Logos ── */}
      <section className="land__trust">
        <p className="land__trust-label">Works with</p>
        <div className="land__trust-marquee">
          <div className="land__trust-track">
            {[0, 1].map((k) => (
              <div key={k} className="land__trust-set">
                {LOGOS.map((name) => (
                  <span key={name} className="land__trust-logo">{name}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Preview ── */}
      <section className="land__preview">
        <div className="land__preview-frame">
          <BvhPlayer />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="land__section">
        <div className="land__section-header">
          <span className="land__label">Capabilities</span>
          <h2>Two models. Infinite motions.</h2>
        </div>
        <div className="land__grid land__grid--3">
          <div className="land__card">
            <span className="land__card-num">01</span>
            <h3>Text to Motion</h3>
            <p>
              Describe any motion in words. NVIDIA Kimodo generates a 77-joint
              SOMA skeleton animation at 30fps. Ready for Blender, Unity, Unreal.
            </p>
          </div>
          <div className="land__card">
            <span className="land__card-num">02</span>
            <h3>Video Motion Capture</h3>
            <p>
              Upload any video — phone camera, webcam, anything. NVIDIA GEM-X
              extracts professional motion capture data. No suit. No studio.
            </p>
          </div>
          <div className="land__card">
            <span className="land__card-num">03</span>
            <h3>Industry Standard BVH</h3>
            <p>
              Output is standard BVH format — import directly into any 3D tool.
              77-78 joint SOMA skeleton with centimeter-scale accuracy.
            </p>
          </div>
        </div>
      </section>

      {/* ── Protocols ── */}
      <section className="land__section">
        <div className="land__section-header">
          <span className="land__label">Ecosystem</span>
          <h2>Agent-native from day one</h2>
          <p className="land__section-sub">
            We're a tool layer, not an agent. Every framework can call us.
          </p>
        </div>
        <div className="land__grid land__grid--4">
          {[
            { name: 'MCP', by: 'Anthropic', active: true },
            { name: 'REST API', by: 'Universal', active: true },
            { name: 'A2A', by: 'Google / Linux Foundation', active: false },
            { name: 'AG-UI', by: 'CopilotKit', active: false },
          ].map((p) => (
            <div key={p.name} className={`land__proto ${p.active ? 'land__proto--on' : ''}`}>
              <span className="land__proto-name">{p.name}</span>
              <span className="land__proto-by">{p.by}</span>
              <span className="land__proto-status">{p.active ? 'Supported' : 'Coming soon'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Install ── */}
      <section className="land__section">
        <div className="land__section-header">
          <span className="land__label">Install</span>
          <h2>Three lines to animation</h2>
        </div>
        <div className="land__grid land__grid--3">
          <div className="land__card land__card--code">
            <h3>MCP Plugin</h3>
            <p className="land__card-sub">For Claude Code, Cursor, Windsurf</p>
            <pre className="land__pre">{`git clone github.com/Qervas/buildathon
cd mcp-server && npm i && npm run build`}</pre>
            <a className="land__card-link" href="https://github.com/Qervas/buildathon/tree/main/mcp-server" target="_blank" rel="noopener">Setup guide &rarr;</a>
          </div>
          <div className="land__card land__card--code">
            <h3>Blender Plugin</h3>
            <p className="land__card-sub">Sidebar + Ctrl+Shift+M shortcut</p>
            <pre className="land__pre">{`cp -r plugins/blender \\
  ~/.config/blender/<ver>/\\
  scripts/addons/ohao_motion`}</pre>
            <a className="land__card-link" href="https://github.com/Qervas/buildathon/tree/main/plugins/blender" target="_blank" rel="noopener">Setup guide &rarr;</a>
          </div>
          <div className="land__card land__card--code">
            <h3>REST API</h3>
            <p className="land__card-sub">Integrate from anywhere</p>
            <pre className="land__pre">{`curl -X POST ${API_BASE}\\
  /api/generate/text2motion \\
  -d '{"prompt":"wave","duration":3}'`}</pre>
            <a className="land__card-link" href={`${API_BASE}/docs`} target="_blank" rel="noopener">API docs &rarr;</a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="land__footer">
        <span className="land__wordmark">ohao</span>
        <span className="land__footer-note">Built at LiU Buildathon 2026</span>
      </footer>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('chat/')) return { view: 'chat', sessionId: hash.slice(5) };
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

  const handleSessionReady = useCallback((sessionId: string) => {
    window.location.hash = `chat/${sessionId}`;
  }, []);

  if (page.view === 'chat') {
    return (
      <>
        <nav className="topnav">
          <button className="topnav__back" onClick={() => navigate({ view: 'landing' })}>&larr; Back</button>
          <span className="topnav__title">Motion Studio</span>
          <button className="topnav__link" onClick={() => navigate({ view: 'gallery' })}>Gallery</button>
        </nav>
        <ChatView initialSessionId={page.sessionId} onSessionReady={handleSessionReady} />
      </>
    );
  }

  if (page.view === 'gallery') {
    return (
      <>
        <nav className="topnav">
          <button className="topnav__back" onClick={() => navigate({ view: 'landing' })}>&larr; Back</button>
          <span className="topnav__title">Gallery</span>
          <button className="topnav__link" onClick={() => navigate({ view: 'chat' })}>New Chat</button>
        </nav>
        <Gallery onOpenSession={(id) => navigate({ view: 'chat', sessionId: id })} />
      </>
    );
  }

  return <Landing onEnter={() => navigate({ view: 'chat' })} onGallery={() => navigate({ view: 'gallery' })} />;
}
