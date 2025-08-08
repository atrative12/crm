# Funnel Agent

Serviço Flask para classificar estágio no funil, extrair sinais (dor, urgência, orçamento, autoridade), calcular lead_score, detectar objeções e sugerir próximas ações (NBA). Retorna JSON pronto para CRM/automação.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz de `funnel_agent/` (ou exporte no ambiente):

```
Z_API_INSTANCE_ID=seu_instance_id
Z_API_TOKEN=seu_token

# Opcional: API do CRM para sincronizar estágio/tarefas
CRM_API_BASE_URL=https://seu-crm.local/api
CRM_API_TOKEN=seu_token_de_api

# Opcional: LLM para resposta automática (compatível com OpenAI)
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini

# Porta do servidor
PORT=8000
```

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

## Análise (API interna)

```bash
curl -s -X POST http://localhost:8000/analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "lead_id": "LEAD-123",
    "transcript": "Estamos gastando muito com leads frios. Precisamos reduzir custo ainda este mês. Se a proposta couber em 2k/mês, consigo aprovar com meu gerente. Pode me mandar uma demo amanhã às 10?",
    "metadata": {"segmento": "SaaS", "tamanho_empresa": ">100"}
  }' | jq
```

## Webhook Z-API

Configure no painel da Z-API a URL do webhook para eventos de mensagens recebidas apontando para:

```
POST https://SEU_DOMINIO/zapi/webhook
```

Payloads comuns de Z-API são aceitos. O serviço extrai `texto` e `telefone` e fará:
- **Classificar** intenção e estágio
- **Atualizar** estágio e criar tarefas no CRM (se configurado)
- **Responder** no WhatsApp com mensagem curta e humana via Z-API
- **Logar** histórico em `var/data/history.jsonl`

## Retornos

O endpoint `/zapi/webhook` retorna JSON com `lead_id`, `stage`, `reply`, detalhes de envio no WhatsApp (`wa`) e sincronização de CRM (`crm`).