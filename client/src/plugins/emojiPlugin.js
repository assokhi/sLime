/**
 * Emoji Reaction Plugin
 * Sends/receives emoji reactions over RTCDataChannel via EventBus.
 */
const emojiPlugin = {
  name: 'emojiReaction',

  init(eventBus) {
    this._eventBus = eventBus;

    this._unsubs = [
      // UI triggers a reaction
      eventBus.on('emoji:send', ({ emoji, senderName }) => {
        const msg = {
          type: 'emoji',
          emoji,
          senderName,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        };
        eventBus.emit('datachannel:send', msg);
        // Show locally too
        eventBus.emit('emoji:received', { ...msg, isLocal: true });
      }),

      // Incoming datachannel messages — filter for emoji type
      eventBus.on('datachannel:message', (data) => {
        if (data.type === 'emoji') {
          eventBus.emit('emoji:received', {
            emoji: data.emoji,
            senderName: data.senderName,
            id: data.id,
            from: data.from,
            isLocal: false
          });
        }
      })
    ];
  },

  destroy() {
    this._unsubs?.forEach((u) => u());
    this._unsubs = null;
  }
};

export default emojiPlugin;
