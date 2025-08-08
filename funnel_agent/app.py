import os
import re
from datetime import datetime
from typing import List, Literal, Optional, Dict, Any

from flask import Flask, jsonify, request
import json
import requests
from dotenv import load_dotenv

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

load_dotenv()

ZAPI_INSTANCE_ID = os.getenv("Z_API_INSTANCE_ID", "").strip()
ZAPI_TOKEN = os.getenv("Z_API_TOKEN", "").strip()
ZAPI_BASE = "https://api.z-api.io"

CRM_BASE_URL = os.getenv("CRM_API_BASE_URL", "").rstrip("/")
CRM_TOKEN = os.getenv("CRM_API_TOKEN", "").strip()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")


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

# --------- Core Logic ---------

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

def _digits_only(value: str) -> str:
    return re.sub(r"\D+", "", value or "")

def _ensure_data_dir() -> str:
    data_dir = os.path.join(os.getcwd(), "var", "data")
    os.makedirs(data_dir, exist_ok=True)
    return data_dir

def log_jsonl(filename: str, record: Dict[str, Any]) -> None:
    path = os.path.join(_ensure_data_dir(), filename)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

def extract_zapi_event(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Tenta cobrir formatos comuns de webhook (texto e origem)
    text = None
    phone = None
    sender_name = None

    # Texto
    candidates = [
        payload.get("message"),
        payload.get("body"),
        payload.get("text"),
        (payload.get("text") or {}).get("body") if isinstance(payload.get("text"), dict) else None,
        (payload.get("message") or {}).get("text") if isinstance(payload.get("message"), dict) else None,
        (((payload.get("messageData") or {}).get("textMessageData") or {}).get("textMessage")) if isinstance(payload.get("messageData"), dict) else None,
    ]
    # messages[0]
    try:
        if not any(candidates) and isinstance(payload.get("messages"), list) and payload["messages"]:
            msg0 = payload["messages"][0]
            text = (msg0.get("text") or {}).get("body") or msg0.get("body") or msg0.get("message")
            phone = msg0.get("from") or msg0.get("author") or msg0.get("phone")
            sender_name = msg0.get("pushName") or msg0.get("senderName") or msg0.get("name")
    except Exception:
        pass

    if text is None:
        for c in candidates:
            if isinstance(c, str) and c.strip():
                text = c
                break

    # Telefone
    if phone is None:
        phone = payload.get("phone") or payload.get("from") or payload.get("sender") or payload.get("chatId")

    # Extrai somente dígitos se vier no formato 55XXXXXXXX@c.us
    if isinstance(phone, str):
        phone_digits = _digits_only(phone)
    else:
        phone_digits = ""

    # Nome
    if sender_name is None:
        sender_name = payload.get("senderName") or payload.get("pushName") or payload.get("name")

    return {"text": text or "", "phone": phone_digits, "sender_name": sender_name or ""}

def send_whatsapp_message(phone: str, message: str) -> Dict[str, Any]:
    if not (ZAPI_INSTANCE_ID and ZAPI_TOKEN):
        return {"skipped": True, "reason": "Z-API não configurada"}
    url = f"{ZAPI_BASE}/instances/{ZAPI_INSTANCE_ID}/token/{ZAPI_TOKEN}/send-message"
    try:
        resp = requests.post(url, json={"phone": phone, "message": message}, timeout=20)
        return {"status_code": resp.status_code, "body": (resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text)}
    except Exception as exc:
        return {"error": str(exc)}

def update_crm(lead_id: str, stage: StageLiteral, insights: List[str], tags: List[str], tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
    record = {
        "lead_id": lead_id,
        "stage": stage,
        "insights": insights,
        "tags": tags,
        "tasks": tasks,
        "ts": datetime.utcnow().isoformat(),
    }
    # Se houver API do CRM configurada, tenta sincronizar
    if CRM_BASE_URL and CRM_TOKEN:
        headers = {"Authorization": f"Bearer {CRM_TOKEN}", "Content-Type": "application/json"}
        results: Dict[str, Any] = {"sent": []}
        try:
            r1 = requests.patch(f"{CRM_BASE_URL}/leads/{lead_id}", headers=headers, json={"stage": stage, "insights": insights, "tags": tags}, timeout=20)
            results["sent"].append({"endpoint": "lead", "code": r1.status_code})
        except Exception as exc:
            results.setdefault("errors", []).append({"endpoint": "lead", "error": str(exc)})
        # Cria tarefas
        for t in tasks:
            try:
                r2 = requests.post(f"{CRM_BASE_URL}/tasks", headers=headers, json={"lead_id": lead_id, **t}, timeout=20)
                results["sent"].append({"endpoint": "task", "code": r2.status_code})
            except Exception as exc:
                results.setdefault("errors", []).append({"endpoint": "task", "error": str(exc)})
        return results
    # Caso contrário, log em arquivo local
    log_jsonl("crm_sync.jsonl", record)
    return {"logged": True}

def generate_reply(user_text: str, analysis: Dict[str, Any], sender_name: str = "") -> str:
    # Prompt curto e humano em PT-BR
    system_prompt = (
        "Você é um atendente comercial educado e objetivo. Responda em PT-BR, tom humano, curto (<= 2 frases). "
        "Aja conforme o estágio do funil e intenção do comprador. Se o cliente pedir proposta/demo, avance o próximo passo."
    )
    name_part = f"{sender_name}, " if sender_name else ""
    fallback = f"{name_part}obrigado pela mensagem! Vou te ajudar com isso. Poderia me confirmar rapidamente orçamento, prazo e quem decide?"

    if not OPENAI_API_KEY:
        return fallback

    try:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": (
                "Contexto do CRM (JSON):\n" + json.dumps(analysis, ensure_ascii=False) + "\n\n" +
                "Mensagem do cliente:\n" + user_text + "\n\n" +
                "Gere uma resposta curta (<= 2 frases), natural e útil."
            )},
        ]
        resp = requests.post(
            f"{OPENAI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": LLM_MODEL,
                "messages": messages,
                "temperature": 0.4,
                "max_tokens": 120,
            },
            timeout=30,
        )
        data = resp.json()
        content = (
            (((data or {}).get("choices") or [{}])[0].get("message") or {}).get("content")
            if isinstance(data, dict) else None
        )
        return (content or fallback).strip()
    except Exception:
        return fallback


app = Flask(__name__)

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

@app.post("/zapi/webhook")
def zapi_webhook():
    # Recebe eventos do Z-API e orquestra o agente
    event = request.get_json(force=True) or {}
    extracted = extract_zapi_event(event)
    text = (extracted.get("text") or "").strip()
    phone = extracted.get("phone") or ""
    sender_name = extracted.get("sender_name") or ""

    if not text or not phone:
        return jsonify({"status": "ignored", "reason": "sem texto ou telefone"}), 200

    lead_id = f"LEAD-{phone}"

    # Analisar o conteúdo
    analysis_request = {"lead_id": lead_id, "transcript": text, "metadata": {"origem": "whatsapp"}}
    with app.test_request_context(json=analysis_request):
        analysis_resp = analyze()
    # Flask view returns (Response, code) or Response
    if isinstance(analysis_resp, tuple):
        flask_resp, status_code = analysis_resp
        if status_code != 200:
            return jsonify({"error": "falha na análise"}), 500
        analysis_json = flask_resp.get_json()  # type: ignore
    else:
        analysis_json = analysis_resp.get_json()  # type: ignore

    # Gerar resposta ao cliente
    reply_text = generate_reply(text, analysis_json, sender_name)

    # Atualizar CRM (ou log local)
    crm_sync = update_crm(
        lead_id=lead_id,
        stage=analysis_json.get("stage"),
        insights=analysis_json.get("insights", []),
        tags=analysis_json.get("tags", []),
        tasks=analysis_json.get("tasks_to_create", []),
    )

    # Enviar via WhatsApp (Z-API)
    wa_send = send_whatsapp_message(phone=phone, message=reply_text)

    # Log de histórico
    log_jsonl("history.jsonl", {
        "lead_id": lead_id,
        "phone": phone,
        "name": sender_name,
        "text": text,
        "reply": reply_text,
        "analysis": analysis_json,
        "crm_sync": crm_sync,
        "wa_send": wa_send,
        "ts": datetime.utcnow().isoformat(),
    })

    return jsonify({
        "ok": True,
        "lead_id": lead_id,
        "stage": analysis_json.get("stage"),
        "reply": reply_text,
        "wa": wa_send,
        "crm": crm_sync,
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8000)))