import { useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

interface Props {
  onSend: (text: string) => void;
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onFileSelect, disabled, placeholder }: Props) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="chat-input-row">
        {onFileSelect && (
          <>
            <button
              type="button"
              className="chat-upload-btn"
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
              title="Upload video for motion capture"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileSelect(file);
                e.target.value = '';
              }}
            />
          </>
        )}
        <textarea
          className="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Describe a motion...'}
          disabled={disabled}
          rows={1}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!text.trim() || disabled}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </form>
  );
}
