"""
MyTwin – Cleanup Job
"""
import os, logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from supabase import create_client, Client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    SUPABASE = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    logger.warning("Supabase credentials missing – cleanup disabled.")

RETENTION_DAYS = {
    "free": 3, "free_trial_14d": 3, "premium_trial": 20,
    "premium": 30, "pro": 90, "yearly": 365,
}

def run(dry: bool = False) -> Dict[str, Any]:
    if not SUPABASE: return {"error": "supabase_unavailable"}
    res: Dict[str, Any] = {"emergency": False, "tiers_cleaned": 0, "total_deleted": 0, "err": []}
    try:
        cnt_result = SUPABASE.table("memories").select("id", count="exact").execute()
        total_count = cnt_result.count or 0
        if total_count > 40000:
            res["emergency"] = True
            if not dry:
                cut = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
                del_result = SUPABASE.table("memories").delete().lt("created_at", cut).execute()
                res["total_deleted"] = len(del_result.data) if del_result.data else 0
        for tier, days in RETENTION_DAYS.items():
            cut = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
            users_result = SUPABASE.table("profiles").select("user_id").eq("tier", tier).execute()
            uids = [u["user_id"] for u in (users_result.data or [])]
            if not uids: continue
            if not dry:
                del_result = SUPABASE.table("memories").delete().in_("user_id", uids).lt("created_at", cut).execute()
                deleted = len(del_result.data) if del_result.data else 0
                res["total_deleted"] = res["total_deleted"] + deleted
                res["tiers_cleaned"] = res["tiers_cleaned"] + 1
        return res
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        res["err"].append(str(e))
        return res
