'use client'

import type { GoodsType } from "~/model/goodsType";
import FeedTopBar from "../_components/feed/topBar";
import { useState } from "react";
import FeedGoodsBar from "../_components/feed/goodsBar";
import type { Goods } from "~/model/goods";
import Image from "next/image";

const FeedPage = () => {

    const [goodsType, setGoodsType] = useState<GoodsType>("OUTERWEAR");
    const [goods, setGoods] = useState<Goods>({
        title: "WINTER MOOD",
        description: "Timeless elegance meets modern sophistication",
        price: 1000,
        thumbnailUrl: "https://i.pinimg.com/736x/cb/52/75/cb5275b47f7b70e763f39ca83aa324a9.jpg",
        type: "OUTERWEAR"
    });

    return <div className="w-full h-full flex relative">
        <div className="absolute top-0 w-full z-50">
            <FeedTopBar goodsType={goodsType} />
        </div>
        <div className="w-full h-full relative">
            <Image src={goods.thumbnailUrl} alt="" fill className="w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-0 w-full z-50">
            <FeedGoodsBar goods={goods} />
        </div>
    </div>
}

export default FeedPage;