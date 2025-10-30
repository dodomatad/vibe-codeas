import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { prompt, model, language } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt é obrigatório" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurada. Adicione no arquivo .env" },
        { status: 500 }
      );
    }

    // Inicializar OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // System prompt baseado na linguagem
    const systemPrompts: Record<string, string> = {
      typescript: "Você é um expert em TypeScript e React. Gere código limpo, tipado e moderno usando React hooks e TypeScript. Retorne APENAS o código, sem explicações.",
      javascript: "Você é um expert em JavaScript moderno (ES6+). Gere código limpo e funcional. Retorne APENAS o código, sem explicações.",
      python: "Você é um expert em Python. Gere código limpo, pythônico e bem estruturado. Retorne APENAS o código, sem explicações.",
      html: "Você é um expert em HTML5, CSS3 e JavaScript vanilla. Gere uma página HTML completa com CSS inline ou em <style> e JavaScript se necessário. Retorne APENAS o código HTML completo, sem explicações.",
    };

    const systemPrompt = systemPrompts[language] || systemPrompts.typescript;

    // Chamar OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: model || "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedCode = completion.choices[0]?.message?.content || "";

    // Limpar o código (remover markdown code blocks se houver)
    let cleanedCode = generatedCode
      .replace(/```[\w]*\n/g, "")
      .replace(/```/g, "")
      .trim();

    return NextResponse.json({
      code: cleanedCode,
      model: model,
      language: language,
      tokens: completion.usage?.total_tokens || 0,
    });
  } catch (error: any) {
    console.error("Error generating code:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar código" },
      { status: 500 }
    );
  }
}
