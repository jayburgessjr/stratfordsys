'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { Globe, TrendingUp, TrendingDown, Search, Filter, Share2, Bookmark, ExternalLink, Zap, Clock, AlertTriangle, Activity } from 'lucide-react';

export default function NewsPage() {
    return (
        <DashboardLayout>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col gap-4">

                {/* Header - Fixed Height */}
                <div className="flex flex-none justify-between items-center px-1">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Global Intelligence
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Real-time market sentiment & breaking headlines
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search topics, symbols..."
                                className="pl-8 h-8 text-xs bg-black/40 border-white/10 focus-visible:ring-primary/50"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 bg-black/40 border-white/10 hover:bg-white/5 h-8">
                            <Filter className="h-3.5 w-3.5" />
                            Filter
                        </Button>
                    </div>
                </div>

                {/* Featured / Hero Section - Fixed Height */}
                <div className="flex-none grid grid-cols-1 lg:grid-cols-3 gap-4 h-64">
                    {/* Main Feature */}
                    <div className="lg:col-span-2 relative group overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                        {/* Background Image Placeholder with Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />

                        <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="default" className="bg-red-600 hover:bg-red-700 text-white border-0 py-0.5 px-2 text-[10px] uppercase tracking-wider font-bold animate-pulse">Breaking</Badge>
                                <span className="text-[10px] text-zinc-300 flex items-center gap-1"><Clock className="h-3 w-3" /> 2m ago</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-tight mb-2 group-hover:text-primary transition-colors">
                                SEC Approves Bitcoin ETF Options Trading: Institutional Inflow Imminent
                            </h2>
                            <p className="text-sm text-zinc-300 line-clamp-2 max-w-2xl">
                                In a landmark decision, the Securities and Exchange Commission has greenlit options trading for spot Bitcoin ETFs, paving the way for sophisticated hedging strategies...
                            </p>
                        </div>
                    </div>

                    {/* AI Sentiment Snapshot */}
                    <Card className="flex flex-col bg-black/40 border-white/5 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Zap className="h-4 w-4 text-purple-400" />
                                AI Sentiment Pulse
                            </CardTitle>
                            <CardDescription className="text-xs">Real-time market mood analysis</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-center gap-4">
                            <div className="text-center">
                                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Bullish</div>
                                <div className="text-xs text-muted-foreground mt-1">Score: 78/100</div>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>Crypto</span>
                                        <span className="text-emerald-400">Very Bullish (85)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[85%] rounded-full shadow-[0_0_10px_#10b981]" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>Tech Equities</span>
                                        <span className="text-blue-400">Neutral (50)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[50%] rounded-full" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>Forex</span>
                                        <span className="text-rose-400">Bearish (35)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500 w-[35%] rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Layout - Fills Remaining Height */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Latest News Feed - Scrollable List */}
                    <Card className="lg:col-span-2 flex flex-col bg-black/20 border-white/5 h-full">
                        <CardHeader className="py-3 px-4 border-b border-white/5 flex-none">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-primary" />
                                    Live Wire
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-white/10">All</Badge>
                                    <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground cursor-pointer hover:text-white">Crypto</Badge>
                                    <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground cursor-pointer hover:text-white">Macro</Badge>
                                    <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground cursor-pointer hover:text-white">Earnings</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-white/10">
                            <div className="divide-y divide-white/5">
                                {[
                                    { title: "Federal Reserve hints at rate pause in upcoming FOMC meeting", source: "Bloomberg", time: "15m ago", sentiment: "positive", category: "Macro" },
                                    { title: "Solana network achieves record throughput in latest stress test", source: "CoinDesk", time: "32m ago", sentiment: "positive", category: "Crypto" },
                                    { title: "Oil prices surge amid geopolitical tensions in the Middle East", source: "Reuters", time: "45m ago", sentiment: "negative", category: "Commodities" },
                                    { title: "Apple unveils new AI-integrated hardware lineup", source: "The Verge", time: "1h ago", sentiment: "neutral", category: "Tech" },
                                    { title: "Market volatility expected to increase as VIX climbs above 18", source: "CNBC", time: "2h ago", sentiment: "negative", category: "Markets" },
                                    { title: "Ethereum Layer 2 scaling solutions see massive TVL growth", source: "The Block", time: "3h ago", sentiment: "positive", category: "Crypto" },
                                    { title: "Tesla recalls 2 million vehicles over autopilot software concerns", source: "WSJ", time: "4h ago", sentiment: "negative", category: "Auto" },
                                ].map((news, i) => (
                                    <div key={i} className="p-4 hover:bg-white/5 transition-colors group cursor-pointer">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 border-white/10 text-zinc-400">{news.category}</Badge>
                                                    <span className="text-[10px] text-muted-foreground">{news.source} • {news.time}</span>
                                                </div>
                                                <h3 className="font-medium text-sm text-zinc-200 group-hover:text-white leading-snug mb-1">
                                                    {news.title}
                                                </h3>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white"><Share2 className="h-3 w-3" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white"><Bookmark className="h-3 w-3" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white"><ExternalLink className="h-3 w-3" /></Button>
                                                </div>
                                            </div>
                                            <div className={`
                         flex-none rounded-full p-1.5 
                         ${news.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    news.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-400' :
                                                        'bg-blue-500/10 text-blue-400'}
                       `}>
                                                {news.sentiment === 'positive' ? <TrendingUp className="h-4 w-4" /> :
                                                    news.sentiment === 'negative' ? <TrendingDown className="h-4 w-4" /> :
                                                        <Activity className="h-4 w-4" />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column: Alerts & Trending - Scrollable */}
                    <div className="flex flex-col gap-4 h-full min-h-0">
                        {/* Critical Alerts */}
                        <Card className="flex-none bg-rose-950/20 border-rose-500/30">
                            <CardHeader className="py-2.5 px-4 border-b border-rose-500/20">
                                <CardTitle className="text-xs font-semibold text-rose-400 flex items-center gap-2">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    High Impact Events
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-300">CPI Data Release</span>
                                    <Badge variant="outline" className="border-rose-500/40 text-rose-400 text-[10px]">Tomorrow 8:30 AM</Badge>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-300">FOMC Minutes</span>
                                    <Badge variant="outline" className="border-rose-500/40 text-rose-400 text-[10px]">Wed 2:00 PM</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Trending Topics */}
                        <Card className="flex-1 flex flex-col min-h-0 bg-black/20 border-white/5">
                            <CardHeader className="py-3 px-4 flex-none border-b border-white/5">
                                <CardTitle className="text-sm">Trending Now</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
                                <div className="flex flex-wrap gap-2">
                                    {['#Bitcoin', '#NVDA', '#Recession', '#AI', '#DeFi', '#Inflation', '#SpaceX', '#Regulation', '#Ethereum', '#TechEarnings'].map((tag, i) => (
                                        <Badge key={i} variant="secondary" className="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer transition-colors py-1.5">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>

                                <Separator className="my-4 bg-white/5" />

                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Most Read</h4>
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="flex gap-3 group cursor-pointer">
                                            <span className="text-xl font-bold text-white/10 group-hover:text-primary/50 transition-colors">0{i + 1}</span>
                                            <div>
                                                <p className="text-xs font-medium text-zinc-300 group-hover:text-white line-clamp-2">
                                                    Top 10 Emerging Markets to Watch in Q4 2025
                                                </p>
                                                <span className="text-[10px] text-muted-foreground">5 mins read</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
