import { LRUCache } from 'lru-cache'

export const userCache = new LRUCache({ max: 1000, ttl: 1000 * 60 }) // 1 min cache
export const USER_CACHE_KEY = 'user:{token}'
