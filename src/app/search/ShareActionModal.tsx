import { Sparkles, Shirt, ArrowRight, Loader2 } from 'lucide-react';

interface ShareActionModalProps {
    onAnalyze: () => void;
    onAddToCloset: () => void;
    isProcessing?: boolean;
}

export default function ShareActionModal({ onAnalyze, onAddToCloset, isProcessing }: ShareActionModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            {/* Content */}
            <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up">
                <div className="p-8 text-center space-y-2">
                    <h2 className="text-2xl font-black tracking-tight">
                        상품을 발견했습니다!
                    </h2>
                    <p className="text-neutral-500 font-medium">
                        어떤 작업을 하시겠습니까?
                    </p>
                </div>

                <div className="flex flex-col gap-3 p-6 pt-0">
                    <button
                        onClick={onAnalyze}
                        disabled={isProcessing}
                        className="group w-full flex items-center justify-between p-5 bg-black text-white rounded-2xl hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg">분석하기</div>
                                <div className="text-xs text-neutral-400">사이즈, 핏, 리뷰 분석</div>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-neutral-500 group-hover:text-white transition-colors" />
                    </button>

                    <button
                        onClick={onAddToCloset}
                        disabled={isProcessing}
                        className="group w-full flex items-center justify-between p-5 bg-neutral-50 border-2 border-neutral-100 text-black rounded-2xl hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                                {isProcessing ? (
                                    <Loader2 size={20} className="animate-spin text-black" />
                                ) : (
                                    <Shirt size={20} className="text-black" />
                                )}
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg">옷장에 넣기</div>
                                <div className="text-xs text-neutral-400">분석 후 바로 저장</div>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-neutral-300 group-hover:text-black transition-colors" />
                    </button>

                    <button
                        onClick={onAnalyze}
                        className="mt-2 text-xs font-bold text-neutral-400 underline decoration-2 underline-offset-4 hover:text-black transition-colors"
                    >
                        취소하고 그냥 보기
                    </button>
                </div>
            </div>
        </div>
    );
}
