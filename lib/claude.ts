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
];

const SYSTEM = `Eres el asistente de un panel personal ("D.A.V.I.D"). El usuario te envía
mensajes de voz o texto en español para modificar su panel: tareas, eventos de
calendario, comidas/nutrición, agua y actividad física.

Interpreta el mensaje y usa las herramientas disponibles para aplicar los cambios.
Reglas:
- Usa la herramienta adecuada para cada acción. Puedes llamar varias en un turno.
- Para fechas relativas usa day_offset (0 hoy, 1 mañana, …).
- Al registrar una comida (log_meal), estima siempre sus macros en gramos (proteínas,
  carbohidratos, grasas) a partir de los alimentos; se suman al total del día.
- Si el usuario no da prioridad de tarea, usa "normal" y featured=true si parece importante.
- Si el mensaje no implica ningún cambio, responde brevemente sin usar herramientas.
- Tras aplicar los cambios, responde en español de forma muy breve confirmando qué hiciste.`;

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
  opts: { dateStr?: string } = {}
): Promise<ClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

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

  const context = opts.dateStr ? `[Hoy es ${opts.dateStr}] ` : "";
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `${context}${transcript}` },
  ];

  const toolCalls: ClaudeResult["toolCalls"] = [];
  let reply = "";

  for (let i = 0; i < 5; i++) {
    const res = await client.messages.create({
      model,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
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
