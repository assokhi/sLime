<table width="100%" style="border: none; border-collapse: collapse; background: transparent;">
  <tr style="border: none;">
    <td align="left" width="160" style="border: none; padding: 0;">
      <img src="assets/logo.png" width="150" alt="sLime Logo">
    </td>
    <td align="center" style="border: none; padding: 0;">
      <h1 align="center" style="border: none; margin-bottom: 0; font-size: 2.5rem;">sLime</h1>
      <p align="center" style="margin-top: 5px;"><strong>Scalable Live Interaction Media</strong></p>
      <p align="center">
        <img src="https://img.shields.io/badge/Engine-Rust%20%7C%20Tauri-3b82f6?style=for-the-badge">
        <img src="https://img.shields.io/badge/Protocol-WebRTC-f97316?style=for-the-badge">
        <img src="https://img.shields.io/badge/License-Apache--2.0-22c55e?style=for-the-badge">
      </p>
    </td>
    <td width="160" style="border: none; padding: 0;"></td>
  </tr>
</table>

### Overview
**sLime** is a high-performance, peer-to-peer video communication engine designed to eliminate the overhead of centralized signaling and cloud-dependent media servers. Built with a systems-first approach, it prioritizes local resource efficiency and end-to-end privacy.

### Core Technical Pillars
* **Decentralized Architecture:** Pure P2P topology using WebRTC to minimize hop-count and latency.
* **Memory Safety:** Built with **Rust** to ensure thread safety and high-speed signaling without the GC overhead of traditional runtimes.
* **Native Performance:** Utilizes **Tauri** for a sub-20MB binary footprint, bypassing the bloat of standard Electron-based solutions.
* **Side-by-Side Context:** Non-blocking chat interface optimized for multi-threaded media streams.

### Technical Stack
| Layer | Implementation | Rationale |
| :--- | :--- | :--- |
| **Runtime** | Rust / Tauri | Low-level hardware access & minimal memory overhead. |
| **Frontend** | React / Tailwind | Component-driven UI with utility-first styling. |
| **Networking** | WebRTC / PeerJS | Direct UDP-based media streaming. |
| **State** | Redis (Local) | Fast, in-memory session persistence. |

### Installation & Deployment
Ensure you have the [Rust toolchain](https://www.rust-lang.org/tools/install) and Node.js installed.

```bash
git clone [https://github.com/assokhi/sLime.git](https://github.com/assokhi/sLime.git)
cd sLime
npm install
npm run tauri dev