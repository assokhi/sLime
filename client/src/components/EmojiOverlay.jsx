import '../styles/EmojiOverlay.css';

export default function EmojiOverlay({ reactions }) {
  return (
    <div className="emoji-overlay">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="emoji-float"
          style={{ left: `${20 + Math.random() * 60}%` }}
        >
          <span className="emoji-char">{r.emoji}</span>
          <span className="emoji-name">{r.isLocal ? 'You' : r.senderName}</span>
        </div>
      ))}
    </div>
  );
}
