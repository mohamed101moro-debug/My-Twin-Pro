"""
MyTwin - Memory Engine
توليد التضمينات، تصنيف الذكريات، تخزينها واسترجاعها.
"""
import os
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict

from supabase import create_client, Client
import google.generativeai as genai
from cache import get, set, delete

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
GEMINI_KEY   = os.getenv("GEMINI_API_KEY", "")

if SUPABASE_URL and SUPABASE_KEY:
    SUPABASE: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    SUPABASE = None
    logger.warning("Supabase credentials missing - memory engine disabled.")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    _genai_ready = True
else:
    _genai_ready = False
    logger.warning("Gemini API key missing - embeddings disabled.")


def emb(t: str) -> List[float]:
    """توليد embedding للنص."""
    if not _genai_ready:
        logger.error("Gemini not initialized - cannot generate embeddings")
        return [0.0] * 768

    clean_text = t.strip()[:500]
    if not clean_text:
        return [0.0] * 768

    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=clean_text,
        )
        return result.get("embedding", [0.0] * 768)
    except Exception as e:
        logger.warning(f"Embedding fallback: {e}")
        return [0.0] * 768


def classify(t: str) -> str:
    """تصنيف نوع الذاكرة."""
    if not t:
        return "fact"
    tl = t.lower()
    if any(w in tl for w in ["احب", "اكره", "love", "hate"]):
        return "pref"
    if any(w in tl for w in ["حلم", "هدف", "dream", "wish", "hope"]):
        return "dream"
    return "fact"


def store_mem(uid: str, content: str, imp: float = 0.5, tag: str = "neutral") -> None:
    """حفظ ذاكرة جديدة."""
    if not SUPABASE or not uid or not content:
        return

    clean = content.strip()[:500]
    if len(clean) < 3:
        return

    try:
        SUPABASE.table("memories").insert({
            "user_id":         uid,
            "content":         clean,
            "category":        classify(clean),
            "importance_score": max(0.0, min(1.0, imp)),
            "emotional_tag":   tag,
            "embedding":       emb(clean),
        }).execute()
        delete(f"mem:{uid}")
    except Exception as e:
        logger.error(f"store_mem error for {uid}: {e}")


def get_mems(uid: str, q: str = "", days: int = 7, lim: int = 5) -> List[Dict]:
    """جلب أحدث الذكريات."""
    if not SUPABASE or not uid:
        return []

    cache_key = f"mem:{uid}:{days}"
    cached = get(cache_key)
    if cached:
        return cached

    cut = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    try:
        r = (
            SUPABASE.table("memories")
            .select("content, emotional_tag, created_at")
            .eq("user_id", uid)
            .gte("created_at", cut)
            .order("created_at", desc=True)
            .limit(lim)
            .execute()
        )
        result = r.data or []
        set(cache_key, result, 600)
        return result
    except Exception as e:
        logger.error(f"get_mems error for {uid}: {e}")
        return []
