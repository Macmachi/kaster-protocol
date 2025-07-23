# Kaster Protocol - Reference Implementation

A decentralized messaging protocol for the Kaspa blockDAG with reference web interface.

**🔗 Live Demo: [https://macmachi.github.io/kaster-protocol/](https://macmachi.github.io/kaster-protocol/)**

## ⚠️ Important Disclaimer

This repository contains a **reference implementation** of the Kaster Protocol for **educational and demonstration purposes only**. This is not a production service or platform - it's a technical specification and example implementation.

- **We are not responsible** for content published by users via their KasWare wallets
- **We provide no ongoing support** or maintenance guarantees
- **Content on the Kaspa blockDAG is permanent** and cannot be removed by anyone
- **Each user is solely responsible** for their publications and legal compliance

## What is the Kaster Protocol?

The **Kaster Protocol** is a message formatting specification that defines how to structure messages for decentralized storage on the Kaspa blockDAG. It consists of three main components:

### 1. 🔧 Protocol Specification
- **Message Format**: Binary payload structure for threads and replies
- **Data Types**: Title, message, theme, language, priority fields
- **Encoding Rules**: UTF-8 text encoding with byte length limits
- **Parent Linking**: System for creating threaded conversations

### 2. 💳 KasWare Integration
- **Transaction Handling**: KasWare wallet extension writes payloads to blockDAG
- **User Signatures**: Each message is signed by the user's wallet
- **Fee Payment**: Users pay network fees for their transactions
- **Decentralized Storage**: Content stored permanently on Kaspa blockDAG

### 3. 🌐 Reference Interface
- **Protocol Demonstration**: Web interface showing protocol capabilities
- **Local Filtering**: Client-side tools for content moderation
- **Educational Tool**: Example of how to implement the protocol
- **No Backend**: Purely client-side, reads directly from Kaspa API

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│  User's Browser │◄──►│ Reference        │◄──►│ KasWare Wallet  │
│                 │    │ Interface        │    │ Extension       │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │                 │    │                 │
                       │ Kaspa API       │    │ Kaspa BlockDAG  │
                       │ (Read Only)     │    │ (Permanent      │
                       │                 │    │  Storage)       │
                       └─────────────────┘    └─────────────────┘
```

### Component Responsibilities

| Component | Role | Data Flow |
|-----------|------|-----------|
| **Kaster Protocol** | Defines message format specification | Formats user input into binary payload |
| **Reference Interface** | Demonstrates protocol usage | User input → Protocol formatting → KasWare |
| **KasWare Wallet** | Handles blockDAG transactions | Signed payload → Kaspa Network |
| **Kaspa BlockDAG** | Permanent decentralized storage | Immutable transaction history |
| **Kaspa API** | Read blockDAG data | BlockDAG → Interface display |

## Protocol Specification

### Message Structure

All messages follow this binary format:

```
┌────────────────────────────────────────────────────────────┐
│ Version (1 byte) │ Parent TXID (32 bytes) │ Theme Length... │
├────────────────────────────────────────────────────────────┤
│ ...Theme Data │ Language Length │ Language Data │ Priority  │
├────────────────────────────────────────────────────────────┤
│ Title Length │ Title Data │ Message Length │ Message Data   │
└────────────────────────────────────────────────────────────┘
```

### Field Specifications

| Field | Type | Size | Description |
|-------|------|------|-------------|
| `version` | uint8 | 1 byte | Protocol version (currently 4) |
| `parentTxid` | bytes | 32 bytes | Parent transaction ID (0x00...00 for threads) |
| `themeLength` | uint16 | 2 bytes | Theme string length (big-endian) |
| `theme` | UTF-8 | variable | Message theme/category |
| `langLength` | uint16 | 2 bytes | Language code length (big-endian) |
| `language` | UTF-8 | variable | ISO language code (e.g., "en", "fr") |
| `priority` | uint8 | 1 byte | Message priority (0-255) |
| `titleLength` | uint16 | 2 bytes | Title length (big-endian) |
| `title` | UTF-8 | ≤40 bytes | Message title (threads only) |
| `msgLength` | uint16 | 2 bytes | Message body length (big-endian) |
| `message` | UTF-8 | ≤400 bytes | Message content |

### Message Types

#### Thread (New Discussion)
- `parentTxid`: `0000000000000000000000000000000000000000000000000000000000000000`
- `title`: Required, max 40 bytes
- `message`: Required, max 400 bytes
- Sent to protocol address: `kaspa:qz8sa5erejgulv5u8q795ssgsv8rx3m488ktwvfqhc3rqmzc9342j0525pnmh`

#### Reply
- `parentTxid`: Transaction ID of the parent thread
- `title`: Empty (length 0)
- `message`: Required, max 400 bytes
- Sent to thread author's address

## Installation and Local Setup

### Prerequisites

- Modern web browser with JavaScript enabled
- [KasWare wallet extension](https://kasware.xyz/) installed
- Local web server (for development)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Macmachi/kaster-protocol
   cd kaster-protocol
   ```

2. **Install a local web server** (choose one):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

4. **Install KasWare**
   - Visit [kasware.xyz](https://kasware.xyz/)
   - Install the browser extension
   - Create or import a wallet

### File Structure

```
kaster-protocol/
├── index.html              # Main interface file
├── css/
│   └── styles.css          # Interface styling
├── js/
│   ├── script.js           # Protocol implementation and UI logic
│   └── translations.js     # Multi-language support
├── assets/
│   └── logo.png            # Protocol logo
├── README.md               # This file
├── LICENSE                 # MIT license
├── CODE_OF_CONDUCT.md      # Community guidelines
└── REPORTING.md            # Content reporting guide
```

### Development Setup

1. **Local Development**
   ```bash
   # Serve files locally
   python -m http.server 8000
   
   # Open browser
   open http://localhost:8000
   ```

2. **Code Structure**
   - `script.js` contains the complete protocol implementation
   - `kasterAPI.decodeTransactionPayload()` - Parses protocol messages
   - `encodePayloadForThread()` - Creates thread payloads
   - `encodePayloadForReply()` - Creates reply payloads

3. **Testing**
   - Use Kaspa testnet for development
   - Test with small amounts of KAS
   - Verify message encoding/decoding

## Usage Examples

### Reading Messages

```javascript
// Fetch recent threads
const threads = await window.kasterAPI.fetchThreads();

// Decode a transaction payload
const decoded = window.kasterAPI.decodeTransactionPayload(payloadHex);
console.log(decoded.title, decoded.message);
```

### Creating Messages (via KasWare)

```javascript
// Format a thread message
const payload = encodePayloadForThread(
  "Hello World",              // title
  "This is my first message", // message  
  "General",                  // theme
  "en",                       // language
  0                          // priority
);

// Send via KasWare (user interaction required)
const txid = await window.kasware.sendKaspa(
  PROTOCOL_ADDRESS, 
  AMOUNT_SOMPIS, 
  { payload: payloadHex }
);
```

## Protocol Constants

```javascript
const PROTOCOL_ADDRESS = 'kaspa:qz8sa5erejgulv5u8q795ssgsv8rx3m488ktwvfqhc3rqmzc9342j0525pnmh';
const AMOUNT_SOMPIS = 12000000; // 0.12 KAS
const MAX_TITLE_BYTES = 40;
const MAX_MESSAGE_BYTES = 400;
const PROTOCOL_VERSION = 4;
```

## Legal and Technical Considerations

### Blockchain Permanence
- All messages are **permanently stored** on the Kaspa blockDAG
- **No deletion possible** once a transaction is confirmed
- **Public visibility** - anyone can read the blockDAG data
- **User responsibility** for all published content

### Local Filtering Tools
The reference interface provides client-side moderation:
- **Hide messages** - Local browser storage
- **Blacklist addresses** - Personal filtering only
- **Keyword filtering** - Custom word lists
- **No network effect** - Only affects individual users

### Legal Compliance
- Users must comply with their local laws
- Protocol authors are not responsible for user content
- KasWare handles all blockDAG transactions
- Permanent storage means permanent consequences

## Contributing

This is a reference implementation provided "as-is". While contributions are welcome:

- **No maintenance guarantee** - Issues may not be addressed
- **No support provided** - Use at your own risk
- **Educational purpose** - Not intended for production use
- **Fork encouraged** - Create your own version if needed

### Development Guidelines

1. Follow the existing code style
2. Test thoroughly with testnet KAS
3. Document any protocol changes
4. Consider legal implications of modifications

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.

## Disclaimer

This reference implementation is provided "AS IS" without warranty of any kind. The authors are not responsible for:

- Content published by users via their wallets
- KasWare wallet functionality or security
- Legal consequences of protocol usage
- BlockDAG network operation or fees
- Data loss or service interruption

**Use at your own risk and responsibility.**

---

*The Kaster Protocol is a message formatting specification. Actual blockDAG storage is handled by users' KasWare wallets independently.*