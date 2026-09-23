from typing import Dict, Any

class AIConsensusEngine:
    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights or {"openai": 0.35, "gemini": 0.35, "technical": 0.30}

    def evaluate_consensus(
        self,
        openai_res: Dict[str, Any],
        gemini_res: Dict[str, Any],
        technical_res: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compares:
        - OpenAI decision
        - Gemini decision
        - Technical analysis decision
        """
        op = openai_res.get("decision", "HOLD")
        gem = gemini_res.get("decision", "HOLD")
        tech = technical_res.get("decision", "HOLD")

        op_conf = openai_res.get("confidence", 50)
        gem_conf = gemini_res.get("confidence", 50)
        tech_conf = technical_res.get("confidence", 50)

        # Consensus Logic
        # Triple Agreement:
        if op == "LONG" and gem == "LONG" and tech == "LONG":
            final_consensus = "LONG"
            approved = True
            score = round((op_conf + gem_conf + tech_conf) / 3)
        elif op == "SHORT" and gem == "SHORT" and tech == "SHORT":
            final_consensus = "SHORT"
            approved = True
            score = round((op_conf + gem_conf + tech_conf) / 3)
        # 2/3 agreement without direct opposition
        elif (op == "LONG" and gem == "LONG") or (op == "LONG" and tech == "LONG" and gem != "SHORT") or (gem == "LONG" and tech == "LONG" and op != "SHORT"):
            final_consensus = "LONG"
            approved = True
            score = 75
        elif (op == "SHORT" and gem == "SHORT") or (op == "SHORT" and tech == "SHORT" and gem != "LONG") or (gem == "SHORT" and tech == "SHORT" and op != "LONG"):
            final_consensus = "SHORT"
            approved = True
            score = 75
        else:
            final_consensus = "NO TRADE"
            approved = False
            score = 40

        return {
            "openai_decision": op,
            "gemini_decision": gem,
            "technical_decision": tech,
            "final_consensus": final_consensus,
            "approved_for_risk_check": approved,
            "consensus_score": score
        }
