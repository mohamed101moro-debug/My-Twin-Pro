import os, logging, requests
from typing import Dict, Optional

logger = logging.getLogger("smart_home")

HA_URL = os.getenv("HOME_ASSISTANT_URL", "").rstrip("/")
HA_TOKEN = os.getenv("HOME_ASSISTANT_TOKEN", "")

def call_service(service: str, entity_id: str, data: Optional[Dict] = None) -> bool:
    """استدعاء خدمة في Home Assistant."""
    if not HA_URL or not HA_TOKEN:
        logger.warning("Home Assistant غير مهيأ")
        return False
    try:
        domain, service_name = service.split(".")
        url = f"{HA_URL}/api/services/{domain}/{service_name}"
        headers = {
            "Authorization": f"Bearer {HA_TOKEN}",
            "Content-Type": "application/json",
        }
        payload = {"entity_id": entity_id}
        if data:
            payload.update(data)
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        return resp.status_code == 200
    except Exception as e:
        logger.error(f"Home Assistant error: {e}")
        return False

def get_device_state(entity_id: str) -> Optional[Dict]:
    """جلب حالة جهاز من Home Assistant."""
    if not HA_URL or not HA_TOKEN:
        return None
    try:
        url = f"{HA_URL}/api/states/{entity_id}"
        headers = {"Authorization": f"Bearer {HA_TOKEN}"}
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.error(f"Get state error: {e}")
    return None

def set_light_color(entity_id: str, color: str, brightness: int = 255) -> bool:
    """تغيير لون الإضاءة (يدعم WLED و Hue)."""
    # تحويل اسم اللون إلى RGB بسيط
    colors = {
        "أحمر": [255, 0, 0],
        "أخضر": [0, 255, 0],
        "أزرق": [0, 0, 255],
        "بنفسجي": [128, 0, 128],
        "أصفر": [255, 255, 0],
        "برتقالي": [255, 165, 0],
        "أبيض": [255, 255, 255],
    }
    rgb = colors.get(color, [255, 255, 255])
    return call_service("light.turn_on", entity_id, {
        "rgb_color": rgb,
        "brightness": brightness,
    })
