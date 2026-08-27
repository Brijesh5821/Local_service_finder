import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from typing import Dict, List

class InMemoryRateLimiter:
    """
    Sliding window in-memory rate limiter per IP address for sensitive routes.
    """
    def __init__(self, requests_limit: int = 5, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        # Maps client_ip -> list of timestamps
        self.history: Dict[str, List[float]] = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        # Check standard reverse proxy headers
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP if comma separated
            return forwarded_for.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    def __call__(self, request: Request):
        client_ip = self._get_client_ip(request)
        now = time.time()
        cutoff = now - self.window_seconds

        # Clean timestamps older than the sliding window
        self.history[client_ip] = [ts for ts in self.history[client_ip] if ts > cutoff]

        if len(self.history[client_ip]) >= self.requests_limit:
            oldest_timestamp = self.history[client_ip][0]
            retry_after = int(self.window_seconds - (now - oldest_timestamp)) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many attempts. Please try again in {max(1, retry_after)} seconds.",
                headers={"Retry-After": str(max(1, retry_after))}
            )

        self.history[client_ip].append(now)


# Pre-configured rate limiters for sensitive endpoints
login_rate_limiter = InMemoryRateLimiter(requests_limit=10, window_seconds=60)
register_rate_limiter = InMemoryRateLimiter(requests_limit=10, window_seconds=60)
forgot_password_rate_limiter = InMemoryRateLimiter(requests_limit=5, window_seconds=60)
reset_password_rate_limiter = InMemoryRateLimiter(requests_limit=5, window_seconds=60)
