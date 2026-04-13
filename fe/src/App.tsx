import { useCallback, useState } from 'react';
import { BvhPlayer } from './components/BvhPlayer';
import { ChatView } from './components/chat/ChatView';
import { Gallery } from './components/chat/Gallery';

const API_BASE = 'https://backend-production-b095.up.railway.app';

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

        <section className="landing__protocols">
          <p className="eyebrow">Agentic Ecosystem</p>
          <h2>Works with every agent framework</h2>
          <p className="lede">
            ohao provides animation capabilities as a tool layer — plug into any
            agent protocol or framework. We don't compete with agents, we empower them.
          </p>
          <div className="protocol-grid">
            <div className="protocol-badge protocol-badge--active">
              <span className="protocol-badge__name">MCP</span>
              <span className="protocol-badge__by">Anthropic</span>
              <span className="protocol-badge__status">Supported</span>
            </div>
            <div className="protocol-badge protocol-badge--active">
              <span className="protocol-badge__name">REST API</span>
              <span className="protocol-badge__by">Universal</span>
              <span className="protocol-badge__status">Supported</span>
            </div>
            <div className="protocol-badge protocol-badge--soon">
              <span className="protocol-badge__name">A2A</span>
              <span className="protocol-badge__by">Google / Linux Foundation</span>
              <span className="protocol-badge__status">Coming soon</span>
            </div>
            <div className="protocol-badge protocol-badge--soon">
              <span className="protocol-badge__name">AG-UI</span>
              <span className="protocol-badge__by">CopilotKit</span>
              <span className="protocol-badge__status">Coming soon</span>
            </div>
          </div>
          <div className="framework-marquee">
            <div className="framework-marquee__track">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="framework-marquee__set">
                  <div className="framework-logo">
                    <svg className="framework-logo__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    <span>Anthropic</span>
                  </div>
                  <div className="framework-logo">
                    <svg className="framework-logo__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z"/></svg>
                    <span>OpenAI</span>
                  </div>
                  <div className="framework-logo">
                    <svg className="framework-logo__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L1.75 6v12L12 24l10.25-6V6L12 0zm0 3.5L18.5 7.5v9L12 20.5l-6.5-4V7.5L12 3.5z"/></svg>
                    <span>Cursor</span>
                  </div>
                  <div className="framework-logo">
                    <svg className="framework-logo__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
                    <span>Windsurf</span>
                  </div>
                  <div className="framework-logo">
                    <svg className="framework-logo__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6zm2 4h8l-4 10H8l2-5H8V7z"/></svg>
                    <span>OpenClaw</span>
                  </div>
                  <div className="framework-logo">
                    <svg className="framework-logo__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span>Hermes</span>
                  </div>
                  <div className="framework-logo">
                    <svg className="framework-logo__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 11.48l1.44-2.5a.5.5 0 00-.87-.5L16.73 11a9.3 9.3 0 00-4.73-1.3 9.3 9.3 0 00-4.73 1.3L5.83 8.48a.5.5 0 00-.87.5l1.44 2.5A8.48 8.48 0 004 17h16a8.48 8.48 0 00-2.4-5.52zM8.5 14a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2z"/></svg>
                    <span>LangGraph</span>
                  </div>
                  <div className="framework-logo">
                    <svg className="framework-logo__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 016.32 12.9l-3.56-2.06a4 4 0 10-5.52 0L5.68 16.9A8 8 0 0112 4z"/></svg>
                    <span>CrewAI</span>
                  </div>
                  <div className="framework-logo">
                    <svg className="framework-logo__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
                    <span>Codex</span>
                  </div>
                  <div className="framework-logo">
                    <svg className="framework-logo__icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="7.5" cy="12" r="3"/><circle cx="16.5" cy="12" r="3"/><path d="M10.5 12h3"/></svg>
                    <span>NVIDIA</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing__integrations">
          <p className="eyebrow">Install</p>
          <h2>Use it everywhere</h2>
          <div className="integration-cards">
            <div className="integration-card">
              <span className="integration-card__icon">MCP</span>
              <span className="integration-card__name">AI Agent Plugin</span>
              <span className="integration-card__desc">
                Claude Code, Cursor, Windsurf — any MCP-compatible agent can generate animations.
              </span>
              <code className="integration-card__code">
                git clone https://github.com/Qervas/buildathon.git{'\n'}
                cd buildathon/mcp-server &amp;&amp; npm i &amp;&amp; npm run build
              </code>
              <span className="integration-card__install">
                Add to your agent config:
              </span>
              <code className="integration-card__code integration-card__code--sm">
                {`"ohao-motion": { "command": "node", "args": ["path/to/mcp-server/dist/index.js"] }`}
              </code>
              <a className="integration-card__link" href="https://github.com/Qervas/buildathon/tree/main/mcp-server" target="_blank" rel="noopener">
                Full instructions &rarr;
              </a>
            </div>
            <div className="integration-card">
              <span className="integration-card__icon">B</span>
              <span className="integration-card__name">Blender Plugin</span>
              <span className="integration-card__desc">
                Sidebar panel + Ctrl+Shift+M shortcut. Generate and import BVH directly in Blender.
              </span>
              <code className="integration-card__code">
                git clone https://github.com/Qervas/buildathon.git{'\n'}
                cp -r buildathon/plugins/blender{'\n'}
                {'  '}~/.config/blender/&lt;version&gt;/scripts/addons/ohao_motion
              </code>
              <span className="integration-card__install">
                Then enable in Blender: Edit &gt; Preferences &gt; Add-ons &gt; search "ohao"
              </span>
              <a className="integration-card__link" href="https://github.com/Qervas/buildathon/tree/main/plugins/blender" target="_blank" rel="noopener">
                Full instructions &rarr;
              </a>
            </div>
            <div className="integration-card">
              <span className="integration-card__icon">{'{ }'}</span>
              <span className="integration-card__name">REST API</span>
              <span className="integration-card__desc">
                Simple HTTP endpoints for text-to-motion and video motion capture.
              </span>
              <code className="integration-card__code">
                curl -X POST {API_BASE}/api/generate/text2motion{'\n'}
                {'  '}-H "Content-Type: application/json"{'\n'}
                {'  '}-d '{`{"prompt":"victory dance","duration":4}`}'
              </code>
              <a className="integration-card__link" href="https://backend-production-b095.up.railway.app/docs" target="_blank" rel="noopener">
                API Docs &rarr;
              </a>
            </div>
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
