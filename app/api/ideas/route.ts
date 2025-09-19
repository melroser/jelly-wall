import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { authOptions } from '@/lib/auth';

export async function GET() {
    // Fetch ideas and all votes; compute counts and user-voted flags
    const { data: ideas, error: ideaErr } = await supabaseAdmin
        .from('ideas')
        .select('id,title,developed,developed_title,problem,solution,mvp,hours_estimate,created_at,region')
        .order('created_at', { ascending: false });
    if (ideaErr) return NextResponse.json({ error: ideaErr.message }, { status: 500 });

    const { data: votes, error: voteErr } = await supabaseAdmin
        .from('votes')
        .select('idea_id,user_id');
    if (voteErr) return NextResponse.json({ error: voteErr.message }, { status: 500 });

    const session = await getServerSession(authOptions);
    const uid = (session?.user as { id?: string })?.id as string | undefined;



    const voteCountMap = new Map<string, number>();
    const userVotes = new Set<string>();

    for (const v of votes || []) {
        voteCountMap.set(v.idea_id, (voteCountMap.get(v.idea_id) || 0) + 1);
        if (uid && v.user_id === uid) userVotes.add(v.idea_id);
    }

    const enriched = (ideas || []).map((i) => ({
        ...i,
        votes: voteCountMap.get(i.id) || 0,
        hasVoted: userVotes.has(i.id),
    }));

    // sort by votes desc, then created_at desc
    enriched.sort((a, b) => (b.votes - a.votes) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

    return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title } = await req.json();
    const t = (title || '').toString().trim();
    if (!t) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (t.length > 140) return NextResponse.json({ error: 'Max 140 chars' }, { status: 400 });

    const createdBy = (session.user as { id?: string })?.id as string | null;
    const { data, error } = await supabaseAdmin
        .from('ideas')
        .insert({
            title: t,
            created_by: createdBy,
            region: 'South Florida',
        })
        .select('id')
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ id: data!.id });
}

