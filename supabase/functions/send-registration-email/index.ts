import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RegistrationData {
  username: string;
  email: string;
  fullName: string;
  requestedAt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { registrationData }: { registrationData: RegistrationData } = await req.json()

    // Email content for admin notification
    const emailContent = `
      <h2>Nova Solicitação de Cadastro - Atractive CRM</h2>
      
      <p>Uma nova solicitação de cadastro foi recebida:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Dados do Solicitante:</h3>
        <p><strong>Nome Completo:</strong> ${registrationData.fullName}</p>
        <p><strong>Nome de Usuário:</strong> ${registrationData.username}</p>
        <p><strong>Email:</strong> ${registrationData.email}</p>
        <p><strong>Data da Solicitação:</strong> ${new Date(registrationData.requestedAt).toLocaleString('pt-BR')}</p>
      </div>
      
      <p>Para aprovar ou rejeitar esta solicitação, acesse o painel administrativo do CRM.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          Este email foi enviado automaticamente pelo sistema Atractive CRM.
        </p>
      </div>
    `

    // Here you would integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll simulate the email sending
    console.log('Email would be sent to: club.atrative@gmail.com')
    console.log('Email content:', emailContent)

    // In a real implementation, you would use an email service like:
    /*
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'club.atrative@gmail.com' }],
          subject: 'Nova Solicitação de Cadastro - Atractive CRM'
        }],
        from: { email: 'noreply@atractive.com' },
        content: [{
          type: 'text/html',
          value: emailContent
        }]
      })
    })
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de notificação enviado com sucesso' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro ao enviar email de notificação' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})