from datetime import datetime, timezone
from typing import Tuple, Optional
from cache import get, set as cache_set

BASE_TOK = {
    "free": 500, "free_week1": 1500, "free_week2": 1000, "free_week3": 700,
    "plus": 1500, "premium": 4000, "pro": 7000, "yearly": 15000,
}

def _get_effective_tier(tier: str, signup_date: Optional[str] = None) -> str:
    if tier == "free" and signup_date:
        try:
            signup = datetime.fromisoformat(signup_date)
            days = (datetime.now(timezone.utc) - signup).days
            if days < 7: return "free_week1"
            elif days < 14: return "free_week2"
            elif days < 21: return "free_week3"
        except: pass
    return tier

def check_tok(uid: str, tier: str, est: int, signup_date: Optional[str] = None, trial_start: Optional[str] = None) -> Tuple[bool, int]:
    effective = _get_effective_tier(tier, signup_date)
    key = f"tok:{uid}:{datetime.now(timezone.utc).date().isoformat()}"
    used = get(key) or 0
    limit = BASE_TOK.get(effective, 500)
    bonus = get(f"referral_bonus:{uid}") or 0
    limit += bonus
    if used + est > limit:
        return False, max(0, limit - used)
    cache_set(key, used + est, 86400)
    return True, limit - used - est

def add_referral_bonus(uid: str, amount: int = 500):
    key = f"referral_bonus:{uid}"
    current = get(key) or 0
    cache_set(key, current + amount, 86400 * 30)
