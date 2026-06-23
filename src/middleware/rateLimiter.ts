import { Request, Response, NextFunction } from 'express';
import { SlidingWindowRateLimiter } from '../algorithms/slidingWindow';
import { TokenBucketRateLimiter } from '../algorithms/tokenBucket';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10');

const slidingLimiter = new SlidingWindowRateLimiter(redis, WINDOW_MS, MAX_REQUESTS);
const tokenLimiter = new TokenBucketRateLimiter(redis, MAX_REQUESTS, MAX_REQUESTS / 60);

export function getIdentifier(req: Request): string {
    return (
        (req.headers['x-api-key'] as string) ||
        (req.headers['x-forwarded-for'] as string) ||
        req.ip ||
        'anonymous'
    );
}

async function logRequest(identifier: string, endpoint: string, allowed: boolean) {
    const key = `sentinel:analytics:${identifier}`;
    const logEntry = JSON.stringify({
        endpoint,
        allowed,
        timestamp: new Date().toISOString()
    });
    await redis.lpush(key, logEntry);
    await redis.ltrim(key, 0, 99);
    await redis.expire(key, 86400);
}

export function slidingWindowMiddleware(req: Request, res: Response, next: NextFunction) {
    const identifier = getIdentifier(req);

    slidingLimiter.isAllowed(identifier).then(async (result) => {
        res.setHeader('X-RateLimit-Limit', result.limit);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', result.resetInMs);
        res.setHeader('X-RateLimit-Algorithm', result.algorithm);

        await logRequest(identifier, req.path, result.allowed);

        if (!result.allowed) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Try again in ${(result.resetInMs / 1000).toFixed(1)}s`,
                algorithm: result.algorithm,
                retryAfterMs: result.resetInMs
            });
        }
        next();
    }).catch(() => next());
}

export function tokenBucketMiddleware(req: Request, res: Response, next: NextFunction) {
    const identifier = getIdentifier(req);

    tokenLimiter.isAllowed(identifier).then(async (result) => {
        res.setHeader('X-RateLimit-Limit', result.limit);
        res.setHeader('X-RateLimit-Remaining', result.tokensRemaining);
        res.setHeader('X-RateLimit-Algorithm', result.algorithm);

        await logRequest(identifier, req.path, result.allowed);

        if (!result.allowed) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Token bucket exhausted. Tokens refill over time.',
                algorithm: result.algorithm
            });
        }
        next();
    }).catch(() => next());
}

export { redis };
