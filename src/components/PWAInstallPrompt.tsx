'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // 1. Check if mobile & standalone
        const checkMobile = () => {
            const userAgent = window.navigator.userAgent;
            const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || window.innerWidth < 768;
            const ios = /iPhone|iPad|iPod/i.test(userAgent);

            // Check if already in PWA mode
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

            if (isStandalone) {
                setIsMobile(false); // Treat as desktop/hidden to suppress prompt
                return;
            }

            setIsMobile(mobile);
            setIsIOS(ios);

            // For iOS, show prompt immediately if not standalone
            if (ios) {
                setShowPrompt(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        // 2. Listen for beforeinstallprompt (Android/Desktop)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show if mobile and NOT iOS (iOS handled above)
            if (isMobile && !isIOS) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [isMobile, isIOS]);

    const handleInstallClick = async () => {
        if (isIOS) {
            // iOS doesn't support programmatic install, just show instructions
            return;
        }

        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-black text-white p-4 rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <Download className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">앱으로 설치하기</h3>
                            <p className="text-xs text-neutral-400">더 빠르고 편리하게 이용하세요</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {isIOS ? (
                    <div className="text-xs text-neutral-300 bg-white/10 p-3 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Share className="w-4 h-4" />
                            <span>1. <strong>공유</strong> 버튼을 누르세요</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <PlusSquare className="w-4 h-4" />
                            <span>2. <strong>홈 화면에 추가</strong>를 선택하세요</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end">
                        <button
                            onClick={handleInstallClick}
                            className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-neutral-200 transition-colors"
                        >
                            설치
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
