// @ts-nocheck
// Node 18+ has global fetch

// User provided cookies
const cookies = [
    { name: "_dd_s", value: "rum=0&expire=1764865560059" },
    { name: "_ds_sessions", value: "y" },
    { name: "cf_clearance", value: "ZpTDzagxKrUY8nFNcq9S3QRwbSthEYK6Y9wv0FOlZ20-1764864661-1.2.1.1-ZXKGanHQrQoY0y0KC4fwYDRCr6BDLgK.7j4rCVgY45auZL39AYrz9lhfPIIufTdb3GTgttR.aQrnKtvpUG7ZrmUgY8MeWRLxzibT.7vUamEdSVCWm09Srnvv6XJaHP0AJYFqfpOjTAPXM6WmKNrkBXRXp5_RDMLfpzyj2PyDtNTL_ThQv3.M6Y.bGjupMRQZYp1i7HEhoRftdqh_M2AV_3nsfGC1C8BccutGpJoRx1A" },
    { name: "SCOUTER", value: "x3mur8n1ufhnm8" },
    { name: "tr[pv]", value: "2" },
    { name: "cart_no", value: "HrHUn%2Bt%2BfbQyIH9NWgahkno6Cyq6qXOrCu0FR0x1Bts%3D" },
    { name: "_pin_unauth", value: "dWlkPVptTmtORFJqT1RJdE9EZGxOQzAwTTJabUxUZ3pObU10WmpBM05tUXpOREExWkRoag" },
    { name: "_fbp", value: "fb.1.1764864661575.996590291350691053" },
    { name: "mss_mac", value: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1MTAyMGQ0NzE2ZjY1NmFkNTA1MTU1MTBiMDNlMmMyZSIsImhhc2hlZFVpZCI6ImQ0MDQyYTFkYTU2ZjQ2ODFlYjI4ZTUwMGZiODNiOWU1YTQwNzUzMTQ5MjZiYmQxZDE3MDFmMjgzMmM3MjRhYzQiLCJoYXNoZWRFbWFpbCI6ImQ3ZGUwOWJlZDE0MjA4YjlhZWNjYjlmNWMxY2Y4MTUwOWI3NGFhODU1MWVjYWE0YWM0Y2JmOTQ2YzVjZTkxNDUiLCJnZW5kZXIiOiJNIiwib3JkZXJDb3VudCI6IjMiLCJzZWxmQ2VydGlmeSI6dHJ1ZSwiaGFzaElkIjoiNTEwMjBkNDcxNmY2NTZhZDUwNTE1NTEwYjAzZTJjMmUiLCJtZW1iZXJHcm91cExpc3QiOlsiQkFTSUMiXSwib25lbWVtYmVySGFzaElkIjoiZjBkZDg4NDM3NTBlM2EwYTk2MzhhZTE4M2VlZTRmN2NkYjBjYTc1YTVjYjI4NWIxYTY1NzAyZmI2MjgwM2MzOCIsImJpcnRoWWVhciI6IjIwMDMiLCJvcmRlckFtb3VudFJhbmdlIjoiMTDrp4zsm5DrjIAiLCJuaWNrbmFtZSI6IuyekOueke2VmOuKlO2ajOyDieuwse2MqSIsImFnZUJhbmQiOiIyMCIsImdyb3VwTGV2ZWwiOiIyIiwiZXhwIjoxNzk2Mzk5NjIzLCJoYXNoZWRQaG9uZU51bWJlciI6IjIwODYyYzY2MzA2ZjQzNTg4ZmI5MzRjOGU3MzNhNmQ4MjNlNjk3M2FiNTk3OTgyYThjN2JlYzA3YTQwYjEzNTMiLCJpYXQiOjE3NjQ4NjM2MjMsImFkQ29uc2VudFluIjoiWSIsInJlZ2lzdGVyRGF0ZSI6IjIwMjEtMDktMjAiLCJ1c2VyQnVja2V0IjoiNDMxIn0.aU0T9UhPA3OQIl4tQPtmf1gFncg1x_uKkjSuqCBhMjU" },
    { name: "mss_last_login", value: "20251205" },
    { name: "_ga_8PEGV51YTJ", value: "GS2.1.s1764864657$o1$g1$t1764864661$j56$l0$h0" },
    { name: "app_rtk", value: "ba297d5c7f45e1eab8f7f19fab46eef5cb9d023c" },
    { name: "_kmpid", value: "km|musinsa.com|1764864657539|7d2948e5-d8cf-4eeb-913c-7a83021baebd" },
    { name: "tr[vd]", value: "1764864657" },
    { name: "_ga", value: "GA1.1.1640565815.1764864658" },
    { name: "_gcl_au", value: "1.1.2137019068.1764864658" },
    { name: "__cf_bm", value: "vIUB1w4rTAQ7itFrZruC1vFI_R3n7HhKdYXuUzlbdQo-1764864656-1.0.1.1-ZpgEVG.5LhBTvVphCt3GSIDcGLqASrTpnsboEPoWTv38im.FDG770MiHol_mM5DGYzmGaZz3HEl8a.r5YLnL5z7.bvTrBqYtgYoli2fqyu8" },
    { name: "tr[vid]", value: "6931b291517358.41665970" },
    { name: "wcs_bt", value: "s_eacb1da8e76:1764864661" },
    { name: "app_atk", value: "Tq3hkmJlYC8Tzb2lexjr2YppqInQeggnPKdDm9GLsnBlxSPAeq%2B6I7uUpMUUkuW5QVRJH8KxWhCoquGMi7v7TpWgAFky8msBvMLtfFOSYjfeRQCWl%2FcgwSdGn%2F%2FohYvQIWX3JCVhhoORi7gM2ebfTKwpEmQbjnSHieYNQzKgk%2BpFk6IuKIuMXNOAoax4E6xLYuf7aLGnWYNDKMoFsmKR7Eb7LkSrODyby9LK%2B6%2Fmuxky%2Frrx1rFmDxQ8DHO25EogYUDyyTUthoQVy7HZyRoof%2FB9zgUF2da3PufhVshTfsQE6rUw9gLAmJGhmVvwBZo7rpdb5r8v1zrTwoGKjxZiJMsrVvmasWfrin%2B3Z5KNqbI6u5V654Vs8MTqW%2Bw5r0KfCLo69ein6vR3vvl9YrFCaU76aLEcteWswWaMAVYZK8AUfWStnn5casXeEQaVKZqRjhWpyqrZ6%2BexCIW8hE8NuCd3TWG2%2BiTnMNqkhBa5slzgNDxFPjV%2F2vi%2B2io9DCpLzBLZ3d%2FzGQZwuH0E18P3%2Bs1Qk3PKLNvIGwBX9rgihfDRv%2FZRI1hirolbxz2rhG91yhgqI5iX5Xxxger2eDr10vUxya7UZAATSTa7nwlZcieNu1dOJXt9fMPLFYYlbb3koWyg5%2B3dXgYss8LWrKwb7Jan7YJ%2FIMuZ8Wd%2BK2DkpREZb6kVO8PVxn0I4jYuMbTtfcOR9Wcj6RhTqtx2fqu3QtvHAq%2FG2vqD%2BnU4aP6PeCovxLT5pq3sTnBxC9CJG%2BYl" },
    { name: "tr[vt]", value: "1764864657" },
    { name: "_fwb", value: "68vCn8XfjJVXDmFTwYFuYg.1764864661487" },
    { name: "_gf", value: "A" },
    { name: "one_pc", value: "TVVTSU5TQQ" },
    { name: "tr[vc]", value: "1" }
];

const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

const urls = [
    'https://my.musinsa.com/order/list',
    'https://www.musinsa.com/app/mypage/order_list',
    'https://my.musinsa.com/order/history',
    'https://my.musinsa.com/order/v1/list'
];

(async () => {
    for (const url of urls) {
        try {
            console.log(`Testing ${url}...`);
            const res = await fetch(url, {
                headers: {
                    'Cookie': cookieHeader,
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            console.log(`Status: ${res.status}`);
            if (res.ok) {
                console.log('✅ Success!');
                // const html = await res.text();
                // console.log(html.substring(0, 200));
            } else {
                console.log('❌ Failed');
            }
        } catch (e) {
            console.error('Error:', e.message);
        }
        console.log('---');
    }
})();
