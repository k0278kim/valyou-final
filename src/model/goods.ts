import type { GoodsType } from "./goodsType";

export type Goods = {
    title: string;
    description: string;
    thumbnailUrl: string;
    price: number;
    type: GoodsType;
}