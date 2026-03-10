/**
 * ScreenShare Plugin
 * Enables screen sharing via getDisplayMedia.
 * Communicates through EventBus only.
 */
const screenSharePlugin = {
  name: 'screenShare',

  init(eventBus) {
    // All logic lives in WebRTCManager.
    // This plugin simply provides the UI ↔ EventBus bridge.
    this._unsubs = [
      eventBus.on('screenshare:started', () => {
        // Notify peers via datachannel that we started sharing
        eventBus.emit('datachannel:send', {
          type: 'screenshare',
          action: 'started'
        });
      }),
      eventBus.on('screenshare:stopped', () => {
        eventBus.emit('datachannel:send', {
          type: 'screenshare',
          action: 'stopped'
        });
      })
    ];
  },

  destroy() {
    this._unsubs?.forEach((u) => u());
    this._unsubs = null;
  }
};

export default screenSharePlugin;
