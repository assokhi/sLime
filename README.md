<p align="center">
  <img src="assets/slime meet.png" width="300" alt="sLime Logo">
</p>

<h1 align="center">sLime</h1>
<p align="center"><strong>Scalable Live Interaction Media</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/Engine-Rust%20%7C%20Tauri-3b82f6?style=plastic&logo=rust&logoColor=white">
  <img src="https://img.shields.io/badge/Protocol-WebRTC-f97316?style=plastic&logo=webrtc&logoColor=white">
  <img src="https://img.shields.io/badge/License-Apache--2.0-22c55e?style=plastic">
</p>

---

### Architectural Overview
**sLime** is a decentralized, peer-to-peer video communication engine engineered for high-performance systems. By leveraging the **Rust** ecosystem and the **WebRTC** protocol, sLime provides a native-speed interaction layer that operates independently of centralized cloud infrastructure.

### Key Specifications
* **Memory Safety:** Developed with Rust to ensure deterministic performance and thread-safe signaling.
* **Minimal Runtime:** Native OS Webview integration via Tauri, resulting in a sub-20MB binary footprint.
* **Low-Latency Pipeline:** Direct UDP-based media streaming for real-time synchronization.
* **Privacy-First:** Local-only signaling to eliminate third-party data interception.

### Development Environment
Ensure your environment is configured with the [Rust toolchain](https://www.rust-lang.org/tools/install).

```bash
# Clone the repository
git clone [https://github.com/assokhi/sLime.git](https://github.com/assokhi/sLime.git)

# Install dependencies and launch in dev mode
cd sLime && npm install && npm run tauri dev