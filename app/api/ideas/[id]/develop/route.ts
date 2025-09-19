import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const DEFAULT_SYSTEM_PROMPT = `
You are an expert hackathon pitching assistant. Expand a very short, lazy idea into a crisp, actionable pitch that specifically benefits South Florida communities (Miami-Dade, Broward, Palm Beach, the Keys). Keep it practical and locally grounded (e.g., hurricanes, flooding, housing, transit, small businesses, multilingual).
Return strict JSON with keys:
-  developed_title (short, catchy)
-  problem (who is affected, local angle)
-  solution (what the product does)
-  mvp (what to build first; concise)
-  hours_estimate (integer, how many hours to ship MVP)
Guidelines:
-  Plain concise language.
-  Avoid jargon.
-  Assume a small dev team.
-  Be helpful and realistic.
`;

export async function POST(
    _: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: idea, error } = await supabaseAdmin
        .from('ideas')
        .select('id,title,developed')
        .eq('id', id)
        .single();

    if (error || !idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    if (idea.developed) return NextResponse.json({ error: 'Already developed' }, { status: 400 });

    const systemPrompt = process.env.JELLY_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;
    const provider = process.env.JELLY_AI_PROVIDER || 'openai';
    const model = process.env.JELLY_AI_MODEL || 'gpt-4o-mini';

    try {
        if (provider !== 'openai') {
            return NextResponse.json({ error: 'Unsupported AI provider' }, { status: 400 });
        }

        const resp = await fetch(process.env.JELLY_AI_BASE_URL || 'https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY || process.env.JELLY_AI_API_KEY}`,
            },
            body: JSON.stringify({
                model,
                temperature: 0.7,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: `Original one-liner idea: "${idea.title}".\nFocus on South Florida context.\nReturn JSON as specified.`,
                    },
                ],
            }),
        });

        if (!resp.ok) {
            const text = await resp.text();
            return NextResponse.json({ error: `AI error: ${text}` }, { status: 500 });
        }

        const json = await resp.json();
        const content = json.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content);

        const draft = {
            developed_title: String(parsed.developed_title || '').slice(0, 120),
            problem: String(parsed.problem || '').slice(0, 2000),
            solution: String(parsed.solution || '').slice(0, 2000),
            mvp: String(parsed.mvp || '').slice(0, 2000),
            hours_estimate: Number.isFinite(Number(parsed.hours_estimate)) ? Math.max(1, Math.round(Number(parsed.hours_estimate))) : 20,
        };

        return NextResponse.json(draft);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'AI failure';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

