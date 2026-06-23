import Redis from 'ioredis';

interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetInMs: number;
    totalRequests: number;
    algorithm: string;
}

export class SlidingWindowRateLimiter {
    private redis: Redis;
    private windowMs: number;
    private maxRequests: number;

    constructor(redis: Redis, windowMs: number, maxRequests: number) {
        this.redis = redis;
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    async isAllowed(identifier: string): Promise<RateLimitResult> {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        const key = `sentinel:sliding:${identifier}`;

        const luaScript = `
            local key = KEYS[1]
            local now = tonumber(ARGV[1])
            local windowStart = tonumber(ARGV[2])
            local maxRequests = tonumber(ARGV[3])
            local windowMs = tonumber(ARGV[4])

            redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
            local currentCount = redis.call('ZCARD', key)

            if currentCount < maxRequests then
                redis.call('ZADD', key, now, now)
                redis.call('PEXPIRE', key, windowMs)
                return {1, currentCount + 1}
            else
                return {0, currentCount}
            end
        `;

        const result = await this.redis.eval(
            luaScript,
            1,
            key,
            now.toString(),
            windowStart.toString(),
            this.maxRequests.toString(),
            this.windowMs.toString()
        ) as [number, number];

        const allowed = result[0] === 1;
        const totalRequests = result[1];

        let resetInMs = this.windowMs;
        if (!allowed) {
            const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
            if (oldestRequest.length > 1) {
                const oldestTimestamp = parseFloat(oldestRequest[1]);
                resetInMs = Math.max(0, oldestTimestamp + this.windowMs - now);
            }
        }

        return {
            allowed,
            limit: this.maxRequests,
            remaining: Math.max(0, this.maxRequests - totalRequests),
            resetInMs: Math.round(resetInMs),
            totalRequests,
            algorithm: 'Sliding Window Log'
        };
    }
}
