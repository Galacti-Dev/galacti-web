import { NextRequest, NextResponse } from 'next/server';
import { ChatMessage } from '@/lib/types';
import { SYSTEM_PROMPT, generateEducationalFallback } from '@/lib/chatKnowledge';

const DEFAULT_GEMINI_CHAIN = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let messages: ChatMessage[] = [];

    if (Array.isArray(body.messages)) {
      messages = body.messages;
    } else if (typeof body.message === 'string') {
      messages = [{ role: 'user', content: body.message }];
    } else {
      return NextResponse.json(
        {
          error: 'Brak pola messages lub message w żądaniu.',
          message: {
            role: 'assistant' as const,
            content: 'Brak pola messages lub message w żądaniu.',
          },
          reply: 'Brak pola messages lub message w żądaniu.',
          text: 'Brak pola messages lub message w żądaniu.',
          isFallback: true,
        },
        { status: 400 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        {
          error: 'Tablica wiadomości nie może być pusta.',
          message: {
            role: 'assistant' as const,
            content: 'Tablica wiadomości nie może być pusta.',
          },
          reply: 'Tablica wiadomości nie może być pusta.',
          text: 'Tablica wiadomości nie może być pusta.',
          isFallback: true,
        },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const userQuery = lastUserMessage?.content?.trim() || '';

    // If query is empty
    if (!userQuery) {
      const promptHelp = 'Zadaj mi pytanie o kosmos, planety, gwiazdy lub misje kosmiczne!';
      return NextResponse.json(
        {
          message: {
            role: 'assistant' as const,
            content: promptHelp,
          },
          reply: promptHelp,
          text: promptHelp,
          isFallback: true,
        },
        { status: 200 }
      );
    }

    // Basic sanitization
    const sanitizedQuery = userQuery.replace(/<[^>]*>?/gm, '');

    // 1. Primary LLM Provider: Google Gemini with Fallback Chain
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const configuredModel = process.env.GEMINI_MODEL?.trim();
    // Prioritize configured model if provided, followed by the stable fallback chain without duplicates
    const geminiModels = configuredModel
      ? [configuredModel, ...DEFAULT_GEMINI_CHAIN.filter(m => m !== configuredModel)]
      : DEFAULT_GEMINI_CHAIN;

    if (geminiApiKey) {
      // Format conversation history for Gemini API
      const geminiContents = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content.slice(0, 4000) }],
        }));

      if (geminiContents.length === 0 || geminiContents[geminiContents.length - 1].role !== 'user') {
        geminiContents.push({
          role: 'user',
          parts: [{ text: sanitizedQuery }],
        });
      }

      const geminiPayload = {
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: geminiContents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1000,
        },
      };

      let successfulReply: string | null = null;
      let usedModel: string | null = null;

      for (const model of geminiModels) {
        let timeoutId: NodeJS.Timeout | null = null;
        try {
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), 7000);

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

          const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload),
            signal: controller.signal,
          });

          if (timeoutId) clearTimeout(timeoutId);

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const replyText = geminiData.candidates?.[0]?.content?.parts
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ?.map((p: any) => p.text || '')
              .join('')
              .trim();

            if (replyText) {
              successfulReply = replyText;
              usedModel = model;
              break;
            } else {
              console.warn(`[Chat API] Gemini (${model}) returned 200 OK but empty candidates/text. Falling back to next model...`);
            }
          } else {
            const errDetail = await geminiRes.text();
            console.warn(
              `[Chat API] Gemini (${model}) responded with error ${geminiRes.status}: ${errDetail.slice(0, 250)}. Falling back to next model in chain...`
            );
          }
        } catch (geminiErr) {
          if (timeoutId) clearTimeout(timeoutId);
          console.warn(`[Chat API] Error/timeout calling Gemini (${model}):`, geminiErr);
        }
      }

      if (successfulReply && usedModel) {
        return NextResponse.json({
          message: {
            role: 'assistant' as const,
            content: successfulReply,
          },
          reply: successfulReply,
          text: successfulReply,
          isFallback: false,
          model: usedModel,
        });
      }
    } else {
      console.info('[Chat API] GEMINI_API_KEY is not set in environment.');
    }

    // 2. Secondary fallback provider: OpenAI (if configured)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      let openAiTimeout: NodeJS.Timeout | null = null;
      try {
        const controller = new AbortController();
        openAiTimeout = setTimeout(() => controller.abort(), 8000);

        const openaiMessages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content.slice(0, 4000),
          })),
        ];

        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: openaiMessages,
            temperature: 0.4,
            max_tokens: 1000,
          }),
          signal: controller.signal,
        });

        if (openAiTimeout) clearTimeout(openAiTimeout);

        if (openAiRes.ok) {
          const completion = await openAiRes.json();
          const assistantContent = completion.choices?.[0]?.message?.content?.trim() || '';
          if (assistantContent) {
            return NextResponse.json({
              message: {
                role: 'assistant' as const,
                content: assistantContent,
              },
              reply: assistantContent,
              text: assistantContent,
              isFallback: false,
              model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            });
          }
        }
      } catch (err) {
        if (openAiTimeout) clearTimeout(openAiTimeout);
        console.error('[Chat API] Error calling OpenAI fallback:', err);
      }
    }

    // 3. Graceful degradation: Local scientific knowledge engine matching chatbot_prompt.md
    const fallbackAnswer = generateEducationalFallback(sanitizedQuery);
    const configNotice = !geminiApiKey
      ? '\n\n---\n*ℹ️ Usługa Gemini AI oczekuje na skonfigurowanie klucza GEMINI_API_KEY w środowisku. Powyższa odpowiedź została wygenerowana przez zweryfikowany naukowo lokalny silnik edukacyjny Galacti.*'
      : '\n\n---\n*ℹ️ Modele Gemini AI były chwilowo przeciążone lub niedostępne. Powyższa odpowiedź została wygenerowana przez zweryfikowany naukowo lokalny silnik edukacyjny Galacti.*';

    const finalAnswer = (fallbackAnswer
      ? `${fallbackAnswer}${configNotice}`
      : 'Witaj! Jestem Galacti AI. Zadaj mi pytanie o planety, misje kosmiczne, zaćmienia lub eksplorację Wszechświata.'
    ).trim();

    const responsePayload = {
      message: {
        role: 'assistant' as const,
        content: finalAnswer,
      },
      reply: finalAnswer,
      text: finalAnswer,
      isFallback: true,
      geminiConfigured: Boolean(geminiApiKey),
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'X-Data-Source': 'educational-fallback-engine',
      },
    });
  } catch (error) {
    console.error('[Chat API] Unhandled server error:', error);
    const errorText =
      'Przepraszam, wystąpił chwilowy błąd serwera podczas przetwarzania Twojego pytania. Spróbuj zadać je ponownie za moment.';
    return NextResponse.json(
      {
        message: {
          role: 'assistant' as const,
          content: errorText,
        },
        reply: errorText,
        text: errorText,
        isFallback: true,
      },
      { status: 500 }
    );
  }
}
