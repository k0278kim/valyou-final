// const fetch = require('node-fetch'); // Native fetch in Node 18+

async function debugMusinsa(goodsNo) {
    const url = `https://goods-detail.musinsa.com/api2/goods/${goodsNo}`;
    console.log(`Fetching: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.musinsa.com/'
            }
        });
        const json = await res.json();
        const data = json.data;

        console.log('--- Price Info ---');
        console.log('goodsPrice:', JSON.stringify(data.goodsPrice, null, 2));
        console.log('price:', data.price);
        console.log('salePrice:', data.salePrice);

        console.log('--- Full Data ---');
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('Error:', e);
    }
}

// Example goodsNo (replace with a real one if needed)
const goodsNo = '3773998'; // Example ID, user can change this
debugMusinsa(goodsNo);
