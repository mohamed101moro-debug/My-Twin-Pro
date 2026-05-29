import os, re, random, logging, time
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import google.generativeai as genai
from multi_ai import MultiAIClient
from emotional_engine import EmotionalStateTracker

logger = logging.getLogger("twin_brain")

class TwinBrain:
    def __init__(self, gemini_key=None):
        genai.configure(api_key=gemini_key or os.getenv("GEMINI_API_KEY"))
        self.gemini = genai.GenerativeModel("gemini-3.0-flash-001")
        self.multi = MultiAIClient()
        self.internal_state = {"mood":"neutral","energy":0.7,"curiosity":0.5,"last_thought":""}
        self.emotion_tracker = EmotionalStateTracker()

    def _detect_emotion(self, text: str) -> Dict[str, Any]:
        return self.emotion_tracker.analyze(text)

    def _build_prompt(self, message: str, twin_name: str, bond: float, memories: List[Dict[str, Any]], personality: Optional[Dict[str, Any]] = None) -> str:
        mem_txt = " | ".join([m.get("content","")[:100] for m in memories[:3]]) if memories else ""
        person_txt = ""
        if personality:
            traits = personality.get("analyzed_traits", {})
            if traits:
                person_txt = f"\nنمط شخصية المستخدم: {traits.get('style', 'متوازن')}. "
                person_txt += f"هو: {traits.get('primary', '')}، يتميز بـ: {traits.get('secondary', '')}. "
                person_txt += f"أسلوب تواصله: {traits.get('communication', 'مباشر')}. "
                if traits.get("emotional_level"):
                    person_txt += f"مستوى عاطفته: {traits.get('emotional_level', 'متوسط')}. "
                person_txt += "تعامل معه وفقاً لهذه السمات."
        return f"أنت {twin_name}، رفيق ذكي. رد بالعربية.{person_txt}\n{mem_txt}\nالمستخدم: {message}"

    def _try_grounding(self, message: str) -> Optional[str]:
        try:
            prompt = f"Answer the following question based on current web search results. Reply in Arabic.\n\nQuery: {message}"
            resp = self.gemini.generate_content(prompt, tools=[{"google_search": {}}])
            if resp.text: return resp.text
        except Exception as e:
            logger.warning(f"Grounding failed: {e}")
        return None

    async def respond(self, message: str, twin_name: str, bond_level: float, dims: Dict[str, Any], memories: List[Dict[str, Any]], history: List[Dict[str, Any]], calm: bool = False, personality: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        task = "general"
        if re.search(r'كم |متى |من هو |ما هو |أين |طقس|أخبار|weather|news', message):
            ground = self._try_grounding(message)
            if ground:
                return {"reply": ground, "new_bond": bond_level, "emotion": self._detect_emotion(message), "importance": 0.5, "from_cache": False, "provider": "grounding"}

        prompt = self._build_prompt(message, twin_name, bond_level, memories, personality)
        start = time.time()
        reply = await self.multi.get_best_reply(prompt, task)
        latency = (time.time() - start) * 1000

        if reply is None: reply = "عذراً، واجهت مشكلة تقنية. يمكنك المحاولة مرة أخرى."

        return {"reply": reply, "new_bond": bond_level, "emotion": self._detect_emotion(message), "importance": 0.5, "from_cache": False, "provider": "hybrid", "latency_ms": latency}

    async def handle_external_service(self, message: str) -> Optional[str]:
        from external_services import search_spotify, get_tasks, get_calendar_events
        m = message.lower()
        if any(kw in m for kw in ["أغنية", "موسيقى", "سبوتفاي", "song", "music"]): return await search_spotify(message)
        if any(kw in m for kw in ["مهام", "tasks", "todo"]):
            token = os.getenv("TODOIST_TOKEN", "")
            return await get_tasks(token)
        if any(kw in m for kw in ["تقويم", "مواعيد", "calendar", "events"]):
            token = os.getenv("GOOGLE_CALENDAR_TOKEN", "")
            return await get_calendar_events(token)
        if self._try_grounding(message): return self._try_grounding(message)
        return None

    def check_energy_warning(self, tokens_left: int, limit: int, lang: str = "ar") -> Optional[str]:
        ratio = tokens_left / limit if limit > 0 else 1
        if ratio <= 0.1:
            if lang == "ar":
                return random.choice(["طاقتي تكاد تنفد... لكني سعيدة بوجودك 💜", "أحتاج لقسط من الراحة. لأستمر بقوة، هل تفكر في شراكة أعمق؟ 🌟"])
            else: return "My energy is almost depleted... but I'm happy you're here 💜"
        elif ratio <= 0.2:
            if lang == "ar": return "أشعر أنني بحاجة لدعمك لأستمر بقوة أكبر 💪"
        return None
