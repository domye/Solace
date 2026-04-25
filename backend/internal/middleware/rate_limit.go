package middleware

import (
	"context"
	"sync"
	"time"

	apperrors "gin-quickstart/internal/pkg/errors"
	"github.com/gin-gonic/gin"
)

type client struct {
	count     int
	expiresAt time.Time
}

type RateLimiter struct {
	mu         sync.Mutex
	clients    map[string]*client
	maxReqs    int
	windowSize time.Duration
	ctx        context.Context
	cancel     context.CancelFunc
}

func NewRateLimiter(maxReqs int, windowSize time.Duration) *RateLimiter {
	ctx, cancel := context.WithCancel(context.Background())
	limiter := &RateLimiter{
		clients:    make(map[string]*client),
		maxReqs:    maxReqs,
		windowSize: windowSize,
		ctx:        ctx,
		cancel:     cancel,
	}

	go limiter.cleanupExpiredClients()

	return limiter
}

func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	c, exists := rl.clients[ip]

	if !exists || now.After(c.expiresAt) {
		rl.clients[ip] = &client{
			count:     1,
			expiresAt: now.Add(rl.windowSize),
		}
		return true
	}

	if c.count >= rl.maxReqs {
		return false
	}

	c.count++
	return true
}

func (rl *RateLimiter) cleanupExpiredClients() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-rl.ctx.Done():
			return
		case <-ticker.C:
			rl.mu.Lock()
			now := time.Now()
			for ip, c := range rl.clients {
				if now.After(c.expiresAt) {
					delete(rl.clients, ip)
				}
			}
			rl.mu.Unlock()
		}
	}
}

func (rl *RateLimiter) Stop() {
	rl.mu.Lock()
	rl.clients = nil
	rl.mu.Unlock()
	rl.cancel()
}

func RateLimit(limiter *RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()

		if !limiter.Allow(ip) {
			RespondWithError(c, apperrors.NewTooManyRequests("请求过于频繁，请稍后再试"))
			c.Abort()
			return
		}

		c.Next()
	}
}
