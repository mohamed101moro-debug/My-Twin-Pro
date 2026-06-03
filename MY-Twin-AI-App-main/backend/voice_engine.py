"""MyTwin – Emotional Voice Engine"""
import os, asyncio, logging, re
from typing import Dict, Optional
import httpx

logger = logging.getLogger(__name__)

class EmotionalVoiceEngine:

    EMOTION_PARAMS = {
        "neutral":   {"rate": "+0%",  "pitch": "+0Hz",  "volume": "+0%"},
        "happy":     {"rate": "+10%", "pitch": "+20Hz", "volume": "+5%"},
        "sad":       {"rate": "-15%", "pitch": "-30Hz", "volume": "-10%"},
        "excited":   {"rate": "+20%", "pitch": "+40Hz", "volume": "+10%"},
        "calm":      {"rate": "-10%", "pitch": "-10Hz", "volume": "-5%"},
        "angry":     {"rate": "+15%", "pitch": "+30Hz", "volume": "+15%"},
        "loving":    {"rate": "-5%",  "pitch": "+10Hz", "volume": "+0%"},
        "worried":   {"rate": "-5%",  "pitch": "-5Hz",  "volume": "-5%"},
        "surprised": {"rate": "+15%", "pitch": "+35Hz", "volume": "+10%"},
        "joy":       {"rate": "+10%", "pitch": "+20Hz", "volume": "+5%"},
        "fear":      {"rate": "-5%",  "pitch": "-5Hz",  "volume": "-5%"},
        "love":      {"rate": "-5%",  "pitch": "+10Hz", "volume": "+0%"},
    }

    GOOGLE_TTS_KEY  = os.getenv("GOOGLE_TTS_KEY", "")
    ELEVENLABS_KEY  = os.getenv("ELEVENLABS_API_KEY", "")

    def _clean_text(self, text: str) -> str:
        # إزالة الإيموجي — Python compatible
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"
            "\U0001F300-\U0001F5FF"
            "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF"
            "\U00002600-\U000027BF"
            "\U0001F900-\U0001F9FF"
            "\U00002B50"
            "]+",
            flags=re.UNICODE
        )
        text = emoji_pattern.sub('', text)
        text = re.sub(r'http\S+', 'رابط', text)
        text = re.sub(r'([ا-ي])\1{2,}', r'\1\1', text)
        return text.strip()

    async def _google_tts(self, text: str, emotion_config: Dict) -> Optional[bytes]:
        if not self.GOOGLE_TTS_KEY:
            return None
        try:
            rate_map = {
                "+0%": 1.0, "+10%": 1.1, "-15%": 0.85, "+20%": 1.2,
                "-10%": 0.9, "+15%": 1.15, "-5%": 0.95, "-20%": 0.8
            }
            pitch_map = {
                "+0Hz": 0.0, "+20Hz": 2.0, "-30Hz": -3.0, "+40Hz": 4.0,
                "-10Hz": -1.0, "+30Hz": 3.0, "+10Hz": 1.0,
                "-5Hz": -0.5, "+35Hz": 3.5, "-20Hz": -2.0
            }
            url = "https://texttospeech.googleapis.com/v1/text:synthesize"
            body = {
                "input": {"text": text},
                "voice": {
                    "languageCode": "ar-SA",
                    "name": "ar-SA-Standard-A",
                    "ssmlGender": "FEMALE",
                },
                "audioConfig": {
                    "audioEncoding": "MP3",
                    "pitch": pitch_map.get(emotion_config.get("pitch", "+0Hz"), 0.0),
                    "speakingRate": rate_map.get(emotion_config.get("rate", "+0%"), 1.0),
                },
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    url, json=body,
                    params={"key": self.GOOGLE_TTS_KEY},
                    timeout=15.0
                )
                if resp.status_code == 200:
                    import base64
                    audio = resp.json().get("audioContent", "")
                    return base64.b64decode(audio) if audio else None
                logger.error(f"Google TTS: {resp.status_code}")
                return None
        except Exception as e:
            logger.error(f"Google TTS error: {e}")
            return None

    async def _elevenlabs_tts(self, text: str, emotion_config: Dict) -> Optional[bytes]:
        if not self.ELEVENLABS_KEY:
            return None
        try:
            stability_map = {
                "calm": 0.85, "sad": 0.80, "neutral": 0.75,
                "happy": 0.65, "excited": 0.55, "angry": 0.50,
            }
            emotion_key = "neutral"
            for k in stability_map:
                if k in str(emotion_config):
                    emotion_key = k
                    break

            url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    url,
                    json={
                        "text": text,
                        "model_id": "eleven_monolingual_v1",
                        "voice_settings": {
                            "stability": stability_map.get(emotion_key, 0.75),
                            "similarity_boost": 0.75,
                        },
                    },
                    headers={"xi-api-key": self.ELEVENLABS_KEY},
                    timeout=15.0
                )
                if resp.status_code == 200:
                    return resp.content
                logger.error(f"ElevenLabs: {resp.status_code}")
                return None
        except Exception as e:
            logger.error(f"ElevenLabs error: {e}")
            return None

    async def synthesize(
        self, text: str, tier: str = "free",
        emotion: str = "neutral", language: str = "ar"
    ) -> Optional[bytes]:
        """تحويل النص لصوت حسب الباقة"""
        if tier == "free":
            return None  # الباقة المجانية بدون صوت

        clean = self._clean_text(text)
        config = self.EMOTION_PARAMS.get(emotion, self.EMOTION_PARAMS["neutral"])

        if tier in ["plus", "premium"]:
            return await self._google_tts(clean, config)

        if tier in ["pro", "yearly"]:
            result = await self._elevenlabs_tts(clean, config)
            if result:
                return result
            return await self._google_tts(clean, config)  # احتياطي

        return None

    def get_tts_params(self, emotion: str, calm: bool = False) -> Dict:
        """للتوافق مع emotional_engine.py"""
        if calm:
            return {"pitch": 0.80, "rate": 0.70}

        rate_map = {
            "+0%": 1.0, "+10%": 1.1, "-15%": 0.85, "+20%": 1.2,
            "-10%": 0.9, "+15%": 1.15, "-5%": 0.95, "-20%": 0.8
        }
        pitch_map = {
            "+0Hz": 1.0, "+20Hz": 1.05, "-30Hz": 0.85, "+40Hz": 1.1,
            "-10Hz": 0.95, "+30Hz": 1.08, "+10Hz": 1.02,
            "-5Hz": 0.98, "+35Hz": 1.09, "-20Hz": 0.9
        }
        params = self.EMOTION_PARAMS.get(emotion, self.EMOTION_PARAMS["neutral"])
        return {
            "pitch": pitch_map.get(params["pitch"], 1.0),
            "rate":  rate_map.get(params["rate"], 1.0),
        }

voice_engine = EmotionalVoiceEngine()
