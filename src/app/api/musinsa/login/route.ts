import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';

export async function POST(request: Request) {
    try {
        const { id, password } = await request.json();

        if (!id || !password) {
            return NextResponse.json({ error: '아이디와 비밀번호를 입력해주세요.' }, { status: 400 });
        }

        console.log('🚀 Puppeteer 시작: 로그인 시도');

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // 1. 로그인 페이지 이동
        await page.goto('https://my.musinsa.com/login/v1/login?referer=https%3A%2F%2Fwww.musinsa.com%2F', {
            waitUntil: 'networkidle2'
        });

        // 2. 아이디/비번 입력
        await page.waitForSelector('input[type="text"].login-v2-input__input');
        await page.type('input[type="text"].login-v2-input__input', id);
        await page.type('input[type="password"].login-v2-input__input', password);

        // 3. 로그인 버튼 클릭
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('button.login-v2-button__item--black')
        ]);

        // 로그인 성공 여부 확인
        const currentUrl = page.url();
        if (currentUrl.includes('login')) {
            await browser.close();
            return NextResponse.json({ error: '로그인에 실패했습니다. 아이디/비밀번호를 확인해주세요.' }, { status: 401 });
        }

        console.log('✅ 로그인 성공, 주문 내역 페이지 이동');

        // 4. 주문 내역 페이지로 이동 (사용자 제보 URL)
        const orderUrl = 'https://www.musinsa.com/order/order-list';
        await page.goto(orderUrl, { waitUntil: 'networkidle2' });

        console.log('📄 Current URL:', page.url());

        // 리다이렉트 확인
        const title = await page.title();
        console.log('📄 Current Page Title:', title);

        if (title.includes('공지사항') || title.includes('Notice')) {
            console.log('⚠️ Redirected to Notice page. This might indicate an issue or a temporary notice page.');
            // No dynamic link finding, just log the redirect.
        }

        // 5. 주문 내역 스크래핑 전 HTML 저장 (디버깅용)
        const html = await page.content();
        fs.writeFileSync('public/debug_order_list.html', html);
        console.log('📄 Saved HTML to public/debug_order_list.html');

        // 5. 주문 내역 스크래핑
        const orders = await page.evaluate(() => {
            const items = document.querySelectorAll('.n-order-item');
            const result: any[] = [];

            items.forEach(item => {
                const title = item.querySelector('.info .name')?.textContent?.trim();
                const brand = item.querySelector('.info .brand')?.textContent?.trim();
                const price = item.querySelector('.price')?.textContent?.trim();
                const status = item.querySelector('.status')?.textContent?.trim();
                const image = item.querySelector('.img img')?.getAttribute('src');
                const date = item.closest('.n-order-group')?.querySelector('.date')?.textContent?.trim();

                if (title) {
                    result.push({ title, brand, price, status, image, date });
                }
            });
            return result;
        });

        console.log(`📦 Scraped ${orders.length} orders`);

        // 디버깅: 주문이 없으면 스크린샷 저장
        if (orders.length === 0) {
            await page.screenshot({ path: 'public/debug_empty_orders.png' });
        }

        await browser.close();

        return NextResponse.json({ success: true, orders });

    } catch (error: any) {
        console.error('Puppeteer Error:', error);
        return NextResponse.json({ error: '서버 에러가 발생했습니다.' }, { status: 500 });
    }
}
