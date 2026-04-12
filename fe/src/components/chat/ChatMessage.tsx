interface Props {
  role: 'user' | 'assistant';
  content: string;
  children?: React.ReactNode;
}

export function ChatMessage({ role, content, children }: Props) {
  return (
    <div className={`chat-message chat-message--${role}`}>
      <div className="chat-message__bubble">
        <div className="chat-message__text">{content}</div>
        {children}
      </div>
    </div>
  );
}
