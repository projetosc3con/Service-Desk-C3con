import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY") ??
    "";

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // GET: Retorna documentação e lista das aplicações ativas
  if (req.method === "GET") {
    const { data: apps } = await supabase
      .from("applications")
      .select("id, name, description, active")
      .eq("active", true)
      .order("name");

    return new Response(
      JSON.stringify(
        {
          status: "online",
          service: "C3con Service Desk - Public Ticket API",
          description:
            "Endpoint público para envio de solicitações de atendimento e abertura de chamados.",
          usage: {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: {
              application_id: "UUID da aplicação/solução (obrigatório)",
              requester_name: "Nome do solicitante (obrigatório)",
              description:
                "Descrição do problema ou sugestão (obrigatório. Também aceita os aliases: 'problem', 'problema', 'suggestion', 'sugestao')",
              requester_contact:
                "E-mail ou telefone de contato (opcional. Também aceita os aliases: 'contact', 'email', 'phone')",
            },
          },
          active_applications: apps || [],
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Apenas POST é permitido para envio de solicitações
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Método ${req.method} não permitido. Utilize POST para enviar solicitações de atendimento.`,
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Corpo da requisição inválido. Envie um JSON válido no corpo da requisição com o cabeçalho 'Content-Type: application/json'.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extrair parâmetros com suporte a aliases
    const applicationId = body.application_id || body.applicationId;
    const requesterName = body.requester_name || body.requesterName || body.nome;
    const description =
      body.description ||
      body.problem ||
      body.problema ||
      body.suggestion ||
      body.sugestao ||
      body.mensagem;
    const requesterContact =
      body.requester_contact ||
      body.requesterContact ||
      body.contact ||
      body.contato ||
      body.email ||
      body.telefone ||
      body.phone ||
      null;

    // 1. Validação do application_id
    if (!applicationId || typeof applicationId !== "string" || !applicationId.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "O campo 'application_id' é obrigatório. Deve ser o UUID correspondente à aplicação/solução C3con.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Validação do requester_name
    if (!requesterName || typeof requesterName !== "string" || !requesterName.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "O campo 'requester_name' (nome do requisitante) é obrigatório.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Validação do problema / sugestão / descrição
    if (!description || typeof description !== "string" || !description.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "O campo 'description' ou 'problem' (descrição do problema ou sugestão) é obrigatório.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se a aplicação existe
    const { data: app, error: appError } = await supabase
      .from("applications")
      .select("id, name, active")
      .eq("id", applicationId.trim())
      .maybeSingle();

    if (appError) {
      console.error("Erro ao validar aplicação:", appError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro ao consultar a aplicação informada.",
          details: appError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!app) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Aplicação com ID '${applicationId}' não foi encontrada.`,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Inserir chamado na tabela tickets
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        application_id: app.id,
        requester_name: requesterName.trim(),
        requester_contact: requesterContact ? String(requesterContact).trim() : null,
        description: description.trim(),
      })
      .select(
        "id, protocol, requester_name, requester_contact, description, status, created_at"
      )
      .single();

    if (ticketError) {
      console.error("Erro ao registrar chamado:", ticketError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro ao registrar o chamado no banco de dados.",
          details: ticketError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sucesso - 201 Created
    return new Response(
      JSON.stringify({
        success: true,
        message: "Solicitação de atendimento registrada com sucesso!",
        protocol: ticket.protocol,
        ticket: {
          id: ticket.id,
          protocol: ticket.protocol,
          application_id: app.id,
          application_name: app.name,
          requester_name: ticket.requester_name,
          requester_contact: ticket.requester_contact,
          description: ticket.description,
          status: ticket.status,
          created_at: ticket.created_at,
        },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Erro inesperado no processamento da solicitação:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Erro interno do servidor ao processar a solicitação.",
        details: err?.message || String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
