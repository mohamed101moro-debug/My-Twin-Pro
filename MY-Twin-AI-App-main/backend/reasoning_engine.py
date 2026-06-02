class ReasoningEngine:
    @staticmethod
    def explain(provider, task, memories, personality):
        reasons = []
        if memories:
            reasons.append("استندت إلى ذكرياتك السابقة لفهم سياق المحادثة بشكل أفضل")
        if personality:
            traits = personality.get("analyzed_traits", {})
            if traits.get("style") == "تحليلي":
                reasons.append("لاحظت أن شخصيتك تميل إلى التحليل، لذلك قدمت إجابة منطقية ومفصلة")
            if traits.get("communication") == "عاطفي":
                reasons.append("عرفت أن أسلوب تواصلك يميل إلى العاطفة، لذلك صغت الرد ليكون دافئاً")
        if task == "coding":
            reasons.append("هذا سؤال برمجي، لذا استخدمت نموذجاً متخصصاً في الكود")
        if not reasons:
            reasons.append("هذا رد عام بناءً على فهمي للسياق")
        return {
            "reply": "",
            "why": reasons
        }
