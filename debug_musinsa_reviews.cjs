// const fetch = require('node-fetch'); // Native fetch in Node 18+

async function debugMusinsaReviews(goodsNo) {
    const url = `https://goods.musinsa.com/api2/review/v1/view/list?goodsNo=${goodsNo}&page=0&pageSize=10&sort=up_cnt_desc`;
    console.log(`Fetching: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.musinsa.com/'
            }
        });
        const json = await res.json();
        console.log('--- Full JSON ---');
        console.log(JSON.stringify(json, null, 2));
        const list = json.data?.list;

        if (list && list.length > 0) {
            console.log('--- First Review Data ---');
            console.log(JSON.stringify(list[0], null, 2));
        } else {
            console.log('No reviews found.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

// Example goodsNo
const goodsNo = '3773998';
debugMusinsaReviews(goodsNo);
