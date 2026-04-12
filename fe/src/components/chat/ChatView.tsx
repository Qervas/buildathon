import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { AnimationCard } from './AnimationCard';
import { streamChat, type ChatMessage as ChatMsg } from '../../services/groq';
import { generateText2Motion } from '../../services/api';

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  jobId?: string;
}

let msgCounter = 0;
function nextId() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

function parseGenerateBlock(text: string): { action: string; prompt?: string; duration?: number; video?: boolean } | null {
  const match = text.match(/```generate\s*\n([\s\S]*?)\n```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function ChatView() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  const handleGenerate = useCallback(async (parsed: { action: string; prompt?: string; duration?: number }) => {
    if (parsed.action === 'text2motion' && parsed.prompt) {
      try {
        const { job_id } = await generateText2Motion(parsed.prompt, parsed.duration || 3);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, jobId: job_id }];
          }
          return prev;
        });
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: 'assistant', content: `Failed to start generation: ${err}` },
        ]);
      }
    }
  }, []);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: UIMessage = { id: nextId(), role: 'user', content: text };
    const assistantMsg: UIMessage = { id: nextId(), role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const newHistory: ChatMsg[] = [...history, { role: 'user', content: text }];
    setHistory(newHistory);
    setStreaming(true);

    const abort = new AbortController();
    abortRef.current = abort;

    let fullText = '';

    try {
      await streamChat(
        newHistory,
        (chunk) => {
          fullText += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullText };
            return updated;
          });
        },
        () => {
          setStreaming(false);
          setHistory((prev) => [...prev, { role: 'assistant', content: fullText }]);

          const parsed = parseGenerateBlock(fullText);
          if (parsed) {
            handleGenerate(parsed);
          }
        },
        abort.signal,
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: fullText + `\n\n*Error: ${err}*`,
          };
          return updated;
        });
      }
      setStreaming(false);
    }
  }, [history, handleGenerate]);

  const handleFileSelect = useCallback((_file: File) => {
    handleSend('I want to extract motion capture from this video.');
  }, [handleSend]);

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
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} role={msg.role} content={msg.content}>
            {msg.jobId && <AnimationCard jobId={msg.jobId} />}
          </ChatMessage>
        ))}
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
