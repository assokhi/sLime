/**
 * TextChat Plugin
 * Sends/receives chat messages over RTCDataChannel via EventBus.
 */
const chatPlugin = {
  name: 'textChat',

  init(eventBus) {
    this._eventBus = eventBus;

    this._unsubs = [
      // UI wants to send a message
      eventBus.on('chat:send', ({ text, senderName }) => {
        const msg = {
          type: 'chat',
          text,
          senderName,
          timestamp: Date.now()
        };
        // Send to peers
        eventBus.emit('datachannel:send', msg);
        // Also add to local chat history
        eventBus.emit('chat:received', { ...msg, isLocal: true });
      }),

      // Incoming datachannel messages — filter for chat type
      eventBus.on('datachannel:message', (data) => {
        if (data.type === 'chat') {
          eventBus.emit('chat:received', {
            text: data.text,
            senderName: data.senderName,
            timestamp: data.timestamp,
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

export default chatPlugin;
