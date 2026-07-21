'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, Input, Badge, EmptyState } from '@/components/ui';
import { RoleBadge, WorkTypeBadge, PriorityDot } from '@/components/shared/badges';
import { formatDateShort, isOverdue } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

type SearchTab = 'tasks' | 'ideas' | 'projects' | 'learning';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('tasks');

  const q = query.trim();
  const enabled = q.length >= 2;

  const { data: tasks = [], isFetching: loadingTasks } = useQuery({
    queryKey: ['search-tasks', q],
    queryFn: () => fetcher(`/api/tasks?search=${encodeURIComponent(q)}`),
    enabled: tab === 'tasks' && enabled,
  });

  const { data: ideas = [], isFetching: loadingIdeas } = useQuery({
    queryKey: ['search-ideas', q],
    queryFn: () => fetcher(`/api/ideas?search=${encodeURIComponent(q)}`),
    enabled: tab === 'ideas' && enabled,
  });

  const { data: projects = [], isFetching: loadingProjects } = useQuery({
    queryKey: ['search-projects', q],
    queryFn: () => fetcher(`/api/projects?search=${encodeURIComponent(q)}`),
    enabled: tab === 'projects' && enabled,
  });

  const { data: learningLogs = [], isFetching: loadingLearning } = useQuery({
    queryKey: ['search-learning', q],
    queryFn: () => fetcher(`/api/learning?search=${encodeURIComponent(q)}`),
    enabled: tab === 'learning' && enabled,
  });

  const loading = (tab === 'tasks' && loadingTasks) || (tab === 'ideas' && loadingIdeas) ||
    (tab === 'projects' && loadingProjects) || (tab === 'learning' && loadingLearning);

  const tabs: { key: SearchTab; label: string; icon: string }[] = [
    { key: 'tasks', label: 'Tasks', icon: '✅' },
    { key: 'ideas', label: 'Ide', icon: '💡' },
    { key: 'projects', label: 'Proyek', icon: '🗂' },
    { key: 'learning', label: 'Belajar', icon: '📚' },
  ];

  const resultCount = tab === 'tasks' ? tasks.length : tab === 'ideas' ? ideas.length :
    tab === 'projects' ? projects.length : learningLogs.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-white">Pencarian</h1>
        <p className="text-slate-400 text-xs sm:text-sm">Cari task, ide, proyek, atau log belajar</p>
      </div>

      {/* Search input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Ketik minimal 2 karakter..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          className="w-full h-10 sm:h-11 pl-9 pr-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs">✕</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-lg overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      {!enabled ? (
        <EmptyState  title="Mulai mencari" desc="Ketik kata kunci untuk mencari" />
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : resultCount === 0 ? (
        <EmptyState  title="Tidak ditemukan" desc={`Tidak ada hasil untuk "${q}"`} />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{resultCount} hasil ditemukan</p>

          {/* Tasks */}
          {tab === 'tasks' && (tasks as any[]).map((t: any) => (
            <Link key={t.id} href="/tasks">
              <Card className="hover:border-slate-600 transition-colors cursor-pointer">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <PriorityDot priority={t.priority} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${t.completed ? 'line-through text-slate-500' : 'text-white'}`}>{t.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <RoleBadge role={t.role} />
                        <WorkTypeBadge type={t.work_type} />
                        {t.project_name && <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md">📁 {t.project_name}</span>}
                        {t.due_date && (
                          <span className={`text-xs ${isOverdue(t.due_date) ? 'text-red-400' : 'text-slate-500'}`}>
                            📅 {formatDateShort(t.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={t.completed ? 'success' : 'slate'}>{t.completed ? 'Selesai' : 'Aktif'}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Ideas */}
          {tab === 'ideas' && (ideas as any[]).map((idea: any) => (
            <Link key={idea.id} href="/ideas">
              <Card className="hover:border-slate-600 transition-colors cursor-pointer">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-sm font-medium text-white">{idea.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <RoleBadge role={idea.role} />
                    <Badge variant={idea.status === 'Mentah' ? 'slate' : idea.status === 'Diproses' ? 'warning' : 'success'}>{idea.status}</Badge>
                    <span className="text-xs text-slate-500">{idea.category}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Projects */}
          {tab === 'projects' && (projects as any[]).map((p: any) => (
            <Link key={p.id} href="/projects">
              <Card className="hover:border-slate-600 transition-colors cursor-pointer">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  {p.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{p.description}</p>}
                  <div className="flex flex-wrap gap-1 mt-1">
                    <RoleBadge role={p.role} />
                    <Badge variant={p.status === 'Aktif' ? 'default' : p.status === 'Selesai' ? 'success' : 'warning'}>{p.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Learning Logs */}
          {tab === 'learning' && (learningLogs as any[]).map((log: any) => (
            <Link key={log.id} href="/learning">
              <Card className="hover:border-slate-600 transition-colors cursor-pointer">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-sm font-medium text-white">{log.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge>{log.type}</Badge>
                    {log.category && <Badge variant="purple">{log.category.emoji} {log.category.name}</Badge>}
                    {log.duration_minutes && <span className="text-xs text-slate-500">⏱ {log.duration_minutes}m</span>}
                    {log.finished && <Badge variant="success">Selesai</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
