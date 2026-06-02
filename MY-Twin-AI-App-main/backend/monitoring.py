from datetime import datetime

class AIMonitor:
    @staticmethod
    def log(db, uid, provider, task, latency, success, tokens):
        try:
            db.table("ai_metrics").insert({
                "user_id": uid,
                "provider": provider,
                "task_type": task,
                "latency_ms": latency,
                "success": success,
                "tokens_used": tokens
            }).execute()
        except Exception as e:
            print(f"Failed to log AI metric: {e}")
