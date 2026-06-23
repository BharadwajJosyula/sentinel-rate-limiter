import express from 'express';
import { slidingWindowMiddleware, tokenBucketMiddleware, redis, getIdentifier } from './middleware/rateLimiter';

const app = express();
app.use(express.json());

app.get('/api/v1/sliding/data', slidingWindowMiddleware, (req, res) => {
    res.json({
        message: 'Request allowed (Sliding Window)',
        data: { temperature: 72.4, humidity: 45, server: 'US-EAST-1' },
        timestamp: new Date().toISOString()
    });
});

app.get('/api/v1/token/data', tokenBucketMiddleware, (req, res) => {
    res.json({
        message: 'Request allowed (Token Bucket)',
        data: { stockPrice: 182.63, ticker: 'AAPL', exchange: 'NASDAQ' },
        timestamp: new Date().toISOString()
    });
});

app.get('/api/v1/analytics/:identifier', async (req, res): Promise<any> => {
    const { identifier } = req.params;
    const key = `sentinel:analytics:${identifier}`;
    const rawLogs = await redis.lrange(key, 0, -1);

    if (!rawLogs.length) {
        return res.status(404).json({ error: 'No analytics found for this identifier' });
    }

    const logs = rawLogs.map(log => JSON.parse(log));
    const totalRequests = logs.length;
    const blockedRequests = logs.filter((l: any) => !l.allowed).length;
    const allowedRequests = logs.filter((l: any) => l.allowed).length;
    const blockRate = ((blockedRequests / totalRequests) * 100).toFixed(2);

    const endpointCount: Record<string, number> = {};
    logs.forEach((l: any) => {
        endpointCount[l.endpoint] = (endpointCount[l.endpoint] || 0) + 1;
    });

    return res.json({
        identifier,
        summary: { totalRequests, allowedRequests, blockedRequests, blockRate: `${blockRate}%` },
        endpointBreakdown: endpointCount,
        recentActivity: logs.slice(0, 10)
    });
});

app.get('/health', async (req, res) => {
    const redisPing = await redis.ping();
    res.json({
        status: 'operational',
        redis: redisPing === 'PONG' ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sentinel running on port ${PORT}`);
    console.log(`Sliding Window  → GET /api/v1/sliding/data`);
    console.log(`Token Bucket    → GET /api/v1/token/data`);
    console.log(`Analytics       → GET /api/v1/analytics/:identifier`);
    console.log(`Health          → GET /health`);
});
