'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, ThumbsUp, LogIn, LogOut, Sparkles, Rocket, ShieldCheck } from 'lucide-react';

type Idea = {
    id: string;
    title: string;
    developed: boolean;
    developed_title?: string | null;
    problem?: string | null;
    solution?: string | null;
    mvp?: string | null;
    hours_estimate?: number | null;
    created_at: string;
    region?: string | null;
    votes: number;
    hasVoted: boolean;
};

type DevelopDraft = {
    developed_title: string;
    problem: string;
    solution: string;
    mvp: string;
    hours_estimate: number;
};

export default function Page() {
    // Remove or comment out:
    // const { data: session, status } = useSession();
    // Just use:
    const { status } = useSession();
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [autoDevelop, setAutoDevelop] = useState(false);
    const [draft, setDraft] = useState<DevelopDraft | null>(null);
    const [draftForId, setDraftForId] = useState<string | null>(null);
    const isAuthenticated = status === 'authenticated';

    const fetchIdeas = async () => {
        const res = await fetch('/api/ideas', { cache: 'no-store' });
        if (res.ok) {
            const data: Idea[] = await res.json();
            setIdeas(data);
        }
    };

    useEffect(() => {
        fetchIdeas();
        const id = setInterval(fetchIdeas, 5000);
        return () => clearInterval(id);
    }, []);

    const onCreateIdea = async () => {
        if (!isAuthenticated) {
            await signIn('linkedin');
            return;
        }
        const t = title.trim();
        if (!t) return;
        setLoading(true);
        const res = await fetch('/api/ideas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: t }),
        });
        setLoading(false);
        if (!res.ok) return;
        setTitle('');
        await fetchIdeas();

        if (autoDevelop) {
            const created = await res.json();
            await onDevelop(created.id);
        }
    };

    const onDevelop = async (id: string) => {
        if (!isAuthenticated) {
            await signIn('linkedin');
            return;
        }
        setDraft(null);
        setDraftForId(id);
        const res = await fetch(`/api/ideas/${id}/develop`, { method: 'POST' });
        if (res.ok) {
            const draft: DevelopDraft = await res.json();
            setDraft(draft);
        } else {
            setDraftForId(null);
        }
    };

    const onFinalize = async () => {
        if (!draft || !draftForId) return;
        const res = await fetch(`/api/ideas/${draftForId}/finalize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draft),
        });
        if (res.ok) {
            setDraft(null);
            setDraftForId(null);
            await fetchIdeas();
        }
    };

    const onVote = async (id: string) => {
        if (!isAuthenticated) {
            await signIn('linkedin');
            return;
        }
        const res = await fetch(`/api/ideas/${id}/vote`, { method: 'POST' });
        if (res.ok) {
            // optimistic UI
            setIdeas(prev =>
                prev.map(i =>
                    i.id === id
                        ? {
                              ...i,
                              hasVoted: !i.hasVoted,
                              votes: i.hasVoted ? Math.max(0, i.votes - 1) : i.votes + 1,
                          }
                        : i
                )
            );
        }
    };

    const leaderboard = useMemo(() => {
        return [...ideas].sort((a, b) => {
            if (b.votes !== a.votes) return b.votes - a.votes;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [ideas]);

    return (
        <div className="relative">
            <JellyBackdrop />
            <header className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <motion.div
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                        className="w-10 h-10 rounded-2xl jelly-glossy flex items-center justify-center"
                        aria-hidden
                    >
                        <Sparkles className="w-6 h-6 text-white/90" />
                    </motion.div>

                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight drop-shadow-sm">Jelly Wall</h1>
                        <p className="text-white/70 text-xl">Hackathon Idea Generator by Devs.Miami</p>
                        <p className="text-white/70 text-sm"> Drop an idea → AI makes it more smarter → Vote for the Best!  </p>
                    </div>
                </div>
                <div>
                    {isAuthenticated ? (
                        <button
                            className="btn btn-ghost"
                            onClick={() => signOut()}
                            aria-label="Sign out"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign out
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={() => signIn('linkedin')}
                            aria-label="Sign in with LinkedIn"
                            title="Sign in with LinkedIn"
                        >
                            <LogIn className="w-4 h-4" />
                            Sign in
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 pb-28 space-y-10">


                <section aria-label="Create idea" className="jelly-panel">
                    <div className="flex flex-col gap-4">
                        
                        


                    <h2 className="text-lg font-bold mb-2 text-white flex items-center gap-2">
                        <Rocket className="w-5 h-5" />
                            How it works:
                    </h2>
                    <ol className="text-white/90 space-y-1 text-sm">
                        <li>1. Type ANY idea 2-3 words</li>
                        <li>2. Click Develop to let AI write it up into a complete pitch!</li>
                        <li>3. Vote for your favs on the Leaderboard</li>
                    </ol>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                id="idea"
                                type="text"
                                placeholder="Type something short (e.g. tenant rights app ... tinder but for like dogs)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="flex-1 input"
                                maxLength={140}
                                aria-describedby="idea-hint"
                            />
                            <button
                                className="btn btn-primary"
                                onClick={onCreateIdea}
                                disabled={loading || title.trim().length === 0}
                            >
                                <Rocket className="w-4 h-4" />
                                Add idea
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="autoDevelop"
                                type="checkbox"
                                checked={autoDevelop}
                                onChange={(e) => setAutoDevelop(e.target.checked)}
                                className="checkbox"
                            />
                            <label htmlFor="autoDevelop" className="text-white/80">
                                Develop after adding
                            </label>
                        </div>
                        <p id="idea-hint" className="text-white/60 text-sm">
                            Ideas are anonymous to others. You can develop them now or later. Development uses AI and can only happen once.
                        </p>
                    </div>
                </section>

                <section aria-label="Leaderboard" className="space-y-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-white/80" />
                        <h2 className="text-xl font-bold">Leaderboard</h2>
                        <span className="text-white/60 text-sm">Top ideas by “Stick!” votes</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {leaderboard.map((idea) => (
                            <IdeaCard
                                key={idea.id}
                                idea={idea}
                                onDevelop={() => onDevelop(idea.id)}
                                onVote={() => onVote(idea.id)}
                            />
                        ))}
                        {leaderboard.length === 0 && (
                            <div className="text-center text-white/70 py-10">
                                No ideas yet. Be the first to throw some jelly!
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <AnimatePresence>
                {draft && draftForId && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="develop-title"
                    >
                        <motion.div
                            className="w-full max-w-2xl rounded-3xl p-6 jelly-panel"
                            initial={{ y: 30, scale: 0.98 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 30, scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Wand2 className="w-5 h-5 text-white/80" />
                                    <h3 id="develop-title" className="text-lg font-bold">
                                        Developed idea (preview)
                                    </h3>
                                </div>
                                <button className="btn btn-ghost" onClick={() => { setDraft(null); setDraftForId(null); }}>
                                    Close
                                </button>
                            </div>

                            <div className="mt-4 space-y-4">
                                <h4 className="text-xl font-extrabold">{draft.developed_title}</h4>
                                <ul className="space-y-2">
                                    <li>
                                        <span className="font-semibold">Problem:</span>{' '}
                                        <span className="text-white/90">{draft.problem}</span>
                                    </li>
                                    <li>
                                        <span className="font-semibold">Solution:</span>{' '}
                                        <span className="text-white/90">{draft.solution}</span>
                                    </li>
                                    <li>
                                        <span className="font-semibold">MVP:</span>{' '}
                                        <span className="text-white/90">{draft.mvp}</span>
                                    </li>
                                    <li>
                                        <span className="font-semibold">Estimated hours:</span>{' '}
                                        <span className="text-white/90">{draft.hours_estimate} hours</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
                                <button className="btn btn-ghost" onClick={() => { setDraft(null); setDraftForId(null); }}>
                                    Not quite
                                </button>
                                <button className="btn btn-primary" onClick={onFinalize}>
                                    Confirm and save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
}

function IdeaCard({
    idea,
    onDevelop,
    onVote,
}: {
    idea: Idea;
    onDevelop: () => void;
    onVote: () => void;
}) {
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
        <motion.div
            layout
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
            className="rounded-3xl p-4 jelly-card"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                    <h3 className="text-lg font-bold">{idea.developed ? idea.developed_title ?? idea.title : idea.title}</h3>
                    <p className="text-xs text-white/60">Region: {idea.region ?? 'South Florida'}</p>
                </div>
                <button
                    className={`btn ${idea.hasVoted ? 'btn-yes' : 'btn-ghost'}`}
                    onClick={onVote}
                    aria-pressed={idea.hasVoted}
                    aria-label="Stick (vote)"
                    title="Stick (vote)"
                >
                    <ThumbsUp className="w-4 h-4" />
                    {idea.votes}
                </button>
            </div>

            {idea.developed ? (
                <div className="mt-3 space-y-2 text-sm">
                    {idea.problem && (
                        <p>
                            <span className="font-semibold">Problem:</span> {idea.problem}
                        </p>
                    )}
                    {idea.solution && (
                        <p>
                            <span className="font-semibold">Solution:</span> {idea.solution}
                        </p>
                    )}
                    {idea.mvp && (
                        <p>
                            <span className="font-semibold">MVP:</span> {idea.mvp}
                        </p>
                    )}
                    {typeof idea.hours_estimate === 'number' && (
                        <p>
                            <span className="font-semibold">Estimated hours:</span> {idea.hours_estimate} hours
                        </p>
                    )}
                </div>
            ) : (
                <div className="mt-3">
                    <button
                        className="btn btn-primary"
                        onClick={onDevelop}
                        disabled={idea.developed}
                        aria-disabled={idea.developed}
                        title="Develop this idea with AI"
                    >
                        <Wand2 className="w-4 h-4" />
                        Develop
                    </button>
                </div>
            )}

            {!idea.developed && (
                <motion.div
                    className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden"
                    initial={false}
                    animate={reduced ? {} : { boxShadow: ['0 0 0px #fff0', '0 0 16px #ffffff30'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <motion.div
                        className="h-full bg-jelly-gradient"
                        initial={{ x: '-100%' }}
                        animate={reduced ? {} : { x: ['-100%', '100%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </motion.div>
            )}
        </motion.div>
    );
}

function JellyBackdrop() {
    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full jelly-blob blur-3xl opacity-60" />
            <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] rounded-full jelly-blob-2 blur-3xl opacity-60" />
            <div className="absolute inset-0 bg-[radial-gradient(1000px_300px_at_50%_0%,rgba(255,255,255,0.12),transparent)]" />
        </div>
    );
}

function Footer() {
    return (
        <footer className="fixed bottom-0 inset-x-0 z-10">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="text-white/70 text-sm">
                    Built for rapid brainstorming with friends. Perfect for Hackathons!
                </div>
                <div className="text-white/80 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400 jello-bounce" />
                    <span className="gradient-text">Jelly, shiny, and bouncy!</span>
                </div>
            </div>
        </footer>
    );
}

