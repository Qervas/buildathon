import { useCallback, useState } from 'react';
import { BvhPlayer } from './components/BvhPlayer';
import { ChatView } from './components/chat/ChatView';
import { Gallery } from './components/chat/Gallery';

const API_BASE = 'https://backend-production-b095.up.railway.app';

type Page = { view: 'landing' } | { view: 'chat'; sessionId?: string } | { view: 'gallery' };

const LOGOS: { name: string; color: string; svg: string }[] = [
  { name: 'Claude Code', color: '#d97706', svg: '<path d="M13.827 3.52h3.603L24 20.48h-3.603l-1.404-3.784H11.03L9.626 20.48H6.023L12.453 3.52h1.374zm2.285 10.18L13.19 6.97l-2.923 6.73h5.845z"/>' },
  { name: 'ChatGPT', color: '#10b981', svg: '<path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18 5.98 5.98 0 0 0 .98 7.08a6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07z"/>' },
  { name: 'Kimodo', color: '#76b900', svg: '<path d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.422 0-.81-.065-1.167-.187v-4.675c1.733.18 2.076.89 3.108 2.593l2.31-1.94S12.32 8.798 9.372 8.798h-.424zM8.948 4.252v2.148l.424-.024c5.41-.182 8.948 4.29 8.948 4.29s-4.066 4.86-8.303 4.86c-.37 0-.724-.034-1.069-.097v1.858c.283.036.574.058.873.058 4.15 0 7.14-2.132 10.052-4.64.48.384 2.448 1.32 2.848 1.728-2.848 2.352-9.48 4.488-12.836 4.488-.316 0-.62-.018-.937-.049v2.404H3V4.252h5.948zM3 13.78v-1.804c.503-.082 1.878-.16 1.878-.16v3.535C3.82 14.746 3 13.78 3 13.78z"/>' },
  { name: 'Cursor', color: '#3b82f6', svg: '<path d="M5 3l14 9-14 9V3z"/>' },
  { name: 'Windsurf', color: '#06b6d4', svg: '<path d="M3 17c3-5 6-10 9-10s6 5 9 10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M3 13c3-4 6-8 9-8s6 4 9 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/>' },
  { name: 'OpenClaw', color: '#ef4444', svg: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.68.78 4.95 2.05l-1.41 1.41A5.02 5.02 0 0 0 12 8c-2.76 0-5 2.24-5 5s2.24 5 5 5a4.98 4.98 0 0 0 3.54-1.46l1.41 1.41A6.98 6.98 0 0 1 12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8z"/><circle cx="12" cy="13" r="2"/>' },
  { name: 'Hermes', color: '#8b5cf6', svg: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 12l10 5 10-5" fill="none" stroke="currentColor" stroke-width="2"/>' },
  { name: 'LangGraph', color: '#f97316', svg: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H15.5M6 8.5V15.5M18 8.5V15.5M8.5 18H15.5" stroke="currentColor" stroke-width="1.5" fill="none"/>' },
  { name: 'CrewAI', color: '#ec4899', svg: '<circle cx="12" cy="8" r="3"/><circle cx="6" cy="16" r="2.5"/><circle cx="18" cy="16" r="2.5"/><path d="M12 11v2M9.5 14.5L7.5 15.5M14.5 14.5l2 1" stroke="currentColor" stroke-width="1.5" fill="none"/>' },
  { name: 'Codex', color: '#6366f1', svg: '<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>' },
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
                {LOGOS.map((logo) => (
                  <span key={logo.name} className="land__trust-logo" style={{ color: logo.color }}>
                    {/* SVG icons are hardcoded constants, not user input */}
                    <svg className="land__trust-icon" viewBox="0 0 24 24" fill="currentColor" dangerouslySetInnerHTML={{ __html: logo.svg }} />
                    {logo.name}
                  </span>
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
