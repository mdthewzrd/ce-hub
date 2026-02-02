
# Access Control Middleware
from fastapi import Request, HTTPException
from fastapi.middleware import Middleware
import time
import json
from typing import List

class AccessControlMiddleware(Middleware):
    def __init__(self, app):
        super().__init__(app)
        self.load_access_control()

    def load_access_control(self):
        with open("access_control.json", "r") as f:
            self.config = json.load(f)

    async def dispatch(self, request: Request, call_next):
        # IP-based access control
        client_ip = request.client.host

        if client_ip not in self.config["whitelist"]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Rate limiting
        # Implementation here

        return await call_next(request)
