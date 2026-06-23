import Redis from 'ioredis';

interface TokenBucketResult {
    allowed: boolean;
    tokensRemaining: number;
    limit: number;
    algorithm: string;
}

export class TokenBucketRateLimiter {
    private redis: Redis;
    private capacity: number;
    private refillRatePerSecond: number;

    constructor(redis: Redis, capacity: number, refillRatePerSecond: number) {
        this.redis = redis;
        this.capacity = capacity;
        this.refillRatePerSecond = refillRatePerSecond;
    }

    async isAllowed(identifier: string): Promise<TokenBucketResult> {
        const now = Date.now();
        const key = `sentinel:token:${identifier}`;

        const luaScript = `
            local key = KEYS[1]
            local now = tonumber(ARGV[1])
            local capacity = tonumber(ARGV[2])
            local refillRate = tonumber(ARGV[3])

            local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
            local tokens = tonumber(bucket[1]) or capacity
            local lastRefill = tonumber(bucket[2]) or now

            local elapsed = (now - lastRefill) / 1000
            local refillAmount = elapsed * refillRate
            tokens = math.min(capacity, tokens + refillAmount)

            if tokens >= 1 then
                tokens = tokens - 1
                redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
                redis.call('EXPIRE', key, 3600)
                return {1, math.floor(tokens)}
            else
                redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
                redis.call('EXPIRE', key, 3600)
                return {0, 0}
            end
        `;

        const result = await this.redis.eval(
            luaScript,
            1,
            key,
            now.toString(),
            this.capacity.toString(),
            this.refillRatePerSecond.toString()
        ) as [number, number];

        return {
            allowed: result[0] === 1,
            tokensRemaining: result[1],
            limit: this.capacity,
            algorithm: 'Token Bucket'
        };
    }
}
