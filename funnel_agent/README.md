# Funnel Agent

Serviço Flask para classificar estágio no funil, extrair sinais (dor, urgência, orçamento, autoridade), calcular lead_score, detectar objeções e sugerir próximas ações (NBA). Retorna JSON pronto para CRM/automação.

## Rodar localmente

```bash
pip3 install -r requirements.txt --break-system-packages
python3 app.py
```

Ou usando variável de porta:

```bash
PORT=8000 python3 app.py
```

## Healthcheck

```bash
curl -s http://localhost:8000/health | jq
```

## Análise

```bash
curl -s -X POST http://localhost:8000/analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "lead_id": "LEAD-123",
    "transcript": "Estamos gastando muito com leads frios. Precisamos reduzir custo ainda este mês. Se a proposta couber em 2k/mês, consigo aprovar com meu gerente. Pode me mandar uma demo amanhã às 10?",
    "metadata": {"segmento": "SaaS", "tamanho_empresa": ">100"}
  }' | jq
```

Retorno segue o esquema do enunciado (campos: `stage`, `stage_confidence`, `lead_score`, `icp_fit`, `buying_intent`, `pain_points`, `objections`, `urgency`, `budget_signal`, `decision_maker`, `next_best_actions`, `insights`, `summary_pt`, `tasks_to_create`, `tags`).