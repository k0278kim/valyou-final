const puppeteer = require('puppeteer');
const fs = require('fs'); // Added for file system operations

(async () => {
    try {
        console.log('🚀 Launching Puppeteer...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('✅ Browser launched');

        const page = await browser.newPage();

        // 쿠키 설정
        const cookies = [
            { name: "_dd_s", value: "rum=0&expire=1764865560059", domain: "www.musinsa.com" },
            { name: "_ds_sessions", value: "y", domain: ".musinsa.com" },
            { name: "mss_mac", value: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1MTAyMGQ0NzE2ZjY1NmFkNTA1MTU1MTBiMDNlMmMyZSIsImhhc2hlZFVpZCI6ImQ0MDQyYTFkYTU2ZjQ2ODFlYjI4ZTUwMGZiODNiOWU1YTQwNzUzMTQ5MjZiYmQxZDE3MDFmMjgzMmM3MjRhYzQiLCJoYXNoZWRFbWFpbCI6ImQ3ZGUwOWJlZDE0MjA4YjlhZWNjYjlmNWMxY2Y4MTUwOWI3NGFhODU1MWVjYWE0YWM0Y2JmOTQ2YzVjZTkxNDUiLCJnZW5kZXIiOiJNIiwib3JkZXJDb3VudCI6IjMiLCJzZWxmQ2VydGlmeSI6dHJ1ZSwiaGFzaElkIjoiNTEwMjBkNDcxNmY2NTZhZDUwNTE1NTEwYjAzZTJjMmUiLCJtZW1iZXJHcm91cExpc3QiOlsiQkFTSUMiXSwib25lbWVtYmVySGFzaElkIjoiZjBkZDg4NDM3NTBlM2EwYTk2MzhhZTE4M2VlZTRmN2NkYjBjYTc1YTVjYjI4NWIxYTY1NzAyZmI2MjgwM2MzOCIsImJpcnRoWWVhciI6IjIwMDMiLCJvcmRlckFtb3VudFJhbmdlIjoiMTDrp4zsm5DrjIAiLCJuaWNrbmFtZSI6IuyekOueke2VmOuKlO2ajOyDieuwse2MqSIsImFnZUJhbmQiOiIyMCIsImdyb3VwTGV2ZWwiOiIyIiwiZXhwIjoxNzk2Mzk5NjIzLCJoYXNoZWRQaG9uZU51bWJlciI6IjIwODYyYzY2MzA2ZjQzNTg4ZmI5MzRjOGU3MzNhNmQ4MjNlNjk3M2FiNTk3OTgyYThjN2JlYzA3YTQwYjEzNTMiLCJpYXQiOjE3NjQ4NjM2MjMsImFkQ29uc2VudFluIjoiWSIsInJlZ2lzdGVyRGF0ZSI6IjIwMjEtMDktMjAiLCJ1c2VyQnVja2V0IjoiNDMxIn0.aU0T9UhPA3OQIl4tQPtmf1gFncg1x_uKkjSuqCBhMjU", domain: ".musinsa.com" },
            { name: "mss_last_login", value: "20251205", domain: ".musinsa.com" },
            { name: "one_pc", value: "TVVTSU5TQQ", domain: ".musinsa.com" }
        ];

        await page.setCookie(...cookies);
        console.log('✅ Cookies set');

        console.log('🚀 Navigating to Musinsa Main...');
        await page.goto('https://www.musinsa.com/app/', { waitUntil: 'networkidle2' });
        console.log('✅ Navigation successful. Current URL:', page.url());

        // 마이페이지 이동 시도
        console.log('🚀 Navigating to My Page...');
        await page.goto('https://my.musinsa.com/login/v1/login', { waitUntil: 'networkidle2' }); // 로그인 되어있으면 리다이렉트 될 것임
        console.log('✅ My Page URL:', page.url());

        // HTML 덤프
        const content = await page.content();
        console.log('📄 HTML Content Length:', content.length);

        // 폼 요소 확인 (이 부분은 이제 로그인 폼이 아닌 마이페이지 폼일 수 있음)
        const formHtml = await page.evaluate(() => {
            const form = document.querySelector('form');
            return form ? form.outerHTML : 'Form not found';
        });
        console.log('📝 Form HTML:', formHtml);

        // 4. 주문 내역 링크 후보 찾기
        console.log('🔍 Searching for ALL Order links...');

        const candidates = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            return links
                .filter(a => a.textContent.includes('주문') || a.textContent.includes('배송'))
                .map(a => ({ text: a.textContent.trim(), href: a.href }));
        });

        console.log('📋 Candidates found:', candidates);

        // 스크린샷 저장 (화면 확인용)
        if (!fs.existsSync('public')) fs.mkdirSync('public');
        await page.screenshot({ path: 'public/debug_mypage_links.png' });
        console.log('📸 Saved screenshot to public/debug_mypage_links.png');

        await browser.close();
        console.log('✅ Browser closed');
    } catch (error) {
        console.error('❌ Puppeteer Error:', error);
    }
})();
