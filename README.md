<p align="center">
  <img src="assets/logo.png" width="120" alt="sLime Logo">
</p>

<h1 align="center">sLime</h1>

<p align="center">
  <b>The Lightweight, Open-Source Alternative for Direct Video Meetings.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-local--only-blue">
  <img src="https://img.shields.io/badge/stack-Tauri%20%7C%20Rust%20%7C%20React-orange">
  <img src="https://img.shields.io/badge/license-Apache--2.0-green">
</p>

---

## 🚀 Why sLime?

Most video tools today are over-engineered or locked behind corporate clouds. **sLime** (Scalable Live Interaction Media) is a developer-centric, open-source project aimed at providing a high-performance, "slime-smooth" video experience that runs entirely on your machine.

No accounts, no trackers—just pure peer-to-peer (P2P) communication.

## ✨ Features

* **Zero-Cloud Architecture:** Runs locally on your laptop.
* **Minimal Footprint:** Built with Tauri to keep resource usage low, so your laptop fan doesn't scream during meetings.
* **Side-by-Side Chat:** Integrated real-time messaging that doesn't obstruct the video feed.
* **Direct Connect:** Uses WebRTC for the lowest possible latency between two points.

## 🛠 Tech Stack (Draft)

* **Core:** Rust (for high-speed signaling and future AI modules)
* **Frontend:** React.js & Tailwind CSS
* **Desktop Wrapper:** Tauri (Native OS Webview)
* **P2P Protocol:** WebRTC / PeerJS

## 📦 Installation (Local Use)

Since sLime is designed to be lightweight, you can set it up in seconds:

```bash
# Clone the repository
git clone [https://github.com/Arvinder-Arvi/sLime.git](https://github.com/Arvinder-Arvi/sLime.git)

# Enter the directory
cd sLime

# Install dependencies (requires Node.js and Rust installed)
npm install

# Run the app locally
npm run tauri dev
