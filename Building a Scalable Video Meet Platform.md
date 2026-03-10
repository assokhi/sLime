# **Architectural Blueprint and Execution Plan for a Cloud-Native, High-Performance Video Conferencing and Webinar Platform**

## **Executive Summary and Architectural Paradigm Shift**

The demand for frictionless, high-fidelity real-time communication systems has accelerated the evolution of video conferencing architectures. The initial proposition involves leveraging an engine analogous to sLime—a decentralized, peer-to-peer (P2P) communication layer engineered with the Rust ecosystem and deployed via Tauri for native operating system integration. While such an architecture provides deterministic performance, thread-safe signaling, and a minimal binary footprint, it inherently introduces friction for end-users. A decentralized model requires participants to download and install a native application to join a session, which severely limits accessibility for external guests, clients, and webinar attendees. Furthermore, strict peer-to-peer topologies face insurmountable mathematical and physical limitations when scaling to accommodate webinars and large virtual rooms.

To achieve the objective of seamless, zero-install browser access combined with the ability to host thousands of concurrent participants without lag, the architectural paradigm must shift from a native, decentralized mesh network to a cloud-hosted, centralized media routing infrastructure. This transition necessitates the implementation of a Selective Forwarding Unit (SFU) accessible directly through standard web browsers utilizing the WebRTC protocol, supplemented by next-generation transport layers such as WebTransport. By migrating the core processing capabilities from the client device to highly optimized, auto-scaling cloud clusters written in high-performance languages like Rust and Go, the platform can guarantee low latency, robust administrative controls, and massive scalability. The subsequent analysis delineates the optimal network topologies, media engine selections, feature implementation mechanics, global deployment strategies, and a comprehensive execution plan required to construct this enterprise-grade platform.

## **The Mathematical Limits of P2P and the Necessity of Network Topology Evolution**

The fundamental bottleneck in any real-time video platform is the distribution of media streams across the network. The selection of the underlying network topology dictates the platform's scalability, server infrastructure costs, and end-user bandwidth consumption. The three primary topologies in the WebRTC ecosystem are Mesh, Multipoint Control Unit (MCU), and Selective Forwarding Unit (SFU).1

### **The Degradation of Peer-to-Peer Mesh Networks at Scale**

In a pure Mesh topology, every participant establishes a direct peer-to-peer connection with every other participant in the room. If an application is built on a pure P2P engine, the client device is responsible for encoding and transmitting its media stream multiple times, as well as decoding multiple incoming streams.1 The bandwidth consumption in a Mesh network scales linearly for each participant; a user in a room with ![][image1] participants must upload their stream ![][image2] times and download ![][image2] streams.2

For example, in a call with four participants streaming at 1 Mbps, each user requires 3 Mbps of sustained upload and download bandwidth.2 If a webinar were to attempt a mesh topology with 100 users, each user would require 99 Mbps of sustained upload bandwidth, which exceeds the physical capabilities of most consumer internet connections. Beyond four to six participants, the upload cost on the user side explodes, leading to severe packet loss, latency spikes, and visual degradation. Empirical data indicates that Mesh networks degrade video quality by 40% beyond four participants, and poor topology selection drains mobile battery life three times faster due to the aggressive CPU encoding requirements.1 Consequently, a P2P Mesh architecture is mathematically incapable of supporting webinars or large collaborative rooms.

### **Multipoint Control Unit (MCU) Architecture**

An MCU architecture attempts to solve the bandwidth problem by introducing a centralized server that receives the media streams from all participants. However, instead of simply routing the streams, the MCU actively decodes, mixes, and re-encodes the various audio and video feeds into a single, composite media stream that is sent back to each client.1

The primary advantage of an MCU is that it minimizes client-side bandwidth and processing requirements, as the client only needs to download and decode a single stream regardless of how many people are in the meeting.1 This is highly beneficial for extremely bandwidth-constrained devices or legacy hardware.2 However, the centralized mixing process introduces significant latency due to the intensive decoding and re-encoding cycles, which destroys the real-time, conversational feel of the meeting.3 Furthermore, the server infrastructure required to operate an MCU is prohibitively expensive. CPU-intensive video transcoding means that MCU deployments cost between 10 to 50 times more than routing-based alternatives for equivalent participant loads.2 It also restricts user interface flexibility, as the client receives a pre-mixed video feed ("what you see is what you get") and cannot dynamically pin or resize individual speaker feeds.1

### **The Selective Forwarding Unit (SFU) Paradigm**

The optimal topology for scalable, low-latency video platforms is the Selective Forwarding Unit (SFU). An SFU operates as an intelligent media router. Each participant uploads their encrypted media stream to the centralized SFU exactly once.4 The server then forwards that stream—without applying expensive decoding or re-encoding processes—to all other participants who request it.1

This architecture drastically reduces the upload bandwidth required by the client, as the uplink remains constant at one copy per sender.2 While the client must still download and decode multiple streams, modern hardware and web browsers are highly optimized for decoding multiple video tracks simultaneously. Because the server does not transcode the media, the latency introduced by an SFU is negligible, avoiding the mixing delay of MCUs and resulting in the snappiest real-time experience.3 Furthermore, an SFU allows for flexible user interfaces, as the client receives distinct video tracks and can choose which streams to render, pin, or hide on the fly.1

| Topology Feature | Peer-to-Peer (Mesh) | Multipoint Control Unit (MCU) | Selective Forwarding Unit (SFU) |
| :---- | :---- | :---- | :---- |
| **Server Cost** | Zero (Client-hosted) | Highest (Heavy CPU transcoding) | Moderate (Bandwidth/Routing focused) |
| **Client Upload** | High (![][image2] streams) | Lowest (1 stream) | Lowest (1 stream) |
| **Client Download** | High (![][image2] streams) | Lowest (1 composite stream) | High (![][image2] streams) |
| **Latency** | Lowest (Direct routing) | High (Processing delay) | Low (Minimal server processing) |
| **UI Flexibility** | High (Discrete streams) | Low (Pre-mixed composite) | High (Discrete streams) |
| **Maximum Scale** | \~4 to 6 users | Hundreds (Cost prohibitive) | Thousands (Highly scalable) |

To support large-scale webinars and expansive meeting rooms efficiently, the platform must utilize an SFU architecture. This approach balances server costs with client performance while enabling the system to scale horizontally to thousands of concurrent users.2

## **Core Engine Selection: The Go and Rust Ecosystems**

The implementation of a high-performance SFU requires an underlying technology stack capable of handling massive concurrent I/O operations with minimal memory overhead. The two dominant languages for modern media server development are Go and Rust, owing to their deterministic performance, strict memory safety, and highly efficient concurrency models.7

### **Go-Based Infrastructure: The LiveKit and Pion Ecosystem**

The Go programming language has established a massive footprint in the WebRTC ecosystem, primarily driven by the open-source Pion project—a pure Go implementation of the WebRTC API.9 Frameworks like LiveKit are built entirely on Go and Pion, offering a highly modular, horizontally scalable SFU architecture out of the box.10

LiveKit abstracts the immense complexity of WebRTC behind comprehensive SDKs for both the frontend and backend, making it highly advantageous for rapid deployment and time-to-market.12 LiveKit nodes route media via Redis, ensuring that clients joining a specific room seamlessly connect to the correct media node in a distributed cluster, allowing for horizontal scalability across multiple servers.10

However, while Go is highly performant and its goroutine concurrency model is elegant, the language relies on garbage collection. In ultra-low-latency environments processing hundreds of thousands of video packets per second, garbage collection pauses—even microsecond-level pauses—can introduce jitter.14 Benchmarks suggest that while Go-based SFUs like Pion scale adequately, they may hit resource ceilings earlier than memory-managed languages in extreme high-density room scenarios.16 Despite this, Pion's memory management has been heavily optimized, with benchmarks showing it utilizing a reasonable 41 MB of memory for sustained data channel throughput, proving it is a highly capable engine.7

### **Rust-Based Infrastructure: Mediasoup and Native Implementations**

Rust offers a compelling alternative to Go for media infrastructure due to its absolute memory safety, zero-cost abstractions, and lack of a garbage collector, which ensures perfectly deterministic latency.17 Implementations leveraging Rust, such as videocall.rs or the pure Rust WebRTC bindings (webrtc-rs), demonstrate exceptional efficiency.7 Recent benchmarks comparing pure Rust WebRTC data channel implementations against Go's Pion reveal that Rust solutions consume significantly less memory (often utilizing merely 10 MB compared to Pion's 41 MB under similar load) while maintaining superior throughput.7

For enterprise-scale video routing, Mediasoup presents an unparalleled architectural advantage. Mediasoup is engineered as an ultra-high-performance WebRTC SFU written as a low-level C++ and Rust core, which is then exposed via developer-friendly Node.js or Rust APIs.11 By running the heavy media routing layer as a compiled worker process, Mediasoup achieves maximum hardware utilization.

Performance comparisons indicate that for massive multi-room deployments, Mediasoup significantly outperforms pure Go implementations. In load tests, Mediasoup has been shown to almost double the total number of participants and tracks that can fit onto a single server instance compared to Pion-based architectures.16 While LiveKit provides a more complete "out-of-the-box" solution with pre-built UI components and signaling, Mediasoup requires developers to build their own signaling and state management layers.12 However, for a platform demanding the lowest possible lag, the ability to scale to 1000+ users seamlessly, and absolute control over the infrastructure, adopting a Rust-optimized SFU core like Mediasoup provides the highest performance ceiling.12

| Framework | Core Language | Architecture Type | Strengths | Weaknesses |
| :---- | :---- | :---- | :---- | :---- |
| **LiveKit** | Go (Pion) | Full-stack SFU & Signaling | Rapid deployment, excellent SDKs, built-in Redis scaling. | Garbage collection jitter, higher memory footprint than Rust. |
| **Mediasoup** | C++ / Rust | Bare-metal SFU Engine | Unmatched track density, highest performance, zero-cost abstractions. | Requires custom signaling server, steeper learning curve. |
| **videocall.rs** | Rust | WebTransport / WebRTC | Ultra-low latency (\<100ms), natively supports HTTP/3 QUIC. | Still in Beta, smaller community compared to LiveKit/Mediasoup. |

## **Next-Generation Transport Protocols and Network Traversal**

To facilitate seamless, zero-download access, the platform must rely on standard web APIs, predominantly WebRTC. However, the transport layer itself is undergoing a generational shift that the architecture must embrace to guarantee low latency and reliability across volatile networks.

### **WebRTC, NAT Traversal, and TURN Servers**

WebRTC utilizes the User Datagram Protocol (UDP) to transmit real-time media, intentionally bypassing the head-of-line blocking issues inherent in TCP-based protocols.1 Because end-users are frequently situated behind strict corporate firewalls and Network Address Translation (NAT) devices, the architecture must include Session Traversal Utilities for NAT (STUN) and Traversal Using Relays around NAT (TURN) servers.23

The signaling process begins with Interactive Connectivity Establishment (ICE), where the client attempts to discover its public IP address and port mapping via a STUN server.23 STUN communication operates over UDP port 3478, generating almost zero server load as it merely acts as a mirror returning the client's external IP.25 However, if direct UDP communication fails due to symmetric NATs or restrictive firewalls, the connection falls back to a TURN server, which acts as an active relay for the encrypted media packets.25

To support enterprise clients, TURN servers (such as the open-source Coturn project) must be deployed alongside the SFU. When deploying Coturn within a Kubernetes cluster (e.g., AWS EKS or GCP GKE), it is vital to configure the deployment with hostNetwork: true. This allows the TURN server pods to bind directly to the public IP addresses of the underlying Kubernetes nodes, bypassing the internal pod network and ensuring frictionless UDP failover and optimal hairpin routing.26

### **The WebTransport Alternative**

While WebRTC is the current industry standard, the architecture should be designed to support WebTransport for future-proofing and extreme low-latency requirements. WebTransport operates over HTTP/3 and QUIC, providing multiplexed, secure, and ultra-low-latency bidirectional streams.18

Unlike WebRTC, which requires a complex SDP (Session Description Protocol) negotiation dance and prolonged ICE candidate gathering, QUIC allows for 0-RTT (Zero Round Trip Time) connection establishment.18 This drastically reduces the time it takes for a user to join a meeting, fulfilling the user's requirement for "seamless" connectivity. Furthermore, QUIC provides superior congestion control and packet loss recovery natively at the transport layer, outperforming WebRTC's SCTP data channels.18

Advanced Rust frameworks like videocall.rs are already demonstrating the viability of utilizing WebTransport for sub-100ms latency environments, utilizing WebSockets purely as a fallback mechanism for older browsers (such as Safari, which historically lags in WebTransport adoption).18 Incorporating WebTransport alongside standard WebRTC endpoints will give the platform a massive competitive advantage in connection speed and stability.29

## **Advanced Signaling and Distributed State Management**

WebRTC does not prescribe a specific signaling protocol; it only dictates that session descriptions (SDP) and ICE candidates must be exchanged before a media connection can be established.32 For a highly scalable cloud platform, the signaling server must be completely decoupled from the media routing nodes.

To manage thousands of concurrent users joining, leaving, and modifying their state (e.g., muting a microphone, raising a hand, or starting a screen share), the platform requires a robust message broker. Utilizing technologies like NATS or Redis Pub/Sub written in Go or Rust is highly recommended.10

NATS, specifically its Jetstream persistence layer, is an exceptionally fast pub/sub message delivery system that can instantly broadcast signaling events across a distributed cluster of microservices.18 When a user connects via a secure WebSocket to a signaling gateway, the gateway leverages NATS to locate the optimal SFU node for that user, initializes the room state, and coordinates the exchange of cryptographic keys (DTLS) and media capabilities.14 By decoupling the signaling state from the media transport, the platform can scale its WebSockets independently of its UDP media routers, preventing a sudden influx of users (e.g., when a webinar begins) from crashing the active video streams.

## **Video Optimization and Congestion Control for 1000+ Users**

Supporting 1000+ users without lag requires more than just high network throughput; it demands intelligent adaptation to the fluctuating network conditions of individual users. This is achieved through automated congestion control and layered video encoding strategies.

### **Bandwidth Estimation and Congestion Control**

In a large webinar, viewers will have wildly varying download speeds. A robust SFU continuously monitors the network through Real-Time Transport Control Protocol (RTCP) feedback.37 Using advanced algorithms like Google Congestion Control (googcc) and Transport-wide Congestion Control (transport-cc), the SFU evaluates packet arrival times to estimate the available bandwidth for each client without causing latency spikes.37 If a user's network degrades, the SFU must seamlessly switch the stream it forwards to that user to a lower resolution to prevent packet loss, video freezing, and audio dropouts.37

### **Simulcast versus Scalable Video Coding (SVC)**

To provide the SFU with the alternative resolutions needed for dynamic adaptation, the broadcasting client must utilize either Simulcast or Scalable Video Coding (SVC).3

* **Simulcast**: In a Simulcast configuration, the client's browser encodes the primary video feed into three distinct spatial streams (e.g., 1080p high, 720p medium, and 360p low) and uploads all three to the SFU concurrently.40 The SFU then selectively forwards the appropriate stream to each viewer based on their available bandwidth.42 Simulcast is highly stable, universally supported across all browsers (specifically with the VP8 codec), and mathematically simple for the SFU to manage.31 However, uploading three separate streams consumes more of the broadcaster's upload CPU and bandwidth.40  
* **Scalable Video Coding (SVC)**: With SVC (often paired with the VP9 or AV1 codecs), the client encodes a single video stream that contains multiple spatial and temporal layers.40 A viewer with a poor connection receives only the base layer (low quality), while a viewer with an excellent connection receives the base layer plus the enhancement layers (high quality).40 SVC is significantly more bandwidth-efficient for the broadcaster, but browser compatibility remains fragmented (particularly on iOS Safari), and parsing the layered payloads requires more sophisticated logic and CPU overhead on the SFU.31

For maximum reliability across diverse devices, the platform should default to the VP8 codec with Simulcast for standard web-clients, dynamically shifting to VP9 SVC only when both the client browser and network conditions permit.42

## **Implementing Critical Meeting Features**

To elevate the platform from a bare media router to a fully-fledged collaboration space, several critical features must be integrated directly into the WebRTC streams and signaling architecture, as requested in the initial requirements.

### **Seamless Screen Sharing Mechanics**

Screen sharing is an essential feature for webinars and collaborative rooms. In modern browsers, this is initiated via the navigator.mediaDevices.getDisplayMedia API.44 When a user opts to share their screen, the browser presents a native permission dialogue allowing them to select a specific window, application, or their entire desktop.45

A sophisticated implementation must ensure that the user can share their screen while simultaneously maintaining their webcam stream.47 This requires the SFU to support multiple concurrent media tracks per participant.47 When the getDisplayMedia promise resolves, a new WebRTC RTCRtpSender is instantiated, and a new video track (and optionally, an audio track for system sounds) is published to the SFU.45

It is critical to pass specific constraints, such as video: { cursor: 'always' }, to ensure that viewers can track the presenter's mouse movements, which is a frequently overlooked detail in basic implementations.47 Furthermore, screen shares should prioritize high resolution and low framerate (e.g., 1080p at 5-10fps) to preserve text readability, contrasting with webcam streams which prioritize smooth framerates over absolute resolution.

### **High-Frequency Data Channels for Emojis and Chat**

Features like real-time text chat, file sharing, and interactive emoji reactions do not require the overhead of a centralized WebSocket server; they can be executed with virtually zero latency using WebRTC Data Channels.49

The RTCDataChannel API provides a direct, peer-to-peer (or peer-to-SFU-to-peer) conduit powered by the Stream Control Transmission Protocol (SCTP), secured automatically by Datagram Transport Layer Security (DTLS).35 SCTP allows developers to configure the delivery semantics based on the specific feature:

* **Text Chat and File Sharing**: Configured for *reliable, ordered delivery*. This ensures that chat messages arrive exactly in the sequence they were sent, and file binaries are not corrupted during transfer.49  
* **Emoji Reactions and Analytics**: Configured for *unreliable, unordered delivery*. In a webinar with 1000 users, if hundreds of participants click a "thumbs up" emoji simultaneously, the system must broadcast these events instantly. If a single UDP packet containing an emoji reaction is lost over the network, it does not matter; it is better to drop the packet than to hold up subsequent network traffic forcing a retransmission (head-of-line blocking).35

To ensure scalability, the SFU must efficiently route these data channel payloads. Historically, sending large files over a data channel would monopolize the SCTP association. The platform must utilize an SFU that supports the SCTP End of Record (EOR) flag, which prevents large payloads from blocking critical signaling or high-frequency emoji bursts.52

### **Advanced Administrative Controls and Lobbies**

For enterprise webinars, robust administrative controls and permission management are non-negotiable. The platform must implement a rigorous permission matrix governed by cryptographic JSON Web Tokens (JWTs) assigned during the initial authentication phase.18

**The Lobby System (Waiting Rooms)**: A virtual waiting room prevents unauthorized access and allows moderators to screen participants before they consume media resources.53 When a user attempts to join a locked room, the signaling server places their connection state into a Waiting status.54 The SFU does not authorize the exchange of ICE candidates or media tracks for this user, ensuring zero server load is generated.54 Instead, a notification is dispatched via the NATS signaling broker to the room administrators. Only when an administrator explicitly approves the user does the signaling server upgrade their state to Joined, granting them a valid JWT to access the WebRTC negotiation process.54

**Administrative Grants (Mute and Kick)**: Moderators must possess the ability to force-mute participants or eject them entirely.55 Using SDKs like LiveKit or building atop Mediasoup, this is managed via specific administrative privileges embedded in the user's JWT (e.g., roomAdmin and roomList grants).48

* **Mic Permissions and Muting**: To execute a "mute all" or "force mute" command, the admin's client issues an API request (e.g., MutePublishedTrack in LiveKit) to the SFU to modify the state of specific TrackPublication objects.48 The SFU intercepts the incoming audio track from the offending participant and ceases forwarding the media bytes to the rest of the room.48 Crucially, to prevent privacy violations, platforms usually implement a strict policy where administrators can force-mute a track, but cannot remotely unmute a participant without their explicit physical interaction.48  
* **Ejecting (Kicking)**: Kicking a user involves the signaling server terminating the user's WebSocket connection and instructing the SFU to instantly tear down the user's PeerConnection.55 This permanently halts all media ingestion and egress, immediately reclaiming server resources.

## **Global Infrastructure, Scaling, and Geo-Routing**

Deploying a system capable of handling 1000+ seamless connections without lag requires a highly orchestrated cloud infrastructure. A single physical server will eventually succumb to CPU or network interface card (NIC) bottlenecks when forced to route tens of thousands of simultaneous media streams.57 The solution lies in horizontal scaling, SFU cascading, and geographic sharding.

### **Horizontal Scaling and SFU Cascading**

When a single virtual room exceeds the capacity of a single SFU node (typically around 300-500 intensive connections depending on the compute instance), the system must scale horizontally.58 This is achieved through a mechanism known as SFU Cascading.

In a cascaded architecture, multiple SFU servers are networked together to act as a unified, logical meeting space.36 When Server A reaches capacity, new users are seamlessly directed to Server B.36 If a user on Server A is broadcasting a presentation, Server A creates a secure, high-bandwidth PipeTransport connection to Server B.36 Server A forwards the presentation stream to Server B exactly once, and Server B then duplicates and forwards it to all of its local connected viewers.36 This prevents the broadcaster's origin server from collapsing under the weight of thousands of viewer requests, distributing the CPU and bandwidth load evenly across the cluster.59

### **Global Geo-Routing for Ultra-Low Latency**

If a user in Sydney connects to an SFU located in New York, the sheer physical distance dictates a high round-trip time (RTT), resulting in inevitable lag and jitter.63 To maintain end-to-end latency below 150 milliseconds globally (a critical threshold for conversational latency), the platform must deploy SFU clusters across multiple geographic regions.63

Using a global DNS routing service like AWS Route 53 with latency-based routing, a user attempting to join a meeting is automatically directed to the cloud region geographically closest to them.63 The signaling server issues a "geo-sticky" JWT, ensuring that the client remains bound to their local edge SFU for the duration of the session.63 The edge SFUs across the globe then communicate with each other over the cloud provider's private, high-speed backbone (e.g., the AWS Global Network), which avoids the congestion, packet loss, and unpredictability of the public internet.63

### **Kubernetes and Event-Driven Autoscaling**

To manage these distributed clusters, deploying the application within a container orchestration environment like Kubernetes (Amazon EKS, Google GKE) is highly recommended.24 However, standard CPU-based autoscaling is often too slow for the bursty nature of virtual events and webinars, where hundreds of users might click a join link at the exact same moment.

Instead, the architecture should utilize Kubernetes Event-driven Autoscaling (KEDA).63 By monitoring custom metrics generated by the signaling server or the SFU—such as the rate of incoming connections, the aggregate count of active video tracks, or the number of participants in the lobby—KEDA can preemptively spin up new SFU pods before the existing nodes become saturated.63 This guarantees that compute capacity is always available during sudden traffic spikes, ensuring that users do not experience connection timeouts or degraded stream quality when joining.24 Tests have shown that with this architecture, even under a 2% packet loss and 200ms delay network chaos simulation, CPU usage only rose moderately, and latency targets were successfully met.63

## **Financial Operations (FinOps) and Cost Optimization**

Hosting a massive-scale video platform incurs substantial cloud infrastructure costs, primarily driven by compute resources and data egress fees.63 The architectural choices detailed above inherently optimize these expenses:

1. **Egress Mitigation via Geo-Sharding**: Cloud providers charge heavily for data leaving their network (egress). By keeping local users connected to local SFUs through geo-routing, the system prevents video streams from unnecessarily crossing regional boundaries. A user in Europe viewing a European presenter does not cause data to transit across the Atlantic. Implementing geo-sharding has been proven to cut global data egress costs by up to 70%.63  
2. **Compute Efficiency**: Utilizing high-performance compiled languages like Rust or Go ensures that each server instance can handle significantly more concurrent streams than equivalent Node.js or Python environments.9 This maximizes the utilization of underlying hardware, allowing the platform to run on fewer, smaller compute instances, driving down EC2 or Compute Engine costs.70  
3. **Automated Scaling Down**: Just as KEDA dynamically adds resources during peak loads, it aggressively shuts down idle media nodes when webinars conclude or traffic drops below specific thresholds.24 This eliminates the financial drain of running empty, over-provisioned servers.58  
4. **Granular Cost Allocation**: Leveraging native Kubernetes labels as Cost Allocation Tags within environments like AWS allows for granular financial tracking. This enables the organization to attribute infrastructure costs down to specific webinar events or customer tenants via Split Cost Allocation Data dashboards.69

## **Detailed Execution Plan and Strategic Synthesis**

To successfully transition from the decentralized sLime concept to the proposed cloud-native platform, a phased execution plan is required. This ensures that the foundation is stable before scaling features and user capacity.

### **Phase 1: Core Architecture and Engine Validation**

* **Action**: Select the SFU engine. If development velocity and out-of-the-box SDKs are prioritized, initialize the project with LiveKit (Go). If absolute maximum density, lowest latency, and the desire to leverage existing Rust expertise are paramount, construct the media layer using Mediasoup (Rust/C++).11  
* **Action**: Establish the signaling infrastructure using NATS Jetstream or Redis Pub/Sub to decouple state management from media routing.10  
* **Action**: Implement JWT-based authentication to define basic User and Admin roles.18  
* **Outcome**: A working proof-of-concept where users can join a basic web-based room without downloading native software.

### **Phase 2: Advanced Features and Optimization**

* **Action**: Integrate screen sharing utilizing getDisplayMedia, ensuring the client can handle multiple concurrent WebRTC tracks (webcam \+ screen).45  
* **Action**: Implement WebRTC Data Channels. Configure a reliable channel for chat and file transfers, and an unreliable channel for high-frequency emoji bursts, ensuring the SFU supports the EOR flag to prevent blocking.49  
* **Action**: Build the administrative suite. Implement the Waiting Room/Lobby logic via the signaling server, and expose the MutePublishedTrack and connection teardown APIs for moderators to control mic permissions and eject disruptive guests.48  
* **Action**: Enable VP8 Simulcast to ensure viewers with poor bandwidth receive downscaled video automatically.42

### **Phase 3: Infrastructure Scaling and Deployment**

* **Action**: Containerize the application and deploy it to a managed Kubernetes service (AWS EKS).68  
* **Action**: Deploy highly available TURN servers (Coturn) within the cluster using hostNetwork: true to guarantee NAT traversal for corporate clients.27  
* **Action**: Implement KEDA to trigger automatic pod scaling based on custom metrics (e.g., active WebRTC connections or video track counts) rather than CPU alone.63

### **Phase 4: Global Distribution and Future-Proofing**

* **Action**: Replicate the Kubernetes clusters across multiple geographic regions (e.g., US East, Europe, Asia Pacific).  
* **Action**: Implement AWS Route 53 latency-based DNS and SFU Cascading via PipeTransports to ensure the system can host 1000+ user webinars globally while keeping P95 latency under 150ms.36  
* **Action**: Begin experimenting with WebTransport (HTTP/3) fallback mechanisms to further reduce initial connection times and improve congestion recovery over standard WebRTC.18

By executing this blueprint, the platform will successfully bridge the gap between high-performance native paradigms and accessible, massively scalable cloud infrastructure, resulting in a lag-free, feature-rich webinar and meeting environment.

#### **Works cited**

1. WebRTC P2P vs MCU vs SFU \- DEV Community, accessed on March 11, 2026, [https://dev.to/abirk/webrtc-p2p-vs-mcu-vs-sfu-1b89](https://dev.to/abirk/webrtc-p2p-vs-mcu-vs-sfu-1b89)  
2. Mesh vs SFU vs MCU: Choosing the Right WebRTC Network Topology \- Ant Media Server, accessed on March 11, 2026, [https://antmedia.io/webrtc-network-topology/](https://antmedia.io/webrtc-network-topology/)  
3. WebRTC Topology: SFU vs MCU vs P2P \- Medium, accessed on March 11, 2026, [https://medium.com/@justin.edgewoods/webrtc-topology-sfu-vs-mcu-vs-p2p-bdd846eee35c](https://medium.com/@justin.edgewoods/webrtc-topology-sfu-vs-mcu-vs-p2p-bdd846eee35c)  
4. WebRTC Architecture Explained: P2P vs SFU vs MCU vs XDN \- Red5 Pro, accessed on March 11, 2026, [https://www.red5.net/blog/webrtc-architecture-p2p-sfu-mcu-xdn/](https://www.red5.net/blog/webrtc-architecture-p2p-sfu-mcu-xdn/)  
5. the complete Guide.. What is WebRTC SFU (Selective… | by James bordane | Medium, accessed on March 11, 2026, [https://medium.com/@jamesbordane57/webrtc-sfu-the-complete-guide-3589be4daa54](https://medium.com/@jamesbordane57/webrtc-sfu-the-complete-guide-3589be4daa54)  
6. Broadcasting (One to Many) · Issue \#134 · miroslavpejic85/mirotalksfu \- GitHub, accessed on March 11, 2026, [https://github.com/miroslavpejic85/mirotalksfu/issues/134](https://github.com/miroslavpejic85/mirotalksfu/issues/134)  
7. Rust vs Go: WebRTC Data Channel Performance Benchmark \- Miuda.ai, accessed on March 11, 2026, [https://miuda.ai/blog/webrtc-datachannel-benchmark/](https://miuda.ai/blog/webrtc-datachannel-benchmark/)  
8. Rust vs GoLang on http/https/websocket/webrtc performance, accessed on March 11, 2026, [https://users.rust-lang.org/t/rust-vs-golang-on-http-https-websocket-webrtc-performance/71118](https://users.rust-lang.org/t/rust-vs-golang-on-http-https-websocket-webrtc-performance/71118)  
9. Webrtc server video/audio \- The Rust Programming Language Forum, accessed on March 11, 2026, [https://users.rust-lang.org/t/webrtc-server-video-audio/67051](https://users.rust-lang.org/t/webrtc-server-video-audio/67051)  
10. LiveKit SFU, accessed on March 11, 2026, [https://docs.livekit.io/reference/internals/livekit-sfu/](https://docs.livekit.io/reference/internals/livekit-sfu/)  
11. WebRTC Top 100 Open-Source projects for 2023, accessed on March 11, 2026, [https://www.webrtc-developers.com/webrtc-top-100-open-source-projects-for-2023/](https://www.webrtc-developers.com/webrtc-top-100-open-source-projects-for-2023/)  
12. Janus vs Mediasoup vs LiveKit: Choosing the Best SFU for Telemedicine \- Trembit, accessed on March 11, 2026, [https://trembit.com/blog/choosing-the-right-sfu-janus-vs-mediasoup-vs-livekit-for-telemedicine-platforms/](https://trembit.com/blog/choosing-the-right-sfu-janus-vs-mediasoup-vs-livekit-for-telemedicine-platforms/)  
13. 8 Best LiveKit Alternatives, accessed on March 11, 2026, [https://getstream.io/blog/livekit-alternatives/](https://getstream.io/blog/livekit-alternatives/)  
14. WebRTC signaling server in Rust \- Reddit, accessed on March 11, 2026, [https://www.reddit.com/r/rust/comments/zqkzor/webrtc\_signaling\_server\_in\_rust/](https://www.reddit.com/r/rust/comments/zqkzor/webrtc_signaling_server_in_rust/)  
15. Need Help with Implementing SFU for WebRTC Multi-Peer Connections \- Reddit, accessed on March 11, 2026, [https://www.reddit.com/r/WebRTC/comments/1i38z4d/need\_help\_with\_implementing\_sfu\_for\_webrtc/](https://www.reddit.com/r/WebRTC/comments/1i38z4d/need_help_with_implementing_sfu_for_webrtc/)  
16. Performant \- OpenVidu, accessed on March 11, 2026, [https://openvidu.io/latest/docs/self-hosting/production-ready/performance/](https://openvidu.io/latest/docs/self-hosting/production-ready/performance/)  
17. The promise of Rust \- YouTube, accessed on March 11, 2026, [https://www.youtube.com/watch?v=zo6yZisg7N0](https://www.youtube.com/watch?v=zo6yZisg7N0)  
18. security-union/videocall-rs: media streaming framework ... \- GitHub, accessed on March 11, 2026, [https://github.com/security-union/videocall-rs](https://github.com/security-union/videocall-rs)  
19. webrtc-rs/webrtc: Async-friendly WebRTC implementation in Rust \- GitHub, accessed on March 11, 2026, [https://github.com/webrtc-rs/webrtc](https://github.com/webrtc-rs/webrtc)  
20. Top WebRTC open source media servers on github for 2024 \- BlogGeek.me, accessed on March 11, 2026, [https://bloggeek.me/webrtc-open-source-media-servers-github-2024/](https://bloggeek.me/webrtc-open-source-media-servers-github-2024/)  
21. Janus vs LiveKit vs mediasoup — Which WebRTC Server Should You Choose?, accessed on March 11, 2026, [https://mylinehub.com/articles/janus-vs-livekit-vs-mediasoup-webrtc-server-comparison](https://mylinehub.com/articles/janus-vs-livekit-vs-mediasoup-webrtc-server-comparison)  
22. Cloudflare Calls: millions of cascading trees all the way down, accessed on March 11, 2026, [https://blog.cloudflare.com/cloudflare-calls-anycast-webrtc/](https://blog.cloudflare.com/cloudflare-calls-anycast-webrtc/)  
23. restsend/rustrtc: A high-performance implementation of WebRTC. \- GitHub, accessed on March 11, 2026, [https://github.com/restsend/rustrtc](https://github.com/restsend/rustrtc)  
24. Complete Guide to WebRTC Scalability in 2025, accessed on March 11, 2026, [https://antmedia.io/webrtc-scalability/](https://antmedia.io/webrtc-scalability/)  
25. A thorough explanation and practice of STUN/TURN/TURNS/SFU in WebRTC \- Web会議の Chat\&Messenger, accessed on March 11, 2026, [https://chat-messenger.com/en/blog/webrtc-stun-turn-turns-sfu](https://chat-messenger.com/en/blog/webrtc-stun-turn-turns-sfu)  
26. Meetrix Coturn/Turn server \- AWS Marketplace, accessed on March 11, 2026, [https://aws.amazon.com/marketplace/pp/prodview-zrea7eq3c4jbe](https://aws.amazon.com/marketplace/pp/prodview-zrea7eq3c4jbe)  
27. Running STUNner as a Public TURN Server, Part 2 | by Gabor Retvari | L7mp Technologies, accessed on March 11, 2026, [https://medium.com/l7mp-technologies/running-stunner-as-a-public-turn-server-part-2-c75222c3fff1](https://medium.com/l7mp-technologies/running-stunner-as-a-public-turn-server-part-2-c75222c3fff1)  
28. Is coturn possible to running on kubernetes? · Issue \#738 \- GitHub, accessed on March 11, 2026, [https://github.com/coturn/coturn/issues/738](https://github.com/coturn/coturn/issues/738)  
29. Announcing Interop 2026 \- WebKit, accessed on March 11, 2026, [https://webkit.org/blog/17818/announcing-interop-2026/](https://webkit.org/blog/17818/announcing-interop-2026/)  
30. WebTransport API \- MDN Web Docs, accessed on March 11, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/WebTransport\_API](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API)  
31. WebRTC Browser Support & Compatibility in 2025 | by Malti Thakur | Medium, accessed on March 11, 2026, [https://medium.com/@malti.thakur/webrtc-browser-support-compatibility-in-2025-a7d44c27e55a](https://medium.com/@malti.thakur/webrtc-browser-support-compatibility-in-2025-a7d44c27e55a)  
32. How to Build Real-Time Video Chat Applications with WebRTC \- DEV Community, accessed on March 11, 2026, [https://dev.to/softheartengineer/how-to-build-real-time-video-chat-applications-with-webrtc-471n](https://dev.to/softheartengineer/how-to-build-real-time-video-chat-applications-with-webrtc-471n)  
33. Getting Started with WebRTC: A Practical Guide with Example Code | by Feng Liu \- Medium, accessed on March 11, 2026, [https://medium.com/@fengliu\_367/getting-started-with-webrtc-a-practical-guide-with-example-code-b0f60efdd0a7](https://medium.com/@fengliu_367/getting-started-with-webrtc-a-practical-guide-with-example-code-b0f60efdd0a7)  
34. Building a Scalable Chat Server in Golang and NATS | by Karthik Raju \- Medium, accessed on March 11, 2026, [https://medium.com/@karthikraju391/building-a-scalable-chat-server-in-golang-and-nats-9faf68b61d9f](https://medium.com/@karthikraju391/building-a-scalable-chat-server-in-golang-and-nats-9faf68b61d9f)  
35. Using WebRTC data channels \- Web APIs | MDN \- Mozilla, accessed on March 11, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/WebRTC\_API/Using\_data\_channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)  
36. Scaling Mediasoup: Vertical and Horizontal Scaling Strategies \- Deployment & Scalability, accessed on March 11, 2026, [https://mediasoup.discourse.group/t/scaling-mediasoup-vertical-and-horizontal-scaling-strategies/6728](https://mediasoup.discourse.group/t/scaling-mediasoup-vertical-and-horizontal-scaling-strategies/6728)  
37. How to build large-scale end-to-end encrypted group video calls \- Signal, accessed on March 11, 2026, [https://signal.org/blog/how-to-build-encrypted-group-calls/](https://signal.org/blog/how-to-build-encrypted-group-calls/)  
38. Applied WebRTC, accessed on March 11, 2026, [https://webrtcforthecurious.com/docs/08-applied-webrtc/](https://webrtcforthecurious.com/docs/08-applied-webrtc/)  
39. Breaking Point: WebRTC SFU Load Testing (Alex Gouaillard) \- webrtcHacks, accessed on March 11, 2026, [https://webrtchacks.com/sfu-load-testing/](https://webrtchacks.com/sfu-load-testing/)  
40. Scalable Video Coding for WebRTC \- Wowza, accessed on March 11, 2026, [https://www.wowza.com/blog/scalable-video-coding-for-webrtc](https://www.wowza.com/blog/scalable-video-coding-for-webrtc)  
41. WebRTC Tip \#4: Don't Always Use Simulcast or SVC \- YouTube, accessed on March 11, 2026, [https://m.youtube.com/shorts/6sPhihzlzko](https://m.youtube.com/shorts/6sPhihzlzko)  
42. The Role of Scalable Video Coding (SVC) in Video Conferencing \- Digital Samba, accessed on March 11, 2026, [https://www.digitalsamba.com/blog/the-role-of-scalable-video-coding-in-modern-communication](https://www.digitalsamba.com/blog/the-role-of-scalable-video-coding-in-modern-communication)  
43. How does it compare with Janus? Janus seems well tested and it's available in Li... | Hacker News, accessed on March 11, 2026, [https://news.ycombinator.com/item?id=23234445](https://news.ycombinator.com/item?id=23234445)  
44. How to Share Your Screen with Audio in WebRTC – Fiddle of the Month \- YouTube, accessed on March 11, 2026, [https://www.youtube.com/watch?v=sQt0FBkIMrw](https://www.youtube.com/watch?v=sQt0FBkIMrw)  
45. Sharing screen \+ microphone together \- WebRTC Courses, accessed on March 11, 2026, [https://webrtccourse.com/course/webrtc-codelab/module/fiddle-of-the-month/lesson/sharing-screen-microphone-together/](https://webrtccourse.com/course/webrtc-codelab/module/fiddle-of-the-month/lesson/sharing-screen-microphone-together/)  
46. Implementing WebRTC Screen Sharing in a web app, late 2016 | by Chris Ward | Medium, accessed on March 11, 2026, [https://medium.com/@chris\_82106/implementing-webrtc-screen-sharing-in-a-web-app-late-2016-51c1a2642e4](https://medium.com/@chris_82106/implementing-webrtc-screen-sharing-in-a-web-app-late-2016-51c1a2642e4)  
47. Screen-Sharing with Asterisk's SFU \- Dan Jenkins, accessed on March 11, 2026, [https://dan-jenkins.co.uk/screensharing-with-asterisks-sfu/](https://dan-jenkins.co.uk/screensharing-with-asterisks-sfu/)  
48. Participant management | LiveKit Documentation, accessed on March 11, 2026, [https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants/](https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants/)  
49. RTCDataChannel WebRTC Tutorial \- GetStream.io, accessed on March 11, 2026, [https://getstream.io/resources/projects/webrtc/basics/rtcdatachannel/](https://getstream.io/resources/projects/webrtc/basics/rtcdatachannel/)  
50. WebRTC Data Channel | Ant Media Documentation, accessed on March 11, 2026, [https://docs.antmedia.io/guides/publish-live-stream/webrtc/data-channel/](https://docs.antmedia.io/guides/publish-live-stream/webrtc/data-channel/)  
51. Advancing Real-Time Communication with WebRTC Data Channel \- DEV Community, accessed on March 11, 2026, [https://dev.to/digitalsamba/advancing-real-time-communication-with-webrtc-data-channel-a26](https://dev.to/digitalsamba/advancing-real-time-communication-with-webrtc-data-channel-a26)  
52. Large Data Channel Messages \- Advancing WebRTC \- The Mozilla Blog, accessed on March 11, 2026, [https://blog.mozilla.org/webrtc/large-data-channel-messages/](https://blog.mozilla.org/webrtc/large-data-channel-messages/)  
53. miroslavpejic85/mirotalksfu: WebRTC \- SFU \- Simple, Secure, Scalable Real-Time Video Conferences Up to 8k, compatible with all browsers and platforms. \- GitHub, accessed on March 11, 2026, [https://github.com/miroslavpejic85/mirotalksfu](https://github.com/miroslavpejic85/mirotalksfu)  
54. Building a Virtual Waiting Room with Daily's React Hooks Library \- WebRTC.ventures, accessed on March 11, 2026, [https://webrtc.ventures/2022/09/building-a-virtual-waiting-room-with-dailys-react-hooks-library/](https://webrtc.ventures/2022/09/building-a-virtual-waiting-room-with-dailys-react-hooks-library/)  
55. Moderator Controls · Issue \#749 · livekit/components-js \- GitHub, accessed on March 11, 2026, [https://github.com/livekit/components-js/issues/749](https://github.com/livekit/components-js/issues/749)  
56. Client Protocol \- LiveKit Documentation, accessed on March 11, 2026, [https://docs.livekit.io/reference/internals/client-protocol/](https://docs.livekit.io/reference/internals/client-protocol/)  
57. \[Problem Solving Rust Video\] We Built a WASM Video Conferencing System in Rust capable of handling 1000 users per call \- Reddit, accessed on March 11, 2026, [https://www.reddit.com/r/rust/comments/13zefw0/problem\_solving\_rust\_video\_we\_built\_a\_wasm\_video/](https://www.reddit.com/r/rust/comments/13zefw0/problem_solving_rust_video_we_built_a_wasm_video/)  
58. Auto scaling WebRTC with Mediasoup | by Saurav \- Medium, accessed on March 11, 2026, [https://medium.com/@hello\_92112/auto-scaling-webrtc-with-mediasoup-570b526f1975](https://medium.com/@hello_92112/auto-scaling-webrtc-with-mediasoup-570b526f1975)  
59. SFU Cascading \- GetStream.io, accessed on March 11, 2026, [https://getstream.io/resources/projects/webrtc/architectures/sfu-cascading/](https://getstream.io/resources/projects/webrtc/architectures/sfu-cascading/)  
60. How we built a globally distributed mesh network to scale WebRTC \- LiveKit Blog, accessed on March 11, 2026, [https://blog.livekit.io/scaling-webrtc-with-distributed-mesh/](https://blog.livekit.io/scaling-webrtc-with-distributed-mesh/)  
61. Scaling Mediasoup SFU horizontally for N:N (up to 20 people per room), audio sharing only : r/WebRTC \- Reddit, accessed on March 11, 2026, [https://www.reddit.com/r/WebRTC/comments/1oik8j3/scaling\_mediasoup\_sfu\_horizontally\_for\_nn\_up\_to/](https://www.reddit.com/r/WebRTC/comments/1oik8j3/scaling_mediasoup_sfu_horizontally_for_nn_up_to/)  
62. SFU Cascading \- Why cascade Selective Forwarding Units \- GetStream.io, accessed on March 11, 2026, [https://getstream.io/glossary/sfu-cascading/](https://getstream.io/glossary/sfu-cascading/)  
63. Scaling Real-Time Video on AWS: How We Keep WebRTC Latency Below 150ms with Kubernetes Autoscaling | HackerNoon, accessed on March 11, 2026, [https://hackernoon.com/scaling-real-time-video-on-aws-how-we-keep-webrtc-latency-below-150ms-with-kubernetes-autoscaling](https://hackernoon.com/scaling-real-time-video-on-aws-how-we-keep-webrtc-latency-below-150ms-with-kubernetes-autoscaling)  
64. Choosing a stickiness strategy for your load balancer \- AWS Prescriptive Guidance, accessed on March 11, 2026, [https://docs.aws.amazon.com/prescriptive-guidance/latest/load-balancer-stickiness/welcome.html](https://docs.aws.amazon.com/prescriptive-guidance/latest/load-balancer-stickiness/welcome.html)  
65. Updating AWS Global Accelerator EC2 endpoints automatically based on Auto Scaling group events | Networking & Content Delivery, accessed on March 11, 2026, [https://aws.amazon.com/blogs/networking-and-content-delivery/updating-aws-global-accelerator-ec2-endpoints-based-on-autoscaling-group-events/](https://aws.amazon.com/blogs/networking-and-content-delivery/updating-aws-global-accelerator-ec2-endpoints-based-on-autoscaling-group-events/)  
66. Improving Scale and Media Quality with Cascading SFUs (Boris Grozev) \- webrtcHacks, accessed on March 11, 2026, [https://webrtchacks.com/sfu-cascading/](https://webrtchacks.com/sfu-cascading/)  
67. Janus vs LiveKit? help me to choose : r/WebRTC \- Reddit, accessed on March 11, 2026, [https://www.reddit.com/r/WebRTC/comments/1i9nnnz/janus\_vs\_livekit\_help\_me\_to\_choose/](https://www.reddit.com/r/WebRTC/comments/1i9nnnz/janus_vs_livekit_help_me_to_choose/)  
68. Data-driven Amazon EKS cost optimization: A practical guide to workload analysis \- AWS, accessed on March 11, 2026, [https://aws.amazon.com/blogs/containers/data-driven-amazon-eks-cost-optimization-a-practical-guide-to-workload-analysis/](https://aws.amazon.com/blogs/containers/data-driven-amazon-eks-cost-optimization-a-practical-guide-to-workload-analysis/)  
69. AWS Cloud Financial Management: Key 2025 re:Invent Launches to Transform Your FinOps Practices, accessed on March 11, 2026, [https://aws.amazon.com/blogs/aws-cloud-financial-management/aws-cloud-financial-management-key-reinvent-2025-launches-to-transform-your-finops-practice/](https://aws.amazon.com/blogs/aws-cloud-financial-management/aws-cloud-financial-management-key-reinvent-2025-launches-to-transform-your-finops-practice/)  
70. AWS re:Invent 2025 \- Optimize AWS Costs: Developer Tools and Techniques (DEV318), accessed on March 11, 2026, [https://www.youtube.com/watch?v=vvdjlAHojY8](https://www.youtube.com/watch?v=vvdjlAHojY8)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAZCAYAAAA8CX6UAAAA9ElEQVR4Xu2SMQtBURiGv6IMBmVhtRiUxIjJwGCTzR+QMmFQ5AdgNVooIwurTEryE0xSMpBdvMc5t3vPdzEpy33q6Z7zvud+3VOXyOFvtODDYkGvKWPpDMvaCcYMNkkeTLFOUIFDHnLc8AL9JAdN9PrFGJZ4yEnDlVobnx826xdHGGSZjbZSsCY5aGDWFINby/4tXniGLrUX19yTHNZR2Rzm1PojeThlWY3koBP0wKt6fqUHqyzzkXxZDMvChV6/ZwejPAR9koO6sME6GwF44KEiBO/wBhOs0xB33sAljLDOIAlHPLQSJ/tvX9dOmBR54ODwS57c/TLi4awD6AAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAZCAYAAACclhZ6AAABYElEQVR4Xu2VPUsDQRCGRxQEjV+tVlYpBHsbEfEvCOI/0EZJp4WdYKOddiL+AMHGSgRBENRKsBcsLGzEwkIs9B1nh9sdSFyL7CHMAw+X23eH3OQyd0SO47ShF66E47/nFH7Bhg1i1kk2qatpTBNRph4mO7rHEMn3fYbjr80oR/CdpGDRZMwcvLOLBflTM89wn6Tg2mTMJtyxiwXJbmYa3sMmVUXzyQ6ic7hg1kqS3QzPzW74fEJSdFbFNAhfYX+0VpqsZvrgG8kFKzwbXHgczvdgq4prQZvhh0JbZuGFWVsiKfwI5w8kf8U60WaGbRCzBTfMGt+tR5LiSfiUxh3h2cr1INTkoM2M2CDmEs7YRareP2tU7r3SCW1m1AYKD9MLyZ2wcMZDz/O0bLI60GbGbMDwk+kK3sIp2JPGP4zDG7tYE9oM/7ADccDDrKG6HW+IsPNUGv532GtlHcdxHKfrfAMKSl4n4EvaXQAAAABJRU5ErkJggg==>