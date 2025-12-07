'use client';

import Link from 'next/link';
import { ArrowLeft, Share, PlusSquare, Smartphone } from 'lucide-react';

export default function ShareGuidePage() {
    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-24">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl z-50 flex items-center justify-between px-8 border-b border-neutral-100">
                <Link href="/search" className="text-2xl font-black tracking-tighter hover:opacity-50 transition-opacity">
                    ClosAI
                </Link>
                <nav className="flex gap-8">
                    <Link href="/search" className="text-sm font-medium text-neutral-400 hover:text-black transition-colors">BACK</Link>
                </nav>
            </header>

            <main className="pt-32 px-8 max-w-2xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
                    iOS 공유 설정 가이드
                </h1>
                <p className="text-neutral-500 font-medium text-lg mb-12 leading-relaxed">
                    아이폰에서는 애플의 정책으로 인해 '단축어'를 설정해야만 앱으로 바로 공유할 수 있습니다.<br />
                    딱 한 번만 설정하면 됩니다!
                </p>

                <div className="space-y-12">
                    {/* Step 1 */}
                    <section className="relative pl-8 border-l-2 border-neutral-100">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-4 border-white shadow-sm" />
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-black">STEP 1</span>
                            <span className="text-neutral-400">단축어 앱 열기</span>
                        </h2>
                        <p className="text-neutral-600 mb-4">
                            아이폰 기본 앱인 <b>'단축어(Shortcuts)'</b> 앱을 실행하고 우측 상단의 <b>+ 버튼</b>을 눌러 새 단축어를 만드세요.
                        </p>
                    </section>

                    {/* Step 2 */}
                    <section className="relative pl-8 border-l-2 border-neutral-100">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-4 border-white shadow-sm" />
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-black">STEP 2</span>
                            <span className="text-neutral-400">동작 추가</span>
                        </h2>
                        <div className="space-y-4 text-neutral-600">
                            <p>다음 순서대로 동작을 추가해주세요:</p>
                            <ol className="list-decimal list-inside space-y-2 font-medium bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                                <li><b>'URL 열기'</b> 동작 검색 및 추가</li>
                                <li>URL 입력창에 아래 주소를 복사해서 붙여넣기:</li>
                                <div className="p-3 bg-white border border-neutral-200 rounded-lg text-xs font-mono break-all select-all cursor-pointer hover:border-black transition-colors"
                                    onClick={() => {
                                        if (typeof window !== 'undefined') {
                                            const url = `${window.location.origin}/search?url=`;
                                            navigator.clipboard.writeText(url + 'ShortcutInput');
                                            alert('주소가 복사되었습니다! 단축어 앱의 URL 입력창에 붙여넣은 뒤, 끝부분의 "ShortcutInput"을 지우고 "단축어 입력" 변수를 넣어주세요.');
                                        }
                                    }}>
                                    {typeof window !== 'undefined' ? `${window.location.origin}/search?url=` : 'https://clos-ai.vercel.app/search?url='}<span className="text-blue-500">[단축어 입력]</span>
                                </div>
                                <li className="text-sm text-neutral-400 pt-2">
                                    * 팁: 주소 끝부분을 누르고, 키보드 위에 뜨는 <b>'단축어 입력'</b> 변수를 선택해서 이어붙여주세요.
                                </li>
                            </ol>
                        </div>
                    </section>

                    {/* Step 3 */}
                    <section className="relative pl-8 border-l-2 border-neutral-100">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-4 border-white shadow-sm" />
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-black">STEP 3</span>
                            <span className="text-neutral-400">공유 시트에서 보기 설정</span>
                        </h2>
                        <p className="text-neutral-600 mb-4">
                            화면 하단의 <b>'i' (정보)</b> 버튼을 누르고 <b>'공유 시트에서 보기'</b>를 켜주세요.<br />
                            이제 무신사 앱에서 공유하기를 누르면 <b>'ClosAI'</b> (또는 만드신 단축어 이름)가 뜰 것입니다!
                        </p>
                    </section>
                </div>

                <div className="mt-16 p-6 bg-black text-white rounded-3xl text-center">
                    <h3 className="font-bold text-lg mb-2">설정이 어려우신가요?</h3>
                    <p className="text-neutral-400 text-sm mb-6">
                        가장 쉬운 방법은 URL을 복사해서 직접 ClosAI 검색창에 붙여넣는 것입니다.
                    </p>
                    <Link href="/search" className="inline-block bg-white text-black px-6 py-3 rounded-full font-bold text-sm hover:bg-neutral-200 transition-colors">
                        검색창으로 돌아가기
                    </Link>
                </div>
            </main>
        </div>
    );
}
