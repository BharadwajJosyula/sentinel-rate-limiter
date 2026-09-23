# 🛡️ Sentinel Rate Limiter

Sentinel is a lightweight **API rate limiter built with Node.js and TypeScript**.

The main idea behind this project is simple: **control how many requests a client can make within a certain period of time**, so an API doesn't get overwhelmed by too much traffic.

I built Sentinel as a practical project to understand how rate limiting works behind the scenes and how it can be used to protect APIs and backend services.

## Why I Built This

When an API is exposed to the internet, there is always a chance that a client can send too many requests.

That could happen because of:

* A badly configured application
* A sudden traffic spike
* An API client making requests too frequently
* Automated scripts or bots
* Attempts to abuse an endpoint

Instead of allowing every request to reach the backend, Sentinel sits in between and decides whether the request should be allowed or rejected.

The basic flow looks like this:

```text
Client
   │
   │ Request
   ▼
Sentinel Rate Limiter
   │
   ├── Limit available ──► Allow ──► API
   │
   └── Limit exceeded ──► 429 Too Many Requests
```

## 🚀 What It Does

At its core, Sentinel keeps track of requests and applies a configured limit.

For example, if an API allows:

```text
100 requests / 60 seconds
```

the first 100 requests can go through.

Once the client crosses that limit, Sentinel can reject additional requests with:

```text
HTTP 429 - Too Many Requests
```

This helps prevent unnecessary load from reaching the actual application.

## 🛠️ Tech Stack

The project currently uses:

* **Node.js** — Runtime
* **TypeScript** — Application development
* **npm** — Package management
* **Docker** — Containerization
* **Docker Compose** — Running the application in containers
* **Git/GitHub** — Version control

## 📁 Project Structure

```text
sentinel-rate-limiter/
│
├── src/
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

The project structure will continue to change as I add more features.

## ⚙️ Getting Started

Clone the repository:

```bash
git clone https://github.com/BharadwajJosyula/sentinel-rate-limiter.git
```

Go into the project:

```bash
cd sentinel-rate-limiter
```

Install the dependencies:

```bash
npm install
```

Then start the application using the available npm scripts.

For development, you can use:

```bash
npm run dev
```

## 🐳 Running with Docker

You can also run Sentinel using Docker.

Build the image:

```bash
docker build -t sentinel-rate-limiter .
```

Then run it:

```bash
docker run -p 3000:3000 sentinel-rate-limiter
```

Or use Docker Compose:

```bash
docker compose up --build
```

To stop it:

```bash
docker compose down
```

## 🧠 What I'm Learning From This Project

This project is more than just a rate limiter. I'm using it to understand some important backend concepts, including:

* API traffic management
* Middleware
* Request handling
* Distributed systems
* Concurrency
* Error handling
* Docker-based deployment
* Scalable backend architecture
* Monitoring and observability

I'm also using the project as a foundation for experimenting with different rate-limiting strategies.

## 🔨 What's Next

Some of the things I plan to explore as Sentinel grows:

* Different rate-limiting algorithms
* IP-based rate limiting
* User-based rate limiting
* API-key based limits
* Redis integration
* Distributed rate limiting
* Better logging and monitoring
* Metrics and dashboards
* Configuration through an API
* A simple web dashboard

The goal is to gradually turn Sentinel into something that can be used as a standalone rate-limiting service.

## 🔐 Security

Sentinel is intended to be one layer of API protection.

Rate limiting alone isn't enough for a secure application, so it should normally be combined with things like authentication, authorization, input validation, logging, and monitoring.

Also, never commit API keys, passwords, or other secrets to the repository.

## 🚧 Project Status

This project is **still under development**.

I'm building it step by step and using each stage to learn more about API infrastructure, backend systems, and scalable architectures.

Things may change as the project evolves.

## 🤝 Contributions

If you have an idea, find a bug, or want to experiment with the project, feel free to open an issue or submit a pull request.

## 👨‍💻 Author

**Bharadwaj Josyula**

GitHub: **[@BharadwajJosyula](https://github.com/BharadwajJosyula)**

---

⭐ If you find the project interesting, feel free to star the repository.

**Sentinel — keeping API traffic under control.**
