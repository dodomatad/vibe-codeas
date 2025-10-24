/**
 * Enhanced Code Generation API
 * Multi-model orchestration com context awareness
 */

import { NextRequest, NextResponse } from 'next/server';
import { createModelRouter } from '@/lib/ai/multi-model/model-router';
import { buildSystemPrompt } from '@/lib/ai/enhanced/system-prompts';
import { createContextBuilder } from '@/lib/ai/context/context-builder';
import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { message, projectPath, taskType = 'initial-generation', complexity = 'medium' } = await req.json();

    // 1. Build context
    const contextBuilder = createContextBuilder(projectPath || process.cwd());
    const context = await contextBuilder.buildContext();

    // 2. Select optimal model
    const router = createModelRouter({
      qualityBias: 0.7,
      maxCostPerRequest: 1.0,
    });
    
    const modelConfig = router.selectModel(taskType, message.length, complexity);

    // 3. Build enhanced prompt
    const systemPrompt = buildSystemPrompt({
      framework: context.framework,
      complexity,
      focus: 'quality',
    });

    // 4. Generate code with selected model
    const startTime = Date.now();
    let response;

    if (modelConfig.provider === 'anthropic') {
      const result = await anthropic.messages.create({
        model: modelConfig.model,
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      });
      
      response = {
        content: result.content[0].type === 'text' ? result.content[0].text : '',
        usage: {
          inputTokens: result.usage.input_tokens,
          outputTokens: result.usage.output_tokens,
        },
      };
    } else if (modelConfig.provider === 'openai') {
      const result = await openai.chat.completions.create({
        model: modelConfig.model,
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      });
      
      response = {
        content: result.choices[0].message.content || '',
        usage: {
          inputTokens: result.usage?.prompt_tokens || 0,
          outputTokens: result.usage?.completion_tokens || 0,
        },
      };
    }

    const latency = Date.now() - startTime;

    // 5. Record usage for learning
    router.recordUsage(
      modelConfig.id,
      true,
      latency,
      (response?.usage.inputTokens || 0) + (response?.usage.outputTokens || 0)
    );

    return NextResponse.json({
      success: true,
      data: {
        code: response?.content,
        model: modelConfig.id,
        latency,
        usage: response?.usage,
        context: {
          framework: context.framework,
          components: context.components.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Code generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
