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
          <div className="framework-row">
            <span className="framework-tag">Claude Code</span>
            <span className="framework-tag">Cursor</span>
            <span className="framework-tag">Windsurf</span>
            <span className="framework-tag">OpenClaw</span>
            <span className="framework-tag">Hermes Agent</span>
            <span className="framework-tag">OpenAI Agents SDK</span>
            <span className="framework-tag">LangGraph</span>
            <span className="framework-tag">CrewAI</span>
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
