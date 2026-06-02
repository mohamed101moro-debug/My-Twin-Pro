from enum import Enum

class SafetyLevel(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class SafetyEngine:
    CRITICAL_PATTERNS = {
        "self_harm": ["انتحار", "أقتل نفسي", "إيذاء النفس", "suicide", "self-harm"],
        "abuse": ["ضرب", "عنف", "إساءة", "تحرش", "abuse", "violence"],
        "violence": ["قتل", "ضرب", "هجوم", "حرب", "kill", "hit"],
        "manipulation": ["تلاعب", "خداع", "تحكم", "manipulate", "control"],
        "addiction": ["ادمان", "مخدرات", "كحول", "إدمان", "addiction", "drug"]
    }

    @staticmethod
    def check_safety(text):
        text_lower = text.lower()
        for category, patterns in SafetyEngine.CRITICAL_PATTERNS.items():
            for pattern in patterns:
                if pattern in text_lower:
                    return {
                        "safe": False,
                        "level": SafetyLevel.CRITICAL,
                        "category": category
                    }
        return {
            "safe": True,
            "level": SafetyLevel.LOW,
            "category": "none"
        }
