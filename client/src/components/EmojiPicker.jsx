import { useState } from 'react';
import { Smile } from 'lucide-react';
import '../styles/EmojiPicker.css';

const EMOJI_LIST = ['👍', '👏', '😂', '❤️', '🎉', '🔥', '😮', '🙌'];

export default function EmojiPicker({ onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  function handleSelect(emoji) {
    onSelect(emoji);
    setIsOpen(false);
  }

  return (
    <div className="emoji-picker-wrapper">
      {isOpen && (
        <div className="emoji-picker-popup">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              className="emoji-option"
              onClick={() => handleSelect(emoji)}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <button
        className="ctrl-btn emoji-trigger"
        onClick={() => setIsOpen((o) => !o)}
        title="Send a reaction"
      >
        <Smile size={20} />
      </button>
    </div>
  );
}
