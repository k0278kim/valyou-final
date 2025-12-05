'use client';

import { useState } from 'react';
import { ArrowLeft, ShoppingBag, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState<string>(''); // 'login' | 'fetching'
    const [error, setError] = useState<string | null>(null);
    const [orders, setOrders] = useState<any[]>([]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !password) return;

        setLoading(true);
        setLoadingStep('login'); // 단일 단계지만 UI 유지를 위해 사용
        setError(null);
        setOrders([]);

        try {
            // 통합 API 호출 (로그인 + 스크래핑)
            const res = await fetch('/api/musinsa/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '로그인 및 주문 내역 불러오기에 실패했습니다.');
            }

            setOrders(data.orders || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingStep('');
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-neutral-900 font-sans pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 transition-all duration-300">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/" className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600">
                        <ArrowLeft size={22} />
                    </Link>
                    <h1 className="font-semibold text-sm text-neutral-800">
                        무신사 주문 내역
                    </h1>
                    <div className="w-8"></div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 pt-8">
                {orders.length === 0 ? (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-black/20">
                                <ShoppingBag className="text-white" size={24} />
                            </div>
                            <h2 className="text-lg font-bold text-neutral-900">무신사 연동하기</h2>
                            <p className="text-sm text-neutral-500 mt-1 text-center">
                                로그인하여 주문 내역을 불러옵니다.<br />
                                정보는 저장되지 않으니 안심하세요.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="아이디"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    placeholder="비밀번호"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black transition-colors"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white font-bold py-3.5 rounded-xl text-sm hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        로그인 및 주문 내역 불러오는 중...
                                    </>
                                ) : (
                                    <>
                                        <Lock size={16} />
                                        로그인하고 내역 가져오기
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="font-bold text-lg px-1">주문 내역 ({orders.length})</h2>
                        {orders.map((order, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex gap-4">
                                <div className="w-20 h-24 bg-neutral-100 rounded-xl flex-shrink-0 overflow-hidden relative">
                                    {order.image ? (
                                        <img src={order.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                            <ShoppingBag size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md">
                                                {order.brand || 'BRAND'}
                                            </span>
                                            <span className="text-xs text-neutral-400">{order.date}</span>
                                        </div>
                                        <h3 className="font-medium text-sm text-neutral-900 line-clamp-2 leading-snug">
                                            {order.title || '상품명'}
                                        </h3>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="font-bold text-neutral-900">{order.price}</span>
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
