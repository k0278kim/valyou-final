'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { storage, type ProfileItem } from '../../utils/storage';

export default function ProfilePage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [idealSize, setIdealSize] = useState<any>(null);
    const [userStats, setUserStats] = useState({ height: '', weight: '' });
    const [isStatsSaving, setIsStatsSaving] = useState(false);

    useEffect(() => {
        loadData();

        const handleStorageChange = () => loadData();
        window.addEventListener('closai_storage_change', handleStorageChange);
        return () => window.removeEventListener('closai_storage_change', handleStorageChange);
    }, []);

    useEffect(() => {
        if (items.length > 0) {
            const ideal = storage.calculateIdealSize(items);
            setIdealSize(ideal);
        } else {
            setIdealSize(null);
        }
    }, [items]);

    const loadData = () => {
        const data = storage.get();
        setItems(data.items);
        setUserStats(data.userStats);
    };

    const handleUpdateStats = async () => {
        setIsStatsSaving(true);
        try {
            const data = storage.updateStats(userStats.height, userStats.weight);
            setItems(data.items);
            setUserStats(data.userStats);
        } catch (err) {
            console.error(err);
        } finally {
            setIsStatsSaving(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        setLoading(true);

        try {
            // 1. Analyze URL to get product info
            const analyzeRes = await fetch(`/api/analyze?url=${encodeURIComponent(url)}`);
            const analyzeJson = await analyzeRes.json();

            if (analyzeJson.success) {
                const product = analyzeJson.data.basicInfo;
                const sizeTable = analyzeJson.data.sizeTable;

                // 2. Add to profile
                const newItem = {
                    goodsNo: product.goodsNo,
                    title: product.title,
                    brand: product.brand,
                    imageUrl: product.imageUrl,
                    sizeTable: sizeTable,
                    category1: product.category1,
                    category2: product.category2,
                    link: product.link || url
                };

                const data = storage.addItem(newItem);
                setItems(data.items);
                setUrl('');
            } else {
                alert('상품 정보를 불러오는데 실패했습니다.');
            }
        } catch (err) {
            console.error(err);
            alert('오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateFit = async (goodsNo: string, fitStatus: string, selectedSize: string) => {
        try {
            const validFitStatus = (fitStatus === 'GOOD' || fitStatus === 'BIG' || fitStatus === 'SMALL')
                ? fitStatus as 'GOOD' | 'BIG' | 'SMALL'
                : 'GOOD'; // Default fallback

            const data = storage.updateFit(goodsNo, validFitStatus, selectedSize);
            setItems(data.items);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (e: React.MouseEvent, goodsNo: string) => {
        e.preventDefault(); // Prevent link navigation
        e.stopPropagation();

        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            const data = storage.deleteItem(goodsNo);
            setItems(data.items);
        } catch (err) {
            console.error(err);
        }
    }



    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
            {/* Minimal Header */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl z-50 flex items-center justify-between px-8 border-b border-neutral-100">
                <Link href="/search" className="text-2xl font-black tracking-tighter hover:opacity-50 transition-opacity">
                    ClosAI
                </Link>
                <nav className="flex gap-8">
                    <Link href="/search" className="text-sm font-medium text-neutral-400 hover:text-black transition-colors">SEARCH</Link>
                    <Link href="/profile" className="text-sm font-bold text-black border-b-2 border-black pb-1">WARDROBE</Link>
                </nav>
            </header>

            <main className="pt-32 px-8 max-w-7xl mx-auto pb-32">
                {/* Hero Section */}
                <div className="mb-20">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
                        MY<br />WARDROBE
                    </h1>
                    <p className="text-xl text-neutral-400 font-medium max-w-lg leading-relaxed">
                        옷장을 관리하고 실제 옷을 기반으로 완벽한 핏을 찾아보세요.
                    </p>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
                    {/* Left Column: Stats & Input */}
                    <div className="lg:col-span-4 space-y-12">
                        {/* User Stats */}
                        <section>
                            <h2 className="text-xs font-black tracking-widest text-neutral-400 mb-6 uppercase">신체 정보</h2>
                            <div className="flex gap-8">
                                <div className="group">
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <input
                                            type="number"
                                            value={userStats.height}
                                            onChange={(e) => setUserStats({ ...userStats, height: e.target.value })}
                                            className="text-4xl font-black bg-transparent border-b-2 border-neutral-100 focus:border-black w-24 outline-none transition-colors placeholder-neutral-200"
                                            placeholder="0"
                                        />
                                        <span className="text-sm font-bold text-neutral-400">CM</span>
                                    </div>
                                    <label className="text-xs font-bold text-neutral-900">키</label>
                                </div>
                                <div className="group">
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <input
                                            type="number"
                                            value={userStats.weight}
                                            onChange={(e) => setUserStats({ ...userStats, weight: e.target.value })}
                                            className="text-4xl font-black bg-transparent border-b-2 border-neutral-100 focus:border-black w-24 outline-none transition-colors placeholder-neutral-200"
                                            placeholder="0"
                                        />
                                        <span className="text-sm font-bold text-neutral-400">KG</span>
                                    </div>
                                    <label className="text-xs font-bold text-neutral-900">몸무게</label>
                                </div>
                            </div>
                            <button
                                onClick={handleUpdateStats}
                                disabled={isStatsSaving}
                                className="mt-6 text-xs font-bold text-neutral-400 hover:text-black transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isStatsSaving ? '저장 중...' : '정보 수정'}
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                            </button>
                        </section>

                        {/* Add Item */}
                        <section>
                            <h2 className="text-xs font-black tracking-widest text-neutral-400 mb-6 uppercase">새 아이템 추가</h2>
                            <form onSubmit={handleAdd} className="relative">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="무신사 URL을 입력하세요"
                                    className="w-full pb-4 bg-transparent border-b-2 border-neutral-100 focus:border-black outline-none text-lg font-medium placeholder-neutral-300 transition-colors pr-12"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="absolute right-0 top-0 bottom-4 text-black hover:opacity-50 transition-opacity disabled:opacity-20"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-neutral-200 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                                    )}
                                </button>
                            </form>
                        </section>
                    </div>

                    {/* Right Column: Ideal Size */}
                    <div className="lg:col-span-8">
                        <section className="h-full">
                            <h2 className="text-xs font-black tracking-widest text-neutral-400 mb-8 uppercase">나의 이상적인 핏</h2>
                            {!idealSize || Object.keys(idealSize).length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-neutral-100 rounded-3xl text-neutral-300">
                                    <p className="font-medium">데이터가 충분하지 않습니다</p>
                                    <p className="text-sm mt-2">아이템을 추가하고 '잘 맞음'으로 표시해보세요</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {Object.entries(idealSize).map(([category, stats]: any) => (
                                        <div key={category} className="bg-neutral-50 p-8 rounded-3xl">
                                            <h3 className="text-xl font-black mb-6">{category}</h3>
                                            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                                                {Object.entries(stats).map(([key, val]: any) => (
                                                    <div key={key}>
                                                        <div className="text-xs font-bold text-neutral-400 mb-1 uppercase">{key}</div>
                                                        <div className="text-3xl font-black tracking-tight">{val.avg}</div>
                                                        <div className="text-xs font-medium text-neutral-400 mt-1">
                                                            범위: {val.min} - {val.max}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                {/* Wardrobe List */}
                <section>
                    <div className="flex items-end justify-between mb-12 border-b border-neutral-100 pb-6">
                        <h2 className="text-4xl font-black tracking-tighter">COLLECTION</h2>
                        <span className="text-lg font-bold text-neutral-300">{items.length} ITEMS</span>
                    </div>

                    {items.length === 0 ? (
                        <div className="py-32 text-center">
                            <p className="text-2xl font-bold text-neutral-200">옷장이 비어있습니다.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                            {items.map((item) => (
                                <div key={item.goodsNo} className="group">
                                    {/* Image Card - Wrapped in Link */}
                                    <Link
                                        href={`/search?url=${encodeURIComponent(item.link || `https://www.musinsa.com/app/goods/${item.goodsNo}`)}`}
                                        className="block relative aspect-[3/4] bg-neutral-100 mb-6 overflow-hidden cursor-pointer"
                                    >
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

                                        {/* Hover Actions - Prevent default to avoid navigation when clicking delete */}
                                        <button
                                            onClick={(e) => handleDelete(e, item.goodsNo)}
                                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white text-black rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black hover:text-white z-10"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                                        </button>
                                    </Link>

                                    {/* Info */}
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{item.brand}</div>
                                            {item.category1 && <div className="text-xs font-bold text-neutral-300 uppercase">{item.category1}</div>}
                                        </div>
                                        <h3 className="text-lg font-bold leading-snug mb-4 line-clamp-1 group-hover:line-clamp-none transition-all">
                                            {item.title}
                                        </h3>

                                        {/* Controls */}
                                        <div className="space-y-3 pt-4 border-t border-neutral-100">
                                            {/* Size Select */}
                                            <div className="flex flex-wrap gap-2">
                                                {item.sizeTable?.rows?.map((row: any) => (
                                                    <button
                                                        key={row.name}
                                                        onClick={() => handleUpdateFit(item.goodsNo, item.fitStatus, row.name)}
                                                        className={`px-3 py-1 text-xs font-bold border transition-all ${item.selectedSize === row.name
                                                            ? 'bg-black text-white border-black'
                                                            : 'bg-transparent text-neutral-400 border-neutral-200 hover:border-black hover:text-black'
                                                            }`}
                                                    >
                                                        {row.name}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Fit Select */}
                                            {item.selectedSize && (
                                                <div className="flex gap-1">
                                                    {[
                                                        { id: 'SMALL', label: '작음' },
                                                        { id: 'GOOD', label: '잘 맞음' },
                                                        { id: 'BIG', label: '큼' }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => handleUpdateFit(item.goodsNo, opt.id, item.selectedSize)}
                                                            className={`flex-1 py-2 text-xs font-bold transition-all ${item.fitStatus === opt.id
                                                                ? 'bg-neutral-100 text-black'
                                                                : 'text-neutral-300 hover:text-neutral-500'
                                                                }`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
