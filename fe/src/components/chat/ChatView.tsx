import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { AnimationCard } from './AnimationCard';
import { streamChat, type ChatMessage as ChatMsg } from '../../services/groq';
import { generateText2Motion, createSession, saveMessage, getSessionDetail } from '../../services/api';

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  jobId?: string;
  generating?: boolean;
}

interface Props {
  initialSessionId?: string;
  onSessionReady?: (sessionId: string) => void;
}

let msgCounter = 0;
function nextId() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

function parseGenerateBlock(text: string): { action: string; prompt?: string; duration?: number } | null {
  const match = text.match(/```generate\s*\n([\s\S]*?)\n```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function stripGenerateBlock(text: string): string {
  return text.replace(/```generate\s*\n[\s\S]*?\n```/g, '').trim();
}

export function ChatView({ initialSessionId, onSessionReady }: Props) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [loading, setLoading] = useState(!!initialSessionId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const generatedRef = useRef<Set<string>>(new Set());

  // Load existing session or create new one
  useEffect(() => {
    if (initialSessionId) {
      getSessionDetail(initialSessionId)
        .then((session) => {
          const uiMsgs: UIMessage[] = [];
          const hist: ChatMsg[] = [];

          for (const msg of session.messages) {
            const id = nextId();
            const uiMsg: UIMessage = {
              id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            };
            if (msg.job_id && msg.job) {
              uiMsg.jobId = msg.job.id;
            }
            uiMsgs.push(uiMsg);
            hist.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
          }

          setMessages(uiMsgs);
          setHistory(hist);
          setSessionId(initialSessionId);
          setLoading(false);
        })
        .catch(() => {
          // Session not found — create new
          createSession().then((s) => {
            setSessionId(s.id);
            onSessionReady?.(s.id);
            setLoading(false);
          });
        });
    } else {
      createSession()
        .then((s) => {
          setSessionId(s.id);
          onSessionReady?.(s.id);
        })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  const triggerGeneration = useCallback(async (msgId: string, parsed: { action: string; prompt?: string; duration?: number }) => {
    if (generatedRef.current.has(msgId)) return;
    generatedRef.current.add(msgId);

    if (parsed.action === 'text2motion' && parsed.prompt) {
      setMessages((prev) => prev.map((m) =>
        m.id === msgId ? { ...m, generating: true } : m
      ));

      try {
        const { job_id } = await generateText2Motion(parsed.prompt, parsed.duration || 3);
        setMessages((prev) => prev.map((m) =>
          m.id === msgId ? { ...m, jobId: job_id, generating: false } : m
        ));
        if (sessionId) {
          saveMessage(sessionId, 'assistant', `[Generated: ${parsed.prompt}]`, job_id).catch(() => {});
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: 'assistant', content: `Failed to start generation: ${err}` },
        ]);
      }
    }
  }, [sessionId]);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: UIMessage = { id: nextId(), role: 'user', content: text };
    const assistantId = nextId();
    const assistantMsg: UIMessage = { id: assistantId, role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    if (sessionId) {
      saveMessage(sessionId, 'user', text).catch(() => {});
    }

    const newHistory: ChatMsg[] = [...history, { role: 'user', content: text }];
    setHistory(newHistory);
    setStreaming(true);

    let fullText = '';

    try {
      await streamChat(
        newHistory,
        (chunk) => {
          fullText += chunk;
          const display = stripGenerateBlock(fullText);
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.findIndex((m) => m.id === assistantId);
            if (lastIdx >= 0) {
              updated[lastIdx] = { ...updated[lastIdx], content: display };
            }
            return updated;
          });
        },
        () => {
          setStreaming(false);
          setHistory((prev) => [...prev, { role: 'assistant', content: fullText }]);

          const display = stripGenerateBlock(fullText);
          setMessages((prev) => prev.map((m) =>
            m.id === assistantId ? { ...m, content: display } : m
          ));

          if (sessionId) {
            saveMessage(sessionId, 'assistant', display).catch(() => {});
          }

          const parsed = parseGenerateBlock(fullText);
          if (parsed) {
            triggerGeneration(assistantId, parsed);
          }
        },
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const display = stripGenerateBlock(fullText);
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: display + `\n\nConnection error. Please try again.` }
            : m
        ));
      }
      setStreaming(false);
    }
  }, [history, triggerGeneration, sessionId]);

  const handleFileSelect = useCallback((_file: File) => {
    handleSend('I want to extract motion capture from this video.');
  }, [handleSend]);

  if (loading) {
    return (
      <div className="chat-view">
        <div className="chat-messages">
          <div className="chat-empty">
            <div className="anim-card__spinner" />
            <p className="lede">Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="eyebrow">Motion Studio</p>
            <h2>Describe a motion to generate.</h2>
            <p className="lede">
              Try: "a person doing a victory dance" or "someone throwing a punch"
            </p>
            <div className="chat-suggestions">
              <button className="chat-suggestion" onClick={() => handleSend('A person doing a victory dance')}>
                Victory dance
              </button>
              <button className="chat-suggestion" onClick={() => handleSend('Someone walking forward confidently')}>
                Confident walk
              </button>
              <button className="chat-suggestion" onClick={() => handleSend('A character throwing a punch')}>
                Throwing a punch
              </button>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} role={msg.role} content={msg.content}>
            {msg.generating && (
              <div className="anim-card anim-card--loading">
                <div className="anim-card__spinner" />
                <span>Starting animation generation...</span>
              </div>
            )}
            {msg.jobId && <AnimationCard jobId={msg.jobId} />}
          </ChatMessage>
        ))}
        {streaming && (
          <div className="chat-typing">
            <span className="chat-typing__dot" />
            <span className="chat-typing__dot" />
            <span className="chat-typing__dot" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput
        onSend={handleSend}
        onFileSelect={handleFileSelect}
        disabled={streaming}
        placeholder="Describe a motion to generate..."
      />
    </div>
  );
}
