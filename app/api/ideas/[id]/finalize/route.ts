import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const developed_title = String(body.developed_title || '').trim().slice(0, 120);
    const problem = String(body.problem || '').trim().slice(0, 4000);
    const solution = String(body.solution || '').trim().slice(0, 4000);
    const mvp = String(body.mvp || '').trim().slice(0, 4000);
    const hours_estimate = Number.isFinite(Number(body.hours_estimate)) ? Math.max(1, Math.round(Number(body.hours_estimate))) : 20;

    const { data: idea, error: getErr } = await supabaseAdmin
        .from('ideas')
        .select('id,developed')
        .eq('id', id)
        .single();
    if (getErr || !idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    if (idea.developed) return NextResponse.json({ error: 'Already developed' }, { status: 400 });

    const { error: updErr } = await supabaseAdmin
        .from('ideas')
        .update({
            developed: true,
            developed_title,
            problem,
            solution,
            mvp,
            hours_estimate,
            developed_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
}

