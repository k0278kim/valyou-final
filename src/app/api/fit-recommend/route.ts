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

        Based on the user's body stats and the product's size table (especially for the recommended size), predict the fit (e.g., Overfit, Regular fit, Slim fit, etc.) and explain how it will feel in 1 sentence in Korean.
        Focus on length and width.
        Example output: "기장감은 적당하지만 품이 넉넉하여 세미 오버핏으로 편안하게 연출될 것 같아요."
        Keep it concise and helpful.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ success: true, fitPrediction: text.trim() });
    } catch (error) {
        console.error('Fit prediction error:', error);
        return NextResponse.json({ error: 'Failed to generate fit prediction' }, { status: 500 });
    }
}
