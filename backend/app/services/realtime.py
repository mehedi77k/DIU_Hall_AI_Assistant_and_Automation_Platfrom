from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Iterable

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder


@dataclass(frozen=True)
class RealtimeClient:
    user_id: int
    role: str


class RealtimeConnectionManager:
    """Manage authenticated WebSocket clients for one backend process."""

    def __init__(self) -> None:
        self._clients: dict[WebSocket, RealtimeClient] = {}
        self._lock = asyncio.Lock()

    async def register(self, websocket: WebSocket, user_id: int, role: str) -> None:
        async with self._lock:
            self._clients[websocket] = RealtimeClient(user_id=user_id, role=role)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clients.pop(websocket, None)

    async def broadcast(
        self,
        event_type: str,
        payload: Any | None = None,
        *,
        user_ids: Iterable[int] | None = None,
        roles: Iterable[str] | None = None,
    ) -> None:
        """
        Broadcast an event to matching users/roles.

        When both user_ids and roles are omitted, the event is sent to every
        authenticated WebSocket client.
        """
        selected_user_ids = set(user_ids or [])
        selected_roles = set(roles or [])
        send_to_all = not selected_user_ids and not selected_roles

        message = jsonable_encoder(
            {
                "type": event_type,
                "payload": payload or {},
                "sent_at": datetime.now(timezone.utc),
            }
        )

        async with self._lock:
            targets = [
                websocket
                for websocket, client in self._clients.items()
                if send_to_all
                or client.user_id in selected_user_ids
                or client.role in selected_roles
            ]

        disconnected: list[WebSocket] = []

        for websocket in targets:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        if disconnected:
            async with self._lock:
                for websocket in disconnected:
                    self._clients.pop(websocket, None)

    async def connection_count(self) -> int:
        async with self._lock:
            return len(self._clients)


realtime_manager = RealtimeConnectionManager()
