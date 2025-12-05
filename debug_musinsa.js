
async function check(id) {
    try {
        const res = await fetch(`https://goods-detail.musinsa.com/api2/goods/${id}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.musinsa.com/'
            }
        });
        const json = await res.json();
        const data = json.data;
        if (data) {
            console.log(`--- ID: ${id} ---`);
            console.log('Category:', JSON.stringify(data.category, null, 2));
            console.log('Goods Name:', data.goodsNm);
        }
    } catch (e) {
        console.error(`Error for ${id}:`, e.message);
    }
}

const ids = ['2086653', '3773998', '3128245', '3606096', '3568378'];
(async () => {
    for (const id of ids) {
        await check(id);
    }
})();
