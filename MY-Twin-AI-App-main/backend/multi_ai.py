import os, logging, asyncio
from typing import Optional
import google.generativeai as genai
from openai import OpenAI

logger = logging.getLogger("multi_ai")

class MultiAIClient:
    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        # إصلاح اسم الموديل
        self.gemini_flash = genai.GenerativeModel("gemini-2.0-flash")

        groq_key = os.getenv("GROQ_API_KEY")
        self.groq_client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_key
        ) if groq_key else None

        or_key = os.getenv("OPENROUTER_API_KEY")
        self.or_client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=or_key
        ) if or_key else None

    def gemini_chat(self, prompt: str) -> str:
        try:
            resp = self.gemini_flash.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7, max_output_tokens=300
                )
            )
            return resp.text.strip()
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            return "أنا هنا معاك 💜"

    def _or_chat(self, model: str, prompt: str) -> Optional[str]:
        if not self.or_client:
            return None
        try:
            resp = self.or_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=300,
                timeout=15,
            )
            return resp.choices[0].message.content
        except Exception as e:
            logger.warning(f"OpenRouter [{model}] error: {e}")
            return None

    def _groq_chat(self, model: str, prompt: str) -> Optional[str]:
        if not self.groq_client:
            return None
        try:
            resp = self.groq_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=300,
                timeout=15,
            )
            return resp.choices[0].message.content
        except Exception as e:
            logger.warning(f"Groq [{model}] error: {e}")
            return None

    # ── النماذج الفردية ─────────────────────────────────────
    def groq_chat(self, prompt: str) -> Optional[str]:
        return self._groq_chat("llama-3.3-70b-versatile", prompt)

    def llama4_chat(self, prompt: str) -> Optional[str]:
        return self._or_chat("meta-llama/llama-4-maverick:free", prompt)

    def minimax_chat(self, prompt: str) -> Optional[str]:
        return self._or_chat("minimax/minimax-m2.5:free", prompt)

    def deepseek_chat(self, prompt: str) -> Optional[str]:
        return self._or_chat("deepseek/deepseek-v4-flash:free", prompt)

    def gemma4_chat(self, prompt: str) -> Optional[str]:
        return self._or_chat("google/gemma-3-27b-it:free", prompt)

    def gptoss_chat(self, prompt: str) -> Optional[str]:
        return self._or_chat("openai/gpt-4o-mini:free", prompt)

    def qwen_chat(self, prompt: str) -> Optional[str]:
        return self._or_chat("qwen/qwen2.5-72b-instruct:free", prompt)

    # ── توجيه المهام مع الاحتياطي ────────────────────────────
    async def get_best_reply(self, prompt: str, task: str = "general") -> str:
        loop = asyncio.get_running_loop()

        # تحديد ترتيب النماذج حسب المهمة
        chains = {
            "general":       [self.groq_chat, self.llama4_chat, self.deepseek_chat, self.gemini_chat],
            "emotional":     [self.groq_chat, self.llama4_chat, self.gemma4_chat, self.gemini_chat],
            "coding":        [self.minimax_chat, self.deepseek_chat, self.groq_chat, self.gemini_chat],
            "multimodal":    [self.llama4_chat, self.gemini_chat],
            "planning":      [self.llama4_chat, self.qwen_chat, self.gemini_chat],
            "deep_reasoning":[self.deepseek_chat, self.qwen_chat, self.gptoss_chat, self.gemini_chat],
            "multilingual":  [self.gemma4_chat, self.llama4_chat, self.gemini_chat],
            "agent":         [self.qwen_chat, self.llama4_chat, self.gemini_chat],
        }

        selected = chains.get(task, chains["general"])

        for model_fn in selected:
            try:
                result = await loop.run_in_executor(None, model_fn, prompt)
                if result and len(result.strip()) > 5:
                    logger.info(f"✅ Task [{task}] → {model_fn.__name__}")
                    return result.strip()
            except Exception as e:
                logger.warning(f"⚠️ {model_fn.__name__} failed: {e}")
                continue

        # احتياطي نهائي
        return self.gemini_chat(prompt)
