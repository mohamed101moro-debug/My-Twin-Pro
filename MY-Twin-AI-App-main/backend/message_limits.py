"""
MyTwin - Message Limits & Referral System
نظام الرسائل اليومية + الإحالة + Bond ceiling
"""
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional, Dict
from cache import get, set as cache_set

# ── حدود الرسائل اليومية ─────────────────────────────
DAILY_MESSAGES = {
    "free":        15,
    "free_week1":  20,   # أسبوع العسل
    "free_week2":  17,
    "free_week3":  15,
    "plus":        50,
    "premium":     150,
    "pro":         500,
    "yearly":      9999, # غير محدود عملياً
}

# ── سقف الـ Bond حسب الباقة ──────────────────────────
BOND_CEILING = {
    "free":        28,   # أقصى 28% — يصل في 2-3 أسابيع
    "free_week1":  28,
    "free_week2":  28,
    "free_week3":  28,
    "plus":        70,
    "premium":     90,
    "pro":         100,
    "yearly":      100,
}

# ── نماذج AI حسب الباقة ──────────────────────────────
TIER_MODELS = {
    "free":     ["groq", "gemma4"],
    "plus":     ["groq", "llama4", "deepseek", "gemma4"],
    "premium":  ["groq", "llama4", "deepseek", "qwen", "minimax", "gemma4"],
    "pro":      ["groq", "llama4", "deepseek", "qwen", "minimax", "gemma4", "gptoss", "gemini"],
    "yearly":   ["groq", "llama4", "deepseek", "qwen", "minimax", "gemma4", "gptoss", "gemini"],
}

# ── ميزات مقفولة حسب الباقة ──────────────────────────
TIER_FEATURES = {
    "free": {
        "tts": False,
        "dreams": False,
        "coaching": False,
        "proactive": False,
        "long_memory": False,
        "weekly_report": False,
        "smart_home": False,
    },
    "plus": {
        "tts": True,
        "dreams": False,
        "coaching": False,
        "proactive": True,
        "long_memory": True,
        "weekly_report": False,
        "smart_home": False,
    },
    "premium": {
        "tts": True,
        "dreams": True,
        "coaching": True,
        "proactive": True,
        "long_memory": True,
        "weekly_report": True,
        "smart_home": False,
    },
    "pro": {
        "tts": True,
        "dreams": True,
        "coaching": True,
        "proactive": True,
        "long_memory": True,
        "weekly_report": True,
        "smart_home": True,
    },
    "yearly": {
        "tts": True,
        "dreams": True,
        "coaching": True,
        "proactive": True,
        "long_memory": True,
        "weekly_report": True,
        "smart_home": True,
    },
}

def _get_effective_tier(tier: str, signup_date: Optional[str] = None) -> str:
    """تحديد الباقة الفعلية مع مراعاة أسبوع العسل"""
    if tier == "free" and signup_date:
        try:
            signup = datetime.fromisoformat(signup_date)
            days = (datetime.now(timezone.utc) - signup).days
            if days < 7:  return "free_week1"
            if days < 14: return "free_week2"
            if days < 21: return "free_week3"
        except:
            pass
    return tier

def check_message_limit(uid: str, tier: str,
                         signup_date: Optional[str] = None) -> Tuple[bool, int, str]:
    """
    التحقق من حد الرسائل اليومي
    Returns: (allowed, remaining, reason)
    """
    effective = _get_effective_tier(tier, signup_date)
    today = datetime.now(timezone.utc).date().isoformat()
    key = f"msg:{uid}:{today}"

    used = get(key) or 0
    base_limit = DAILY_MESSAGES.get(effective, 15)

    # رصيد الإحالة — 5 رسائل إضافية يومياً لمدة أسبوع
    referral_bonus = _get_daily_referral_bonus(uid)
    limit = base_limit + referral_bonus

    if used >= limit:
        return False, 0, "daily_limit_reached"

    # تسجيل الاستخدام
    cache_set(key, used + 1, 86400)  # ينتهي بنهاية اليوم
    return True, limit - used - 1, "ok"

def _get_daily_referral_bonus(uid: str) -> int:
    """
    5 رسائل إضافية يومياً لمدة 7 أيام من تاريخ الإحالة
    الرصيد لا ينقل من يوم لآخر
    """
    referral_data = get(f"referral:{uid}")
    if not referral_data:
        return 0

    try:
        activated_at = datetime.fromisoformat(referral_data.get("activated_at", ""))
        days_since = (datetime.now(timezone.utc) - activated_at).days
        if days_since < 7:
            return 5  # 5 رسائل إضافية يومياً
    except:
        pass
    return 0

def activate_referral_bonus(uid: str) -> None:
    """تفعيل مكافأة الإحالة — 5 رسائل/يوم لمدة 7 أيام"""
    cache_set(f"referral:{uid}", {
        "activated_at": datetime.now(timezone.utc).isoformat(),
        "daily_bonus": 5,
        "duration_days": 7,
    }, 86400 * 7)

def get_bond_ceiling(tier: str, signup_date: Optional[str] = None) -> int:
    """سقف الـ Bond حسب الباقة"""
    effective = _get_effective_tier(tier, signup_date)
    return BOND_CEILING.get(effective, 28)

def apply_bond_ceiling(bond: float, tier: str,
                        signup_date: Optional[str] = None) -> float:
    """تطبيق سقف الـ Bond"""
    ceiling = get_bond_ceiling(tier, signup_date)
    return min(bond, float(ceiling))

def get_tier_models(tier: str) -> list:
    """نماذج AI المتاحة حسب الباقة"""
    base = tier.split("_")[0] if "_" in tier else tier
    return TIER_MODELS.get(base, TIER_MODELS["free"])

def get_tier_features(tier: str) -> dict:
    """الميزات المتاحة حسب الباقة"""
    base = tier.split("_")[0] if "_" in tier else tier
    return TIER_FEATURES.get(base, TIER_FEATURES["free"])

def get_usage_summary(uid: str, tier: str,
                       signup_date: Optional[str] = None) -> Dict:
    """ملخص الاستخدام للعرض في الواجهة"""
    effective = _get_effective_tier(tier, signup_date)
    today = datetime.now(timezone.utc).date().isoformat()
    used = get(f"msg:{uid}:{today}") or 0
    base_limit = DAILY_MESSAGES.get(effective, 15)
    referral_bonus = _get_daily_referral_bonus(uid)
    total_limit = base_limit + referral_bonus

    # وقت التجديد
    now = datetime.now(timezone.utc)
    midnight = (now + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    hours_until_reset = int((midnight - now).total_seconds() / 3600)

    return {
        "used": used,
        "limit": total_limit,
        "remaining": max(0, total_limit - used),
        "percentage": round((used / total_limit) * 100) if total_limit > 0 else 0,
        "referral_bonus_active": referral_bonus > 0,
        "referral_daily_bonus": referral_bonus,
        "bond_ceiling": get_bond_ceiling(tier, signup_date),
        "hours_until_reset": hours_until_reset,
        "effective_tier": effective,
        "features": get_tier_features(tier),
    }
