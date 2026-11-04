import { NextRequest, NextResponse } from 'next/server';
import { ChatMessage } from '@/lib/types';
import { SYSTEM_PROMPT, generateEducationalFallback } from '@/lib/chatKnowledge';

export const maxDuration = 30;

// Gemini fallback chain strictly prioritized: gemini-3.8-flash -> gemini-3.5-flash -> gemini-3.1-flash-lite
const DEFAULT_GEMINI_CHAIN = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];

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

    const wantsStream = body.stream !== false;

    // Get the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const userQuery = lastUserMessage?.content?.trim() || '';

    // If query is empty
    if (!userQuery) {
      const promptHelp = 'Zadaj mi pytanie o kosmos, planety, gwiazdy lub misje kosmiczne.';
      if (wantsStream) {
        return new Response(promptHelp, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
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

    // 1. Primary LLM Provider: Google Gemini with Cascading Fallback Chain
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const configuredModel = process.env.GEMINI_MODEL?.trim();
    // Prioritize configured model if provided, followed by the prioritized chain: 3.8-flash -> 3.5-flash -> 3.1-flash-lite
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
          temperature: 0.3,
          maxOutputTokens: 1200,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      };

      // Try models in cascade order
      for (const model of geminiModels) {
        let timeoutId: NodeJS.Timeout | null = null;
        try {
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), 12000);

          if (wantsStream) {
            const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${geminiApiKey}`;
            const geminiRes = await fetch(streamUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(geminiPayload),
              signal: controller.signal,
            });

            if (timeoutId) clearTimeout(timeoutId);

            if (geminiRes.ok && geminiRes.body) {
              const encoder = new TextEncoder();
              const decoder = new TextDecoder();
              const geminiReader = geminiRes.body.getReader();

              const transformStream = new ReadableStream({
                async start(streamController) {
                  let buffer = '';
                  try {
                    while (true) {
                      const { done, value } = await geminiReader.read();
                      if (done) break;

                      buffer += decoder.decode(value, { stream: true });
                      const lines = buffer.split('\n');
                      buffer = lines.pop() || '';

                      for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('data: ')) {
                          try {
                            const parsed = JSON.parse(trimmed.slice(6));
                            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                              streamController.enqueue(encoder.encode(text));
                            }
                          } catch {
                            // Non-JSON or comment line, ignore
                          }
                        }
                      }
                    }

                    if (buffer.trim().startsWith('data: ')) {
                      try {
                        const parsed = JSON.parse(buffer.trim().slice(6));
                        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                          streamController.enqueue(encoder.encode(text));
                        }
                      } catch {}
                    }

                    streamController.close();
                  } catch (err) {
                    streamController.error(err);
                  }
                },
              });

              return new Response(transformStream, {
                headers: {
                  'Content-Type': 'text/plain; charset=utf-8',
                  'Cache-Control': 'no-cache, no-transform',
                  'X-Model-Used': model,
                },
              });
            } else {
              const errDetail = await geminiRes.text();
              console.warn(
                `[Chat API] Gemini (${model}) stream error ${geminiRes.status}: ${errDetail.slice(0, 180)}. Trying fallback model...`
              );
            }
          } else {
            // Non-streaming fallback mode
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
                return NextResponse.json({
                  message: {
                    role: 'assistant' as const,
                    content: replyText,
                  },
                  reply: replyText,
                  text: replyText,
                  isFallback: false,
                  model,
                });
              }
            } else {
              const errDetail = await geminiRes.text();
              console.warn(
                `[Chat API] Gemini (${model}) error ${geminiRes.status}: ${errDetail.slice(0, 180)}. Trying next...`
              );
            }
          }
        } catch (geminiErr) {
          if (timeoutId) clearTimeout(timeoutId);
          console.warn(`[Chat API] Gemini (${model}) timeout/exception:`, geminiErr);
        }
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
            temperature: 0.3,
            max_tokens: 1000,
          }),
          signal: controller.signal,
        });

        if (openAiTimeout) clearTimeout(openAiTimeout);

        if (openAiRes.ok) {
          const completion = await openAiRes.json();
          const assistantContent = completion.choices?.[0]?.message?.content?.trim() || '';
          if (assistantContent) {
            if (wantsStream) {
              return new Response(assistantContent, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
              });
            }
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
      : 'Jestem Galacti AI. Zadaj mi pytanie o planety, misje kosmiczne, zaćmienia lub zjawiska astrofizyczne.'
    ).trim();

    if (wantsStream) {
      return new Response(finalAnswer, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Data-Source': 'educational-fallback-engine',
        },
      });
    }

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
      'Wystąpił chwilowy błąd podczas przetwarzania Twojego pytania. Spróbuj zadać je ponownie za moment.';
    return new Response(errorText, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
