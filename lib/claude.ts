// Claude tool-use pipeline. The Telegram bot feeds a transcript
// ("añade tarea urgente: llamar al banco mañana", "apunta la cena: pollo 600 kcal",
// "marca como hecha la propuesta de Aurora") to Claude with the tools below.
// Claude calls tools; `executeTool` applies them to Supabase and returns a result
// string; the loop feeds results back until Claude produces a final reply.

import Anthropic from "@anthropic-ai/sdk";

export interface DashboardTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export const DASHBOARD_TOOLS: DashboardTool[] = [
  {
    name: "add_task",
    description: "Add a task to the dashboard.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        tag: { type: "string", description: "Short uppercase category, e.g. PROY, PERS." },
        priority: { type: "string", enum: ["urgent", "important", "normal"] },
        due_label: { type: "string", description: 'Human due text, e.g. "vence hoy 17:00", "sin fecha".' },
        featured: { type: "boolean", description: "Show in the top-5 list." },
      },
      required: ["title", "priority"],
    },
  },
  {
    name: "complete_task",
    description: "Mark a task done by fuzzy title match.",
    input_schema: {
      type: "object",
      properties: { title_query: { type: "string" } },
      required: ["title_query"],
    },
  },
  {
    name: "add_event",
    description: "Add a calendar event.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        type: { type: "string", enum: ["meeting", "focus", "personal"] },
        day_offset: { type: "integer", description: "0 = today, 1 = tomorrow …" },
        start_time: { type: "string", description: "HH:MM" },
        end_time: { type: "string", description: "HH:MM" },
        location: { type: "string" },
      },
      required: ["title", "type", "day_offset", "start_time"],
    },
  },
  {
    name: "log_meal",
    description:
      "Log a meal. Always estimate the meal's macros in grams (protein_g, carbs_g, fat_g) " +
      "from the food described; they are added to today's macro totals.",
    input_schema: {
      type: "object",
      properties: {
        meal_type: { type: "string", description: "Desayuno / Almuerzo / Comida / Cena / Extra" },
        name: { type: "string" },
        kcal: { type: "integer" },
        protein_g: { type: "integer", description: "Estimated protein grams in this meal." },
        carbs_g: { type: "integer", description: "Estimated carbohydrate grams in this meal." },
        fat_g: { type: "integer", description: "Estimated fat grams in this meal." },
      },
      required: ["name", "kcal"],
    },
  },
  {
    name: "set_macros",
    description:
      "Set today's TOTAL consumed macros directly (absolute, not additive). Use when the " +
      "user states totals, e.g. \"hoy he tomado 100g de proteína\". Any subset allowed.",
    input_schema: {
      type: "object",
      properties: {
        protein_g: { type: "integer" },
        carbs_g: { type: "integer" },
        fat_g: { type: "integer" },
      },
    },
  },
  {
    name: "set_water",
    description: "Set today's water intake in litres.",
    input_schema: {
      type: "object",
      properties: { water_l: { type: "number" } },
      required: ["water_l"],
    },
  },
  {
    name: "update_movement",
    description: "Update today's activity metrics (any subset).",
    input_schema: {
      type: "object",
      properties: {
        move_kcal: { type: "integer" },
        exercise_min: { type: "integer" },
        stand_h: { type: "integer" },
        steps: { type: "integer" },
        distance_km: { type: "number" },
        resting_hr: { type: "integer" },
        workouts: { type: "integer" },
      },
    },
  },
  {
    name: "list_tasks",
    description:
      "Read the user's tasks from the dashboard. Use it to answer questions like " +
      '"¿qué tengo pendiente?" or before completing a task whose name is unclear.',
    input_schema: {
      type: "object",
      properties: {
        include_done: { type: "boolean", description: "Also list completed tasks." },
      },
    },
  },
  {
    name: "list_events",
    description:
      "Read upcoming calendar events (today, tomorrow, …). Use it for questions " +
      'like "¿qué tengo hoy/mañana?" or "¿cuándo es la reunión con X?".',
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_today_summary",
    description:
      "Read today's meals, calories, macros, water and activity, plus the user's goals. " +
      'Use it for questions like "¿cuántas calorías llevo?" or "¿cómo voy hoy?".',
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "remember_fact",
    description:
      "Save a durable fact about the user to long-term memory (preferences, people, " +
      "routines, goals). Use when the user says \"recuerda que…\" or shares something " +
      "clearly worth keeping for future conversations. One short sentence per fact.",
    input_schema: {
      type: "object",
      properties: { fact: { type: "string" } },
      required: ["fact"],
    },
  },
  {
    name: "forget_fact",
    description: "Delete facts from long-term memory that match the text (fuzzy).",
    input_schema: {
      type: "object",
      properties: { fact_query: { type: "string" } },
      required: ["fact_query"],
    },
  },
];

const SYSTEM = `Eres el asistente personal del usuario, conectado a su panel personal
("D.A.V.I.D"). Te escribe o te manda notas de voz por Telegram, normalmente en español.

Puedes hacer dos cosas:
1. Gestionar su panel con las herramientas: tareas, eventos de calendario,
   comidas/nutrición, agua y actividad física. También puedes CONSULTARLO
   (list_tasks, list_events, get_today_summary) para responder preguntas sobre su día.
2. Conversar y ayudar en general: responder preguntas, dar ideas, redactar textos,
   hacer cálculos, aconsejar… como un buen asistente personal.

Memoria:
- Ves los mensajes recientes de la conversación; úsalos para entender referencias
  como "ponla para mañana" o "la otra".
- Al final del último mensaje recibes "Datos recordados": cosas que el usuario te pidió
  recordar. Tenlas en cuenta. Guarda datos nuevos con remember_fact y bórralos con
  forget_fact cuando te lo pida.

Reglas para el panel:
- Usa la herramienta adecuada para cada acción. Puedes llamar varias en un turno.
- Para fechas relativas usa day_offset (0 hoy, 1 mañana, …).
- Al registrar una comida (log_meal), estima siempre sus macros en gramos (proteínas,
  carbohidratos, grasas) a partir de los alimentos; se suman al total del día.
- Si el usuario no da prioridad de tarea, usa "normal" y featured=true si parece importante.
- Si no estás seguro de qué tarea quiere completar, consulta primero con list_tasks.

Estilo: responde en el idioma del usuario, de forma breve y natural, como en un chat.
Tras cambiar algo en el panel, confirma en una frase qué hiciste. Texto plano, sin
Markdown (Telegram lo muestra tal cual).`;

export type ExecuteTool = (
  name: string,
  input: Record<string, unknown>
) => Promise<string>;

export interface ClaudeResult {
  reply: string;
  toolCalls: { name: string; input: Record<string, unknown> }[];
}

export async function interpret(
  transcript: string,
  executeTool: ExecuteTool,
  opts: { dateStr?: string; history?: Anthropic.MessageParam[]; facts?: string[] } = {}
): Promise<ClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const model = process.env.CLAUDE_MODEL || "claude-opus-5-5";
  const effort = (process.env.CLAUDE_EFFORT || "medium") as
    "low" | "medium" | "high" | "xhigh" | "max";

  // Static prefix (tools + system) cached; volatile transcript after the breakpoint.
  const tools = DASHBOARD_TOOLS.map((t, i) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Tool["input_schema"],
    ...(i === DASHBOARD_TOOLS.length - 1
      ? { cache_control: { type: "ephemeral" as const } }
      : {}),
  }));
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
  ];

  // Volatile context (date, remembered facts) goes in the newest user turn, after
  // the cached prefix, so it never invalidates the cache.
  const context = opts.dateStr ? `[Hoy es ${opts.dateStr}] ` : "";
  const facts = opts.facts?.length
    ? `\n\n[Datos recordados:\n${opts.facts.map((f) => `- ${f}`).join("\n")}]`
    : "";
  const messages: Anthropic.MessageParam[] = [
    ...(opts.history ?? []),
    { role: "user", content: `${context}${transcript}${facts}` },
  ];

  const toolCalls: ClaudeResult["toolCalls"] = [];
  let reply = "";

  for (let i = 0; i < 8; i++) {
    const res = await client.messages.create({
      model,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort },
      system,
      tools,
      messages,
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();
    if (text) reply = text;

    if (res.stop_reason === "refusal") {
      reply = "Lo siento, no puedo ayudarte con eso.";
      break;
    }
    if (res.stop_reason !== "tool_use") break;

    messages.push({ role: "assistant", content: res.content });

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const b of res.content) {
      if (b.type !== "tool_use") continue;
      const input = b.input as Record<string, unknown>;
      let result: string;
      try {
        result = await executeTool(b.name, input);
      } catch (e) {
        result = `error: ${(e as Error).message}`;
      }
      toolCalls.push({ name: b.name, input });
      results.push({ type: "tool_result", tool_use_id: b.id, content: result });
    }
    messages.push({ role: "user", content: results });
  }

  if (!reply) {
    reply = toolCalls.length
      ? `Hecho (${toolCalls.map((t) => t.name).join(", ")}).`
      : "No detecté ningún cambio.";
  }
  return { reply, toolCalls };
}
