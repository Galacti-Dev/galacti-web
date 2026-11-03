import { NextRequest, NextResponse } from 'next/server';
import { ChatMessage } from '@/lib/types';
import { SYSTEM_PROMPT, generateEducationalFallback } from '@/lib/chatKnowledge';

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
        { error: 'Brak pola messages lub message w żądaniu.' },
        { status: 400 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Tablica wiadomości nie może być pusta.' },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const userQuery = lastUserMessage?.content?.trim() || '';

    // Basic sanitization
    const sanitizedQuery = userQuery.replace(/<[^>]*>?/gm, '');

    // 1. Primary LLM Provider: Google Gemini ('gemini-3.8-flash')
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    if (geminiApiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

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

        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

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
              model: geminiModel,
            });
          }
        } else {
          const errDetail = await geminiRes.text();
          console.warn(`[Chat API] Gemini (${geminiModel}) responded with error: ${geminiRes.status}`, errDetail);
        }
      } catch (geminiErr) {
        console.error(`[Chat API] Error calling Gemini (${geminiModel}):`, geminiErr);
      }
    } else {
      console.info('[Chat API] GEMINI_API_KEY is not set in environment.');
    }

    // 2. Secondary fallback provider: OpenAI (if configured)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

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

        clearTimeout(timeoutId);

        if (openAiRes.ok) {
          const completion = await openAiRes.json();
          const assistantContent = completion.choices?.[0]?.message?.content || '';
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
        console.error('[Chat API] Error calling OpenAI fallback:', err);
      }
    }

    // 3. Graceful degradation: Local scientific knowledge engine matching chatbot_prompt.md
    const fallbackAnswer = generateEducationalFallback(sanitizedQuery);
    const configNotice = !geminiApiKey
      ? '\n\n---\n*ℹ️ Usługa Gemini AI oczekuje na skonfigurowanie klucza GEMINI_API_KEY w środowisku. Powyższa odpowiedź została wygenerowana przez zweryfikowany naukowo lokalny silnik edukacyjny Galacti.*'
      : '\n\n---\n*ℹ️ Usługa Gemini AI była chwilowo niedostępna. Powyższa odpowiedź została wygenerowana przez zweryfikowany naukowo lokalny silnik edukacyjny Galacti.*';

    const finalAnswer = `${fallbackAnswer}${configNotice}`;

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
    return NextResponse.json(
      {
        message: {
          role: 'assistant',
          content: 'Przepraszam, wystąpił chwilowy błąd serwera podczas przetwarzania Twojego pytania. Spróbuj zadać je ponownie za moment.',
        },
        isFallback: true,
      },
      { status: 500 }
    );
  }
}
