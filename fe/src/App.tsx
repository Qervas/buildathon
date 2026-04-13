import { useCallback, useState } from 'react';
import { BvhPlayer } from './components/BvhPlayer';
import { ChatView } from './components/chat/ChatView';
import { Gallery } from './components/chat/Gallery';

const API_BASE = 'https://backend-production-b095.up.railway.app';

type Page = { view: 'landing' } | { view: 'chat'; sessionId?: string } | { view: 'gallery' };

const LOGOS: { name: string; color: string; path: string }[] = [
  { name: "Claude Code", color: "#d97706", path: "M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" },
  { name: "NVIDIA Kimodo", color: "#76b900", path: "M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z" },
  { name: "Cursor", color: "#3b82f6", path: "M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" },
  { name: "Blender", color: "#E87D0D", path: "M12.51 13.214c.046-.8.438-1.506 1.03-2.006a3.424 3.424 0 0 1 2.212-.79c.85 0 1.631.3 2.211.79.592.5.983 1.206 1.028 2.005.045.823-.285 1.586-.865 2.153a3.389 3.389 0 0 1-2.374.938 3.393 3.393 0 0 1-2.376-.938c-.58-.567-.91-1.33-.865-2.152M7.35 14.831c.006.314.106.922.256 1.398a7.372 7.372 0 0 0 1.593 2.757 8.227 8.227 0 0 0 2.787 2.001 8.947 8.947 0 0 0 3.66.76 8.964 8.964 0 0 0 3.657-.772 8.285 8.285 0 0 0 2.785-2.01 7.428 7.428 0 0 0 1.592-2.762 6.964 6.964 0 0 0 .25-3.074 7.123 7.123 0 0 0-1.016-2.779 7.764 7.764 0 0 0-1.852-2.043h.002L13.566 2.55l-.02-.015c-.492-.378-1.319-.376-1.86.002-.547.382-.609 1.015-.123 1.415l-.001.001 3.126 2.543-9.53.01h-.013c-.788.001-1.545.518-1.695 1.172-.154.665.38 1.217 1.2 1.22V8.9l4.83-.01-8.62 6.617-.034.025c-.813.622-1.075 1.658-.563 2.313.52.667 1.625.668 2.447.004L7.414 14s-.069.52-.063.831z" },
  { name: "Cloudflare", color: "#F38020", path: "M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.6045-.499-1.0615-.5205l-8.6592-.1123a.1559.1559 0 0 1-.1333-.0713c-.0283-.042-.0351-.0986-.021-.1553.0278-.084.1123-.1484.2036-.1562l8.7359-.1123c1.0351-.0489 2.1601-.8868 2.5537-1.9136l.499-1.3013c.0215-.0561.0293-.1128.0147-.168-.5625-2.5463-2.835-4.4453-5.5499-4.4453-2.5039 0-4.6284 1.6177-5.3876 3.8614-.4927-.3658-1.1187-.5625-1.794-.499-1.2026.119-2.1665 1.083-2.2861 2.2856-.0283.31-.0069.6128.0635.894C1.5683 13.171 0 14.7754 0 16.752c0 .1748.0142.3515.0352.5273.0141.083.0844.1475.1689.1475h15.9814c.0909 0 .1758-.0645.2032-.1553l.12-.4268zm2.7568-5.5634c-.0771 0-.1611 0-.2383.0112-.0566 0-.1054.0415-.127.0976l-.3378 1.1744c-.1475.5068-.0918.9707.1543 1.3164.2256.3164.6055.498 1.0625.5195l1.8437.1133c.0557 0 .1055.0263.1329.0703.0283.043.0351.1074.0214.1562-.0283.084-.1132.1485-.204.1553l-1.921.1123c-1.041.0488-2.1582.8867-2.5527 1.914l-.1406.3585c-.0283.0713.0215.1416.0986.1416h6.5977c.0771 0 .1474-.0489.169-.126.1122-.4082.1757-.837.1757-1.2803 0-2.6025-2.125-4.727-4.7344-4.727" },
  { name: "Modal", color: "#7FEE64", path: "M4.89 5.57 0 14.002l2.521 4.4h5.05l4.396-7.718 4.512 7.709 4.996.037L24 14.057l-4.857-8.452-5.073-.015-2.076 3.598L9.94 5.57Zm.837.729h3.787l1.845 3.252H7.572Zm9.189.021 3.803.012 4.228 7.355-3.736-.027zm-9.82.346L6.94 9.914l-4.209 7.389-1.892-3.3Zm9.187.014 4.297 7.343-1.892 3.282-4.3-7.344zm-6.713 3.6h3.79l-4.212 7.394H3.361Zm11.64 4.109 3.74.027-1.893 3.281-3.74-.027z" },
  { name: "Meta Llama", color: "#0467DF", path: "M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303z" },
  { name: "Gemini", color: "#8E75B2", path: "M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" },
  { name: "LangChain", color: "#7FC8FF", path: "M7.53 15.975a7.53 7.53 0 0 0 2.206-5.325A7.54 7.54 0 0 0 7.53 5.325L2.205 0A7.54 7.54 0 0 0 0 5.325a7.54 7.54 0 0 0 2.205 5.325zm11.144.493a7.54 7.54 0 0 0-5.325-2.206 7.54 7.54 0 0 0-5.325 2.206l5.325 5.325a7.54 7.54 0 0 0 5.325 2.205A7.54 7.54 0 0 0 24 21.793zM2.219 21.78a7.54 7.54 0 0 0 5.325 2.205v-7.53H.014a7.54 7.54 0 0 0 2.205 5.325M20.73 8.595a7.53 7.53 0 0 0-5.327-2.206 7.53 7.53 0 0 0-5.325 2.207l5.325 5.325z" },
  { name: "Railway", color: "#0B0D0E", path: "M.113 10.27A13.026 13.026 0 000 11.48h18.23c-.064-.125-.15-.237-.235-.347-3.117-4.027-4.793-3.677-7.19-3.78-.8-.034-1.34-.048-4.524-.048-1.704 0-3.555.005-5.358.01-.234.63-.459 1.24-.567 1.737h9.342v1.216H.113v.002zm18.26 2.426H.009c.02.326.05.645.094.961h16.955c.754 0 1.179-.429 1.315-.96z" },
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
