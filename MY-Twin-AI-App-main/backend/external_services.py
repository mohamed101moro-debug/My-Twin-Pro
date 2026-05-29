import os, logging, base64, asyncio
from typing import Optional
from datetime import datetime, timezone, timedelta
import httpx

logger = logging.getLogger(__name__)

class SpotifyClient:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID", "")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET", "")
        self._token = None
        self._token_expiry = None

    async def _get_token(self) -> Optional[str]:
        if not self.client_id or not self.client_secret: return None
        if self._token and self._token_expiry and datetime.now(timezone.utc) < self._token_expiry: return self._token
        auth = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://accounts.spotify.com/api/token", headers={"Authorization": f"Basic {auth}"}, data={"grant_type": "client_credentials"}, timeout=10.0)
            if resp.status_code != 200: return None
            self._token = resp.json().get("access_token")
            self._token_expiry = datetime.now(timezone.utc) + timedelta(seconds=3600 - 60)
            return self._token

    async def search(self, query: str) -> str:
        token = await self._get_token()
        if not token: return ""
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://api.spotify.com/v1/search", headers={"Authorization": f"Bearer {token}"}, params={"q": query, "type": "track", "limit": 1}, timeout=10.0)
            if resp.status_code == 200:
                tracks = resp.json().get("tracks", {}).get("items", [])
                if tracks: return f"🎵 {tracks[0]['name']} - {tracks[0]['artists'][0]['name']}\n🔗 {tracks[0]['external_urls']['spotify']}"
        return ""

spotify_client = SpotifyClient()
async def search_spotify(query: str) -> str: return await spotify_client.search(query)

async def get_tasks(token: str) -> str:
    if not token: return "يحتاج ربط حساب Todoist."
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://api.todoist.com/rest/v2/tasks", headers={"Authorization": f"Bearer {token}"}, params={"filter": "today | overdue"}, timeout=10.0)
        if resp.status_code == 200:
            tasks = resp.json()
            if not tasks: return "لا توجد مهام اليوم 🎉"
            return "✅ مهامك:\n" + "\n".join(f"• {t['content']}" for t in tasks[:10])
    return ""

async def get_calendar_events(token: str) -> str:
    if not token: return "يحتاج ربط Google Calendar."
    now = datetime.now(timezone.utc).isoformat() + "Z"
    end = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat() + "Z"
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://www.googleapis.com/calendar/v3/calendars/primary/events", headers={"Authorization": f"Bearer {token}"}, params={"timeMin": now, "timeMax": end, "maxResults": 5, "singleEvents": True, "orderBy": "startTime"}, timeout=10.0)
        if resp.status_code == 200:
            events = resp.json().get("items", [])
            if not events: return "لا توجد أحداث اليوم."
            return "📅 أحداث اليوم:\n" + "\n".join(f"• {e.get('summary','?')}" for e in events[:5])
    return ""
