import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
    _: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string })?.id;
    const { id: ideaId } = await params;

    const { data: existing, error: getErr } = await supabaseAdmin
        .from('votes')
        .select('id')
        .eq('idea_id', ideaId)
        .eq('user_id', userId)
        .maybeSingle();

    if (getErr) return NextResponse.json({ error: getErr.message }, { status: 500 });

    if (existing) {
        const { error: delErr } = await supabaseAdmin.from('votes').delete().eq('id', existing.id);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
        return NextResponse.json({ toggled: 'removed' });
    } else {
        const { error: insErr } = await supabaseAdmin.from('votes').insert({ idea_id: ideaId, user_id: userId });
        if (insErr) {
            if ((insErr as { code?: string }).code === '23505')
            return NextResponse.json({ error: insErr.message }, { status: 500 });
        }
        return NextResponse.json({ toggled: 'added' });
    }
}

