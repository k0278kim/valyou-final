import type { GoodsType } from "~/model/goodsType";
import Image from "next/image";
import { useRouter } from "next/router";

type FeedTopBarProps = {
    goodsType: GoodsType;
}

const FeedTopBar = ({ goodsType }: FeedTopBarProps) => {
    return <div className="w-full h-24 bg-gradient-to-b from-black/30 to-transparent flex items-center justify-between px-5">
        <button className="px-5 h-12 flex items-center rounded-full bg-black/30 text-white backdrop-blur-xl flex space-x-2.5">
            <p>{goodsType}</p>
            <Image src="/feed/chevron-down.svg" alt="" width={20} height={20} />
        </button>
        <button
            className="w-12 h-12 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-xl"
        >
            <Image src="/feed/archive-box.svg" alt="" width={20} height={20} />
        </button>
    </div>
}

export default FeedTopBar;