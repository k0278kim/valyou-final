import type { Goods } from "~/model/goods";

type FeedGoodsBarProps = {
    goods: Goods;
}

const FeedGoodsBar = ({ goods }: FeedGoodsBarProps) => {
    return <div className="w-full h-48 p-5 bg-gradient-to-t from-black/50 to-black/0 flex flex-col justify-center text-white space-y-2.5">
        <p className="text-5xl">{goods.title}</p>
        <p className="text-sm text-white/70 font-light">{goods.description}</p>
    </div>
}

export default FeedGoodsBar;