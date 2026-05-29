import os, logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from supabase import create_client, Client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
db: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY: db = create_client(SUPABASE_URL, SUPABASE_KEY)

QUIET_HOURS_START = 22
QUIET_HOURS_END = 8

def should_send_notification(user_tz: str = "UTC") -> bool:
    current_hour = datetime.now(timezone.utc).hour
    return not (QUIET_HOURS_START <= current_hour or current_hour < QUIET_HOURS_END)

def format_smart_notification(user_name: str, has_goals: bool = False, last_activity_hours: int = 0) -> str:
    base_msgs = [f"كيف يومك يا {user_name}؟ 💜", f"اشتقت لأخبارك يا {user_name}! 🌙", f"هل تريد أن تشاركني أحوالك؟ 💙", f"أنا هنا للاستماع يا {user_name} 🌟"]
    msg = base_msgs[hash(user_name) % len(base_msgs)]
    extras = []
    if has_goals: extras.append("أتذكر أن لديك مشاريع تنتظرك 🎯")
    if last_activity_hours > 24: extras.append(f"اشتقت إليك! كنت أفكر فيك 💫")
    return f"{msg} {' '.join(extras)}".strip()

def get_pending_notifications(limit: int = 100) -> List[Dict[str, Any]]:
    if not db: return []
    try:
        result = db.table("pending_notifications").select("*").limit(limit).execute()
        return result.data or []
    except Exception: return []

def mark_notification_sent(notification_id: str) -> bool:
    if not db: return False
    try:
        db.table("pending_notifications").update({"sent_at": datetime.now(timezone.utc).isoformat()}).eq("id", notification_id).execute()
        return True
    except Exception: return False
