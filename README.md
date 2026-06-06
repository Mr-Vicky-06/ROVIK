<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Version-0.1.0-blue.svg?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge" alt="License" />

  <h1>🚀 ROVIK</h1>
  <h3>AI-Powered Real-Time Logistics Intelligence & Dispatch Orchestration</h3>
  
  <p>ROVIK is an enterprise-grade delivery management platform combining Combinatorial Optimization (VRP), Live Geospatial Tracking, and Local LLM intelligence to solve modern dispatch bottlenecks at scale.</p>
</div>

---

## ⚡ Overview

ROVIK is designed for fleet managers, dispatchers, and operations teams handling complex logistics networks. Unlike traditional tracking tools, ROVIK uses **Google OR-Tools** to calculate mathematically optimal routing permutations and provides an **AI Copilot** powered by local Large Language Models to diagnose SLA breaches on the fly.

### ✨ Key Features
- 🗺️ **Live Operations Grid:** Real-time geospatial tracking of riders using high-performance WebSockets and PostGIS.
- 🧠 **Combinatorial VRP Engine:** Route calculation, vehicle capacity enforcement, and dynamic ETA predictions using `ortools` and custom Python matrices.
- 🤖 **Local AI Copilot:** Ask questions about your fleet in natural language (e.g., "Why did Order 123 breach its SLA?") backed by pgvector RAG memory.
- 🌐 **Global Native Localization:** Deeply integrated dynamic language shifts spanning English, Hindi, Telugu, Marathi, and Bengali.
- 📊 **Telemetry Control:** Background WebSocket synchronizer running on Redis Pub/Sub, smoothing noisy GPS coordinates across distributed edge nodes.

---

## 🏗️ Architecture & Tech Stack

ROVIK is engineered for resilience, horizontal scalability, and instant real-time telemetry updates.

### 🌐 Frontend (Web Workspace)
- **Framework:** Next.js 14, React 18, TypeScript
- **State Management:** Zustand
- **Geospatial UI:** Leaflet, React-Leaflet
- **Styling:** TailwindCSS, Framer Motion, Lucide Icons

### ⚙️ Backend (Intelligence API)
- **API Framework:** FastAPI, Uvicorn, Python 3.11+
- **Data Engineering:** SQLAlchemy (Async), Pydantic
- **AI & VRP:** Langchain, Ollama (Llama 3), Google OR-Tools
- **Real-Time Mesh:** Starlette WebSockets

### 🗄️ Infrastructure (Data Foundation)
- **Primary Database:** PostgreSQL 16 with **PostGIS** for spatial indices and **pgvector** for RAG embeddings.
- **Message Broker:** Redis 7.2 (Pub/Sub for scaling WebSocket nodes horizontally).
- **OLAP Layer:** ClickHouse 24 (For massive telemetry ingestion and analytical queries).

---

## 📦 Local Development Setup

To run ROVIK locally, you must have **Docker Desktop** and **Node.js** installed.

### 1. Boot the Infrastructure
```bash
# Start Postgres, Redis, and ClickHouse
docker compose up -d
```

### 2. Start the FastAPI Intelligence Layer
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn routeiq.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Launch the Next.js Workspace
```bash
cd apps/web
npm install
npm run dev
```
Navigate to `http://localhost:3000` to access the dispatch console.

---

## 📈 Scalability Context

ROVIK was built to handle high-velocity data ingestion. 
1. **Edge Node Smoothing:** Rider telemetry is compressed and filtered at the edge before hitting the DB using a custom Haversine noise filter.
2. **WebSocket Horizontal Scaling:** The `routeiq.realtime` module uses a Redis backbone to ensure that multiple FastAPI instances can broadcast to thousands of clients without connection drops.
3. **Async Everything:** Fully non-blocking event loops using AsyncPG and Starlette.

---

<div align="center">
  <p>Crafted by <strong>Mr-Vicky-06</strong>. Changing the shape of global logistics.</p>
</div>
