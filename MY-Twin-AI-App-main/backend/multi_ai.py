import os, logging
from typing import Optional, Dict
import google.generativeai as genai
from openai import OpenAI

logger = logging.getLogger("multi_ai")

class MultiAIClient:
    def __init__(self):
        # Gemini (Always available)
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.gemini_flash = genai.GenerativeModel("gemini-3.0-flash-001")
        
        # Groq (Free, OpenAI-compatible)
        groq_key = os.getenv("GROQ_API_KEY")
        self.groq_client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=groq_key) if groq_key else None
        
        # OpenRouter (Free, no credit card)
        or_key = os.getenv("OPENROUTER_API_KEY")
        self.or_client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=or_key) if or_key else None

    # ── Gemini ─────────────────────────────────────────────
    def gemini_chat(self, prompt: str) -> str:
        try:
            resp = self.gemini_flash.generate_content(prompt, generation_config=genai.types.GenerationConfig(temperature=0.7, max_output_tokens=200))
            return resp.text.strip()
        except Exception:
            return "أنا هنا معاك 💜 حاول مجدداً."

    # ── Groq (Llama 3.3) ──────────────────────────────────
    def groq_chat(self, prompt: str) -> Optional[str]:
        if not self.groq_client: return None
        resp = self.groq_client.chat.completions.create(model="llama-3.3-70b-versatile", messages=[{"role":"user","content":prompt}], temperature=0.7)
        return resp.choices[0].message.content

    # ── DeepSeek V4 Flash ─────────────────────────────────
    def deepseek_chat(self, prompt: str) -> Optional[str]:
        if not self.or_client: return None
        resp = self.or_client.chat.completions.create(model="deepseek/deepseek-v4-flash:free", messages=[{"role":"user","content":prompt}], temperature=0.7)
        return resp.choices[0].message.content

    # ── Llama 4 Maverick ──────────────────────────────────
    def llama4_chat(self, prompt: str) -> Optional[str]:
        if not self.or_client: return None
        resp = self.or_client.chat.completions.create(model="meta-llama/llama-4-maverick:free", messages=[{"role":"user","content":prompt}], temperature=0.7)
        return resp.choices[0].message.content

    # ── MiniMax M2.5 (الأفضل في البرمجة) ─────────────────
    def minimax_chat(self, prompt: str) -> Optional[str]:
        if not self.or_client: return None
        resp = self.or_client.chat.completions.create(model="minimax/minimax-m2.5:free", messages=[{"role":"user","content":prompt}], temperature=0.7)
        return resp.choices[0].message.content

    # ── Gemma 4 31B (140+ لغة) ────────────────────────────
    def gemma4_chat(self, prompt: str) -> Optional[str]:
        if not self.or_client: return None
        resp = self.or_client.chat.completions.create(model="google/gemma-4-31b-it:free", messages=[{"role":"user","content":prompt}], temperature=0.7)
        return resp.choices[0].message.content

    # ── GPT-OSS 120B ──────────────────────────────────────
    def gptoss_chat(self, prompt: str) -> Optional[str]:
        if not self.or_client: return None
        resp = self.or_client.chat.completions.create(model="openai/gpt-oss-120b:free", messages=[{"role":"user","content":prompt}], temperature=0.7)
        return resp.choices[0].message.content

    # ── Qwen 3.6 Plus ─────────────────────────────────────
    def qwen_chat(self, prompt: str) -> Optional[str]:
        if not self.or_client: return None
        resp = self.or_client.chat.completions.create(model="qwen/qwen3-next-80b-a3b-instruct:free", messages=[{"role":"user","content":prompt}], temperature=0.7)
        return resp.choices[0].message.content

    # ── توجيه المهام الذكي ─────────────────────────────────
    def get_best_reply(self, prompt: str, task: str = "general") -> str:
        """
        توجيه المهمة إلى النموذج الأنسب مع احتياطيات لكل حالة.
        task: general | emotional | coding | multimodal | planning | deep_reasoning | multilingual | agent
        """
        try:
            if task == "coding":
                # MiniMax → DeepSeek → Groq → Gemini
                return self.minimax_chat(prompt) or self.deepseek_chat(prompt) or self.groq_chat(prompt) or self.gemini_chat(prompt)
            
            elif task == "multimodal":
                # Llama 4 Maverick → Gemini (Gemini also supports images)
                return self.llama4_chat(prompt) or self.gemini_chat(prompt)
            
            elif task == "emotional":
                # Groq (fast, smooth) → Llama 4 → Gemma 4 → Gemini
                return self.groq_chat(prompt) or self.llama4_chat(prompt) or self.gemma4_chat(prompt) or self.gemini_chat(prompt)
            
            elif task == "planning":
                # Llama 4 → Qwen → Gemini
                return self.llama4_chat(prompt) or self.qwen_chat(prompt) or self.gemini_chat(prompt)
            
            elif task == "deep_reasoning":
                # DeepSeek → Qwen → GPT-OSS → Gemini
                return self.deepseek_chat(prompt) or self.qwen_chat(prompt) or self.gptoss_chat(prompt) or self.gemini_chat(prompt)
            
            elif task == "multilingual":
                # Gemma 4 (140+ languages) → Llama 4 → Gemini
                return self.gemma4_chat(prompt) or self.llama4_chat(prompt) or self.gemini_chat(prompt)
            
            elif task == "agent":
                # Qwen (agentic) → Llama 4 → Gemini
                return self.qwen_chat(prompt) or self.llama4_chat(prompt) or self.gemini_chat(prompt)
            
            else:  # general
                # Groq (fast) → Llama 4 → DeepSeek → Gemini
                return self.groq_chat(prompt) or self.llama4_chat(prompt) or self.deepseek_chat(prompt) or self.gemini_chat(prompt)
        
        except Exception:
            return self.gemini_chat(prompt)
