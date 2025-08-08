import os
import re
from datetime import datetime
from typing import List, Literal, Optional, Dict, Any

from flask import Flask, jsonify, request, Response
from flask_cors import CORS

# --------- Data Schema Types (doc only) ---------
StageLiteral = Literal[
    "Novo", "Qualificacao", "Diagnostico", "Proposta", "Negociacao", "Fechamento", "PosVenda"
]

ICPFitLiteral = Literal["Alto", "Medio", "Baixo"]
IntentLiteral = Literal["Alto", "Medio", "Baixo"]
UrgencyLiteral = Literal["Alta", "Media", "Baixa"]
BudgetSignalLiteral = Literal["Presente", "Inexistente", "Indireto"]
DecisionMakerLiteral = Literal["Sim", "Nao", "Desconhecido"]

# --------- Heuristics & Utilities ---------

PAIN_PATTERNS = [
    r"(gastando|custo|caro|custa|desperd[ií]cio)",
    r"(retrabalho|inefici[eê]ncia|demorado)",
    r"(churn|perda de clientes)",
    r"(convers[aã]o baixa|taxa baixa)",
]

OBJECTION_MAP = {
    "preco": [r"caro", r"pre[çc]o", r"muito alto", r"sem verba", r"sem or[çc]amento"],
    "tempo": [r"sem tempo", r"depois", r"pr[óo]ximo trimestre", r"agora n[ãa]o"],
    "autoridade": [r"(falar|conversar) com (meu|minha) (chefe|gerente|diretor)", r"preciso de aprova[çc][aã]o"],
    "prioridade": [r"prioridade", r"n[ãa]o [eé] prioridade"],
    "risco": [r"risco", r"medo", r"incerteza"],
}

BUDGET_PATTERNS = [
    r"\bR\$\s?\d+[\.,]?\d*", r"\$\s?\d+[\.,]?\d*", r"\b\d+\s?(k|mil|k\/m|\/mês|\/mes)\b", r"or[çc]amento", r"budget"
]

DECISION_PATTERNS = [
    r"sou o decisor", r"posso aprovar", r"eu aprovo", r"preciso do gerente", r"meu chefe decide", r"compras decide"
]

INTENT_PATTERNS = [
    r"enviar (a )?proposta", r"manda (a )?proposta", r"vamos fechar", r"quero contratar", r"agendar demo", r"marcar call",
    r"comparando (fornecedores|concorrentes)", r"testar", r"piloto", r"POC"
]

STAGE_RULES = [
    ("Fechamento", [r"(assinar|assinei) contrato", r"pagamento efetuado", r"(vamos )?fechar hoje"]),
    ("Negociacao", [r"desconto", r"ajustar pre[çc]o|escopo", r"condi[çc][oõ]es", r"negociar"]),
    ("Proposta", [r"enviar (a )?proposta", r"manda (a )?proposta", r"proposta", r"cotação", r"or[çc]amento detalhado"]),
    ("Diagnostico", [r"entender problema", r"mapear requisitos", r"contexto t[eé]cnico", r"descobrir causa"]),
    ("Qualificacao", [r"or[çc]amento", r"decisor", r"prazo", r"dor", r"qualificar"]),
    ("Novo", [r"oi", r"ol[aá]", r"cheguei", r"interesse"])    
]

TIME_URGENCY = [
    (r"este m[eê]s|m[êe]s atual|fim do m[eê]s|ainda este m[eê]s|m[eê]s que vem|30 dias|4 semanas|2 semanas|15 dias|amanh[ãa]|hoje", "Alta"),
    (r"pr[óo]ximo trimestre|quarter|60 dias|90 dias|m[êe]s que vem", "Media"),
]

COMPARE_PATTERNS = [r"concorrente", r"fornecedor", r"comparando", r"alternativas", r"or[çc]amentos"]

RE_SUMMARY_CLEAN = re.compile(r"\s+", re.MULTILINE)


def compile_patterns(patterns: List[str]) -> List[re.Pattern]:
    return [re.compile(p, re.IGNORECASE) for p in patterns]

# Precompile
PAIN_REGEX = [re.compile(p, re.IGNORECASE) for p in PAIN_PATTERNS]
OBJECTION_REGEX = {k: compile_patterns(v) for k, v in OBJECTION_MAP.items()}
BUDGET_REGEX = [re.compile(p, re.IGNORECASE) for p in BUDGET_PATTERNS]
DECISION_REGEX = [re.compile(p, re.IGNORECASE) for p in DECISION_PATTERNS]
INTENT_REGEX = [re.compile(p, re.IGNORECASE) for p in INTENT_PATTERNS]
STAGE_REGEX = [(s, compile_patterns(ps)) for s, ps in STAGE_RULES]
TIME_URGENCY_REGEX = [(re.compile(p, re.IGNORECASE), lvl) for p, lvl in TIME_URGENCY]
COMPARE_REGEX = [re.compile(p, re.IGNORECASE) for p in COMPARE_PATTERNS]

# --------- App ---------
app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})

# --------- Core Logic (mesmo que antes) ---------

def detect_stage(transcript: str) -> tuple[StageLiteral, float, List[str]]:
    hits = []
    for stage, patterns in STAGE_REGEX:
        for pat in patterns:
            if pat.search(transcript):
                hits.append(stage)
                break
    priority = {name: i for i, (name, _) in enumerate(STAGE_RULES)}
    if not hits:
        return "Novo", 0.35, []
    top = min(hits, key=lambda s: priority[s])
    confidence = 0.8 if top in ("Proposta", "Negociacao", "Fechamento") else 0.6
    return top, confidence, hits


def detect_pain_points(transcript: str) -> List[str]:
    pains = set()
    for reg in PAIN_REGEX:
        m = reg.search(transcript)
        if m:
            pains.add(m.group(0))
    return list(pains)[:3]


def detect_objections(transcript: str) -> List[str]:
    found = []
    for label, regs in OBJECTION_REGEX.items():
        for r in regs:
            if r.search(transcript):
                found.append(label)
                break
    return found


def detect_urgency(transcript: str) -> UrgencyLiteral:
    for reg, lvl in TIME_URGENCY_REGEX:
        if reg.search(transcript):
            return lvl  # type: ignore
    return "Baixa"


def detect_budget_signal(transcript: str) -> BudgetSignalLiteral:
    any_num = False
    for reg in BUDGET_REGEX:
        if reg.search(transcript):
            if re.search(r"\d", reg.pattern):
                any_num = True
            else:
                return "Indireto"
    if any_num:
        return "Presente"
    return "Inexistente"


def detect_decision_maker(transcript: str) -> DecisionMakerLiteral:
    positive = [r"sou o decisor", r"eu decido", r"posso aprovar", r"eu aprovo"]
    negative = [r"meu chefe decide", r"preciso do gerente", r"aprova[çc][aã]o do gerente|compras"]
    for p in compile_patterns(positive):
        if p.search(transcript):
            return "Sim"
    for n in compile_patterns(negative):
        if n.search(transcript):
            return "Nao"
    return "Desconhecido"


def detect_intent(transcript: str) -> IntentLiteral:
    strong = [r"vamos fechar", r"quero contratar", r"enviar (a )?proposta", r"agendar demo", r"POC|piloto"]
    medium = [r"avaliando", r"entender melhor", r"conhecer"]
    for p in compile_patterns(strong):
        if p.search(transcript):
            return "Alto"
    for p in compile_patterns(medium):
        if p.search(transcript):
            return "Medio"
    return "Baixo"


def detect_icp_fit(metadata: Dict[str, Any]) -> ICPFitLiteral:
    seg = str(metadata.get("segmento", "")).lower()
    size = str(metadata.get("tamanho_empresa", "")).lower()
    if any(k in seg for k in ["saas", "ecommerce", "fintech"]) or any(k in size for k in ["100-", "100-500", ">500", "enterprise", "medio"]):
        return "Alto"
    if seg:
        return "Medio"
    return "Baixo"


def compute_lead_score(transcript: str, urgency: UrgencyLiteral, budget: BudgetSignalLiteral, decision: DecisionMakerLiteral) -> int:
    score = 0
    if detect_pain_points(transcript) and urgency == "Alta":
        score += 20
    if budget == "Presente":
        score += 15
    if decision == "Sim":
        score += 10
    if any(r.search(transcript) for r in COMPARE_REGEX):
        score += 10
    if any(r.search(transcript) for r in OBJECTION_REGEX["prioridade"]):
        score -= 10
    return max(0, min(100, score))


def summarize_pt(transcript: str) -> str:
    words = RE_SUMMARY_CLEAN.sub(" ", transcript).strip().split()
    return " ".join(words[:30])[:240]


def build_next_best_actions(stage: StageLiteral, intent: IntentLiteral, decision: DecisionMakerLiteral, objections: List[str], urgency: UrgencyLiteral) -> List[Dict[str, Any]]:
    actions: List[Dict[str, Any]] = []
    if stage in ("Novo", "Qualificacao"):
        actions.append({"action": "Perguntar", "when": "agora", "owner": "Sales", "notes": "Qualificar: dor, prazo, orçamento, autoridade"})
        actions.append({"action": "Agendar_diagnostico", "when": "48h", "owner": "Sales", "notes": "Call 30-45min"})
    elif stage == "Diagnostico":
        actions.append({"action": "Agendar_demo", "when": "72h" if urgency != "Alta" else "24h", "owner": "Sales", "notes": "Mostrar solução alinhada à dor"})
    elif stage == "Proposta":
        actions.append({"action": "Enviar_proposta", "when": "hoje", "owner": "SalesOps", "notes": "Proposta base com ROI"})
    elif stage == "Negociacao":
        actions.append({"action": "Tratar_objecoes", "when": "24h", "owner": "Sales", "notes": ",".join(objections) or "Preço/Tempo"})
    elif stage == "Fechamento":
        actions.append({"action": "Coletar_assinatura", "when": "hoje", "owner": "Sales", "notes": "DocuSign"})
    if decision != "Sim":
        actions.append({"action": "Envolver_decisor", "when": "24-48h", "owner": "Sales", "notes": "Convidar gerente/Compras"})
    return actions[:3]


def build_tasks(stage: StageLiteral, decision: DecisionMakerLiteral, complete_diagnosis: bool) -> List[Dict[str, Any]]:
    tasks: List[Dict[str, Any]] = []
    if stage in ("Novo", "Qualificacao"):
        tasks.append({"title": "Marcar call de diagnóstico", "due_in_hours": 48, "priority": "High"})
    if decision != "Sim":
        tasks.append({"title": "Identificar e incluir decisor", "due_in_hours": 48, "priority": "High"})
    if stage == "Proposta":
        tasks.append({"title": "Gerar proposta base e anexar cases", "due_in_hours": 12, "priority": "High"})
    return tasks

# --------- Routes ---------
@app.get("/health")
def health():
    return jsonify({"status": "ok", "ts": datetime.utcnow().isoformat()})

@app.post("/analyze")
def analyze():
    try:
        payload = request.get_json(force=True) or {}
        lead_id = payload.get("lead_id", "")
        transcript = payload.get("transcript", "")
        metadata = payload.get("metadata", {})
        if not lead_id:
            return jsonify({"error": "lead_id obrigatório"}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400

    stage, stage_conf, _ = detect_stage(transcript)
    pains = detect_pain_points(transcript)
    objections = detect_objections(transcript)
    urgency = detect_urgency(transcript)
    budget = detect_budget_signal(transcript)
    decision = detect_decision_maker(transcript)
    intent = detect_intent(transcript)
    icp_fit = detect_icp_fit(metadata)
    lead_score = compute_lead_score(transcript, urgency, budget, decision)

    if decision != "Sim" and stage == "Fechamento":
        stage = "Negociacao"
        stage_conf = min(stage_conf, 0.75)

    if stage in ("Novo", "Qualificacao") and intent == "Baixo":
        stage_conf = min(stage_conf, 0.5)

    nba = build_next_best_actions(stage, intent, decision, objections, urgency)
    tasks = build_tasks(stage, decision, complete_diagnosis=(stage != "Diagnostico"))

    insights: List[str] = []
    if urgency != "Baixa":
        insights.append(f"Urgência: {urgency}")
    if budget != "Inexistente":
        insights.append(f"Sinal de orçamento: {budget}")
    if any(r.search(transcript) for r in COMPARE_REGEX):
        insights.append("Comparação com fornecedores/concorrentes")

    summary = summarize_pt(transcript)

    tags: List[str] = []
    if lead_score >= 70:
        tags.append("quente")
    if budget == "Presente":
        tags.append("budget_presente")
    if urgency == "Alta":
        tags.append("urgencia_alta")
    if decision != "Sim":
        tags.append("nao_decisor")

    resp = {
        "lead_id": lead_id,
        "stage": stage,
        "stage_confidence": round(float(stage_conf), 2),
        "lead_score": int(lead_score),
        "icp_fit": icp_fit,
        "buying_intent": intent,
        "pain_points": pains,
        "objections": objections,
        "urgency": urgency,
        "budget_signal": budget,
        "decision_maker": decision,
        "next_best_actions": nba,
        "insights": insights,
        "summary_pt": summary,
        "tasks_to_create": tasks,
        "tags": tags,
    }
    return jsonify(resp)

@app.get("/widget.js")
def widget_js():
    api_base = request.host_url.rstrip('/')
    js = f"""
(function(){{
  const css = `#funnel-agent-btn{position:fixed;bottom:20px;right:20px;background:#111;color:#fff;border:none;border-radius:24px;padding:10px 14px;font:14px sans-serif;z-index:2147483647;box-shadow:0 2px 10px rgba(0,0,0,0.2);}#funnel-agent-panel{position:fixed;bottom:70px;right:20px;width:360px;max-height:70vh;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.2);overflow:auto;padding:12px;z-index:2147483647;font:13px sans-serif;color:#111}#funnel-agent-panel h3{margin:0 0 8px 0;font-size:14px}#funnel-agent-panel textarea{width:100%;height:120px;margin:6px 0;padding:6px;border:1px solid #ccc;border-radius:6px;resize:vertical}#funnel-agent-panel .row{display:flex;gap:6px}#funnel-agent-panel input{flex:1;padding:6px;border:1px solid #ccc;border-radius:6px}`;
  const style = document.createElement('style'); style.innerHTML = css; document.head.appendChild(style);
  const btn = document.createElement('button'); btn.id = 'funnel-agent-btn'; btn.textContent = 'Analisar lead'; document.body.appendChild(btn);
  const panel = document.createElement('div'); panel.id='funnel-agent-panel'; panel.style.display='none';
  panel.innerHTML = `
    <h3>Agente de Funil</h3>
    <div class="row"><input id="fa-lead-id" placeholder="lead_id"/><input id="fa-segmento" placeholder="segmento"/></div>
    <div class="row"><input id="fa-empresa" placeholder="tamanho_empresa"/><input id="fa-origem" placeholder="origem"/></div>
    <textarea id="fa-transcript" placeholder="Cole aqui o transcript...\n(WhatsApp, e-mail, call, chat)"></textarea>
    <div class="row"><button id="fa-run">Analisar</button><button id="fa-close">Fechar</button></div>
    <pre id="fa-out" style="white-space:pre-wrap;background:#fafafa;border:1px solid #eee;border-radius:6px;padding:8px;margin-top:8px"></pre>
  `;
  document.body.appendChild(panel);
  btn.onclick = ()=>{ panel.style.display = panel.style.display==='none'?'block':'none'; };
  panel.querySelector('#fa-close').onclick = ()=>{ panel.style.display='none'; };
  panel.querySelector('#fa-run').onclick = async ()=>{
     const lead_id = panel.querySelector('#fa-lead-id').value.trim() || `LEAD-${Date.now()}`;
     const transcript = panel.querySelector('#fa-transcript').value.trim();
     const metadata = {
       segmento: panel.querySelector('#fa-segmento').value.trim(),
       tamanho_empresa: panel.querySelector('#fa-empresa').value.trim(),
       origem: panel.querySelector('#fa-origem').value.trim(),
     };
     const out = panel.querySelector('#fa-out');
     out.textContent = 'Analisando...';
     try{
       const res = await fetch('{api_base}/analyze', {
         method:'POST', headers:{'Content-Type':'application/json'},
         body: JSON.stringify({ lead_id, transcript, metadata })
       });
       const data = await res.json();
       out.textContent = JSON.stringify(data, null, 2);
     }catch(e){ out.textContent = 'Erro: '+e; }
  };
})();
"""
    return Response(js, mimetype="application/javascript")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8000)))