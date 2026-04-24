# Coinché (Belote Coinchée) — Full-Stack Architecture

## 1. System Overview

Coinché is a real-time 4-player team card game (2v2). The architecture is designed for:
- **Server-authoritative game logic** (anti-cheat)
- **Real-time synchronization** via WebSockets
- **Horizontal scalability** via Redis pub/sub + message queues
- **Resilient reconnection** handling

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (React), Tailwind CSS, Socket.io-client, Framer Motion |
| Backend | NestJS (TypeScript), Socket.io, Passport JWT |
| Database | PostgreSQL (persistent), Redis (ephemeral state + pub/sub) |
| Queue | RabbitMQ (game event processing) |
| Infra | Docker, Docker Compose, Nginx |

## 3. Architecture Layers

### 3.1 API Layer (REST)
- Authentication (register, login, refresh tokens)
- User profiles
- Room creation/listing
- Game history queries

### 3.2 WebSocket Layer
- Real-time game events (card played, bid made, trick won)
- Room join/leave
- Chat messages
- Player presence (heartbeat)

### 3.3 Game Engine (Pure Logic)
- Stateless, testable functions
- Deck management, shuffling, dealing
- Bidding phase rules
- Trick resolution with trump logic
- Belote/Rebelote detection
- Score calculation (Capot, Coinche multipliers)

### 3.4 Game Manager (Orchestrator)
- Manages active game instances
- Coordinates state transitions
- Validates player actions
- Publishes events to RabbitMQ
- Persists state snapshots to Redis

### 3.5 Data Layer
- **PostgreSQL**: Users, game history, leaderboards
- **Redis**: Active game state, player sessions, room metadata, pub/sub for multi-instance sync

## 4. Scaling Strategy

```
                    ┌─────────────┐
                    │   Nginx LB  │
                    └──────┬──────┘
              ┌────────────┼────────────┐
         ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
         │ NestJS 1│  │ NestJS 2│  │ NestJS 3│
         └────┬────┘  └────┬────┘  └────┬────┘
              │            │            │
         ┌────┴────────────┴────────────┴────┐
         │         Redis Pub/Sub             │
         │    (cross-instance sync)          │
         └───────────────┬───────────────────┘
                         │
                    ┌────┴────┐
                    │ RabbitMQ│
                    └─────────┘
```

- **Sticky sessions** via Nginx (ip_hash) for WebSocket connections
- **Redis Pub/Sub** ensures game events reach all instances
- **RabbitMQ** decouples event processing from request handling
- Each NestJS instance can host multiple game rooms
- Redis stores the canonical game state (not in-memory only)

## 5. Player Disconnect/Reconnect Strategy

1. On disconnect, start a **30-second grace timer** (stored in Redis)
2. Player's seat is held; other players see "reconnecting..."
3. If the disconnected player's turn, a **turn timer** pauses
4. On reconnect:
   - Authenticate via JWT
   - Fetch full game state from Redis
   - Re-join the WebSocket room
   - Resume from where they left off
5. If timer expires:
   - Auto-play (pass on bids, play lowest legal card)
   - After 3 consecutive auto-plays, player is replaced by AI or game is forfeited

## 6. Anti-Cheat Measures

- **Server-authoritative**: Client never decides game outcomes
- Server validates every card play against legal moves
- Hands are never sent to other players' clients
- Card deck seed is server-generated (crypto-random)
- Rate limiting on WebSocket events
- JWT + session validation on every action

## 7. Room Management

- Rooms are created via REST API, stored in Redis with TTL
- Room states: `waiting` → `full` → `playing` → `finished`
- Invite links contain room ID + short-lived token
- Room auto-destroys after 30 minutes of inactivity
- Max 4 players, team assignment: seats 0,2 = Team A, seats 1,3 = Team B
