
// const fetch = require('node-fetch'); // Using global fetch

const BASE_URL = 'http://localhost:3000/api/profile';

async function verify() {
    try {
        // 1. Add Top Item
        console.log('Adding Top Item...');
        await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'ADD_ITEM',
                item: {
                    goodsNo: 'TEST_TOP_1',
                    title: 'Test Top 1',
                    brand: 'Test Brand',
                    imageUrl: '',
                    category1: '상의',
                    category2: '티셔츠',
                    sizeTable: {
                        headers: ['총장', '가슴단면'],
                        rows: [{ name: 'L', values: [70, 55] }]
                    }
                }
            })
        });

        // 2. Add Outer Item
        console.log('Adding Outer Item...');
        await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'ADD_ITEM',
                item: {
                    goodsNo: 'TEST_OUTER_1',
                    title: 'Test Outer 1',
                    brand: 'Test Brand',
                    imageUrl: '',
                    category1: '아우터',
                    category2: '코트',
                    sizeTable: {
                        headers: ['총장', '가슴단면'],
                        rows: [{ name: 'L', values: [100, 60] }]
                    }
                }
            })
        });

        // 3. Set Fit for Top (Good)
        console.log('Setting Fit for Top...');
        await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'UPDATE_FIT',
                item: { goodsNo: 'TEST_TOP_1', fitStatus: 'GOOD', selectedSize: 'L' }
            })
        });

        // 4. Set Fit for Outer (Good)
        console.log('Setting Fit for Outer...');
        await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'UPDATE_FIT',
                item: { goodsNo: 'TEST_OUTER_1', fitStatus: 'GOOD', selectedSize: 'L' }
            })
        });

        // 5. Get Profile and Check Ideal Size
        console.log('Fetching Profile...');
        const res = await fetch(BASE_URL);
        const json = await res.json();

        console.log('Ideal Size Result:', JSON.stringify(json.data.idealSize, null, 2));

        if (json.data.idealSize['상의'] && json.data.idealSize['아우터']) {
            console.log('SUCCESS: Ideal sizes are grouped by category!');
        } else {
            console.error('FAILURE: Ideal sizes are NOT grouped correctly.');
        }

        // Cleanup
        console.log('Cleaning up...');
        await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'DELETE_ITEM', item: { goodsNo: 'TEST_TOP_1' } })
        });
        await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'DELETE_ITEM', item: { goodsNo: 'TEST_OUTER_1' } })
        });

    } catch (err) {
        console.error('Verification Failed:', err);
    }
}

verify();
