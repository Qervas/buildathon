import { useCallback, useState } from 'react';
import { BvhPlayer } from './components/BvhPlayer';
import { ChatView } from './components/chat/ChatView';
import { Gallery } from './components/chat/Gallery';
import { CostChart, TimeComparison, AccessPyramid } from './components/CostChart';

const API_BASE = 'https://backend-production-b095.up.railway.app';

type Page = { view: 'landing' } | { view: 'chat'; sessionId?: string } | { view: 'gallery' };

const LOGOS: { name: string; color: string; path: string }[] = [
  { name: "Claude Code", color: "#D97706", path: "M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" },
  { name: "Cursor", color: "#3B82F6", path: "M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" },
  { name: "Codex", color: "#181717", path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" },
  { name: "Copilot", color: "#000000", path: "M23.922 16.997C23.061 18.492 18.063 22.02 12 22.02 5.937 22.02.939 18.492.078 16.997A.641.641 0 0 1 0 16.741v-2.869a.883.883 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.098 10.098 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952C7.255 2.937 9.248 1.98 11.978 1.98c2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.841.841 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256Z" },
  { name: "OpenClaw", color: "#EF4444", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.68.78 4.95 2.05l-1.41 1.41A5.02 5.02 0 0 0 12 8c-2.76 0-5 2.24-5 5s2.24 5 5 5a4.98 4.98 0 0 0 3.54-1.46l1.41 1.41A6.98 6.98 0 0 1 12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8z" },
  { name: "Blender", color: "#E87D0D", path: "M12.51 13.214c.046-.8.438-1.506 1.03-2.006a3.424 3.424 0 0 1 2.212-.79c.85 0 1.631.3 2.211.79.592.5.983 1.206 1.028 2.005.045.823-.285 1.586-.865 2.153a3.389 3.389 0 0 1-2.374.938 3.393 3.393 0 0 1-2.376-.938c-.58-.567-.91-1.33-.865-2.152M7.35 14.831c.006.314.106.922.256 1.398a7.372 7.372 0 0 0 1.593 2.757 8.227 8.227 0 0 0 2.787 2.001 8.947 8.947 0 0 0 3.66.76 8.964 8.964 0 0 0 3.657-.772 8.285 8.285 0 0 0 2.785-2.01 7.428 7.428 0 0 0 1.592-2.762 6.964 6.964 0 0 0 .25-3.074 7.123 7.123 0 0 0-1.016-2.779 7.764 7.764 0 0 0-1.852-2.043h.002L13.566 2.55l-.02-.015c-.492-.378-1.319-.376-1.86.002-.547.382-.609 1.015-.123 1.415l-.001.001 3.126 2.543-9.53.01h-.013c-.788.001-1.545.518-1.695 1.172-.154.665.38 1.217 1.2 1.22V8.9l4.83-.01-8.62 6.617-.034.025c-.813.622-1.075 1.658-.563 2.313.52.667 1.625.668 2.447.004L7.414 14s-.069.52-.063.831z" },
  { name: "Unity", color: "#555555", path: "m12.9288 4.2939 3.7997 2.1929c.1366.077.1415.2905 0 .3675l-4.515 2.6076a.4192.4192 0 0 1-.4246 0L7.274 6.8543c-.139-.0745-.1415-.293 0-.3675l3.7972-2.193V0L1.3758 5.5977V16.793l3.7177-2.1456v-4.3858c-.0025-.1565.1813-.2682.318-.1838l4.5148 2.6076a.4252.4252 0 0 1 .2136.3676v5.2127c.0025.1565-.1813.2682-.3179.1838l-3.7996-2.1929-3.7178 2.1457L12 24l9.6954-5.5977-3.7178-2.1457-3.7996 2.1929c-.1341.082-.3229-.0248-.3179-.1838V13.053c0-.1565.087-.2956.2136-.3676l4.5149-2.6076c.134-.082.3228.0224.3179.1838v4.3858l3.7177 2.1456V5.5977L12.9288 0Z" },
  { name: "Unreal", color: "#0E1128", path: "M12 0a12 12 0 1012 12A12 12 0 0012 0zm0 23.52A11.52 11.52 0 1123.52 12 11.52 11.52 0 0112 23.52zm7.13-9.791c-.206.997-1.126 3.557-4.06 4.942l-1.179-1.325-1.988 2a7.338 7.338 0 01-5.804-2.978 2.859 2.859 0 00.65.123c.326.006.678-.114.678-.66v-5.394a.89.89 0 00-1.116-.89c-.92.212-1.656 2.509-1.656 2.509a7.304 7.304 0 012.528-5.597 7.408 7.408 0 013.73-1.721c-1.006.573-1.57 1.507-1.57 2.29 0 1.262.76 1.109.984.923v7.28a1.157 1.157 0 00.148.256 1.075 1.075 0 00.88.445c.76 0 1.747-.868 1.747-.868V9.172c0-.6-.452-1.324-.905-1.572 0 0 .838-.149 1.484.346a5.537 5.537 0 01.387-.425c1.508-1.48 2.929-1.902 4.112-2.112 0 0-2.151 1.69-2.151 3.96 0 1.687.043 5.801.043 5.801.799.771 1.986-.342 3.059-1.441Z" },
  { name: "Godot", color: "#478CBF", path: "M9.5598.683c-1.096.244-2.1812.5831-3.1983 1.0951.023.8981.081 1.7582.199 2.6323-.395.253-.81.47-1.178.766-.375.288-.7581.564-1.0971.9011-.6781-.448-1.3962-.869-2.1352-1.2411C1.3532 5.6934.608 6.6186 0 7.6546c.458.7411.936 1.4352 1.4521 2.0942h.014v6.3565c.012 0 .023 0 .035.003l3.8963.376c.204.02.364.184.378.3891l.12 1.7201 3.3994.242.234-1.587c.03-.206.207-.358.415-.358h4.1114c.208 0 .385.152.415.358l.234 1.587 3.3993-.242.12-1.72a.4196.4196 0 01.378-.3891l3.8954-.376c.012 0 .023-.003.035-.003v-.5071h.002V9.7498h.014c.516-.659.994-1.3531 1.4521-2.0942-.608-1.036-1.3541-1.9611-2.1512-2.8192-.739.372-1.4571.793-2.1352 1.2411-.339-.337-.721-.613-1.096-.901-.369-.296-.7841-.5131-1.1781-.7661.117-.8741.175-1.7342.199-2.6323-1.0171-.512-2.1012-.851-3.1983-1.095-.438.736-.838 1.533-1.1871 2.3121-.414-.069-.829-.094-1.2461-.099h-.016c-.417.005-.832.03-1.2461.099-.349-.779-.749-1.576-1.1881-2.3121z" },
  { name: "NVIDIA", color: "#76B900", path: "M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z" },
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
                    <svg className="land__trust-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d={logo.path} />
                    </svg>
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

      {/* ── Why It Matters ── */}
      <section className="land__section">
        <div className="land__section-header">
          <span className="land__label">The Problem</span>
          <h2>Animation is the bottleneck</h2>
          <p className="land__section-sub">
            Most indie devs make 2D games — not because they want to, but because
            3D animation is too expensive. We change that.
          </p>
        </div>
        <CostChart />
      </section>

      <section className="land__section">
        <div className="land__section-header">
          <span className="land__label">Speed</span>
          <h2>Weeks to seconds</h2>
        </div>
        <TimeComparison />
      </section>

      <section className="land__section">
        <div className="land__section-header">
          <span className="land__label">Access</span>
          <h2>Animation for everyone</h2>
          <p className="land__section-sub">
            55% of indie devs are solo. 50% are self-funded. They can't afford
            $2,500/day studios. Now they don't have to.
          </p>
        </div>
        <AccessPyramid />
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

      {/* ── Manifesto ── */}
      <section className="land__manifesto">
        <p className="land__manifesto-text">
          AI coding agents proved the model: give AI a hard problem, it solves it 100x faster.
          But most AI products are chatbots and text generators.
        </p>
        <p className="land__manifesto-text">
          The real opportunity is <strong>compound creative problems</strong> — like 3D game production.
          Animation, rigging, modeling, music — each one is a months-long bottleneck.
        </p>
        <p className="land__manifesto-bold">
          We don't wait for AI to be perfect. We take what exists today and deliver it to
          people who need it. Most indie devs make 2D games — not by choice, but because
          3D is too hard. We're here to change that.
        </p>
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
