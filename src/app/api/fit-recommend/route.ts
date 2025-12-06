import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    try {
        const { userStats, productTitle, sizeTable, recommendedSize } = await request.json();

        if (!userStats || !recommendedSize) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
        You are a fashion fit expert.
        User Stats: Height ${userStats.height}cm, Weight ${userStats.weight}kg.
        Product: ${productTitle}
        Recommended Size: ${recommendedSize}
        Size Table: ${JSON.stringify(sizeTable)}

        Based on the user's body stats and the product's size table (especially for the recommended size), predict the fit.
        
        RETURN JSON FORMAT ONLY:
        {
            "positive": "One sentence explaining the good points of the fit (e.g., length is perfect, shoulders fit well). in Korean",
            "concern": "One sentence explaining potential concerns (e.g., sleeves might be slightly long, chest might be tight). If none, say '특별한 우려 사항은 없습니다.' in Korean"
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        let prediction = { positive: '', concern: '' };
        try {
            prediction = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            prediction = { positive: text, concern: '' }; // Fallback
        }

        return NextResponse.json({ success: true, fitPrediction: prediction });
    } catch (error) {
        console.error('Fit prediction error:', error);
        return NextResponse.json({ error: 'Failed to generate fit prediction' }, { status: 500 });
    }
}
