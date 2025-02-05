# @deltalaboratory/uuid

A lightweight UUID library for JavaScript/TypeScript with V4 and V7 support, offering efficient 22-character encoding and timestamp extraction.

## Installation

```bash
npm install @deltalaboratory/uuid
```

## Usage

### Basic UUID Creation

```javascript
import { UUID } from '@deltalaboratory/uuid'

// Create UUIDv4 (random)
const uuid4 = UUID.v4()

// Create UUIDv7 (time-based)
const uuid7 = UUID.v7()

console.log(uuid4.toString()) // "3b1caf7e-1b9a-482d-bf3a-7e9d6b5a0c1a"
console.log(uuid7.encode())   // "2AXQKkZTWq63x77hN8w9Wc"
```

### Format Conversion

```javascript
// Standard UUID format to compact encoding
const fullUuid = new UUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')
console.log(fullUuid.encode()) // "8HysC1jMR3KlZw4CssPUeQ"

// Compact encoding to standard format
const shortId = '5RCDi5zTRVmxh4EHAYj3sV'
const decoded = UUID.decode(shortId)
console.log(decoded.toString()) // "e51083c3-9cd3-4559-b187-810708f7b159"
```

### Timestamp Extraction (V7)

```javascript
const meetingId = UUID.v7()
console.log(meetingId.time()) // 1717741612014 (Unix timestamp in ms)
console.log(new Date(meetingId.time()).toISOString()) // "2024-06-07T12:26:52.014Z"
```

## Key Features

- **Dual Format Support**
    - `toString()`: Standard 36-character format (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
    - `encode()`: Compact 22-character URL-safe format

- **Version Support**
    - `UUID.v4()`: Random-based UUIDs (RFC 4122)
    - `UUID.v7()`: Time-ordered UUIDs with embedded timestamps

- **Efficient Encoding**
    - 22-character format uses base64url encoding (vs 36-char standard)
    - Maintains byte compatibility with standard UUIDs

- **Timestamp Support**
    - Extract embedded millisecond timestamp from V7 UUIDs
    - Direct time-ordered sorting capability

## Compatibility

Works in all modern browsers (Chrome 92+, Firefox 90+, Edge 92+) and Node.js 16+  
Requires global `crypto.getRandomValues` support (available by default)
