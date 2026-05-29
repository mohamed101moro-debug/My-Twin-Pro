import os, hashlib
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
db: Client = None
if SUPABASE_URL and SUPABASE_KEY: db = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_referral_code(uid: str) -> str:
    return "MT" + hashlib.sha256(uid.encode()).hexdigest()[:6].upper()

def activate_referral(uid: str, code: str) -> dict:
    if not db: return {"error": "no_db"}
    owner = db.table("profiles").select("user_id").eq("referral_code", code.upper()).single().execute()
    if not owner.data or owner.data["user_id"] == uid:
        return {"error": "invalid_code"}
    # منح المستخدم الجديد مكافأة
    db.table("profiles").update({"referral_bonus": 500}).eq("user_id", uid).execute()
    return {"success": True, "bonus": 500, "inviter_id": owner.data["user_id"]}
