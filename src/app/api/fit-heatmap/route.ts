import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { reviews, imageUrl } = await request.json();
        const GEMINI_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_KEY) {
            return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
        }

        if (!reviews || !Array.isArray(reviews) || reviews.length === 0 || !imageUrl) {
            return NextResponse.json({ points: [] });
        }

        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 1. Analyze reviews to find problem areas
        const reviewsText = reviews.join('\n');
        const analysisPrompt = `
            Analyze the following clothing reviews and identify specific body parts or areas where users frequently mention fit issues (e.g., tight, loose, short, long, wrinkles).
            
            For each issue, provide:
            - area: The specific body part (e.g., "shoulders", "waist", "sleeves", "chest").
            - issue: The type of issue (e.g., "tight", "loose", "wrinkles").
            - intensity: A score from 0-100 indicating how severe or frequent the issue is.
            
            Only include issues with significant mention.
            IMPORTANT: Output 'area' and 'issue' in Korean.
            
            Reviews:
            ${reviewsText}
            
            Output JSON format:
            {
                "issues": [
                    { "area": "어깨", "issue": "낌", "intensity": 80 },
                    ...
                ]
            }
        `;

        const analysisResult = await model.generateContent(analysisPrompt);
        const analysisResponse = await analysisResult.response;
        const analysisText = analysisResponse.text();

        let issues = [];
        try {
            const cleanText = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                issues = JSON.parse(jsonMatch[0]).issues;
            }
        } catch (e) {
            console.error('Error parsing review analysis:', e);
            return NextResponse.json({ points: [] });
        }

        if (issues.length === 0) {
            return NextResponse.json({ points: [] });
        }

        // 2. Locate areas on the image
        // Fetch image as base64
        const imageResp = await fetch(imageUrl);
        const imageBuffer = await imageResp.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');

        const visionPrompt = `
            Look at this image of a clothing item.
            I have identified the following fit issues from user reviews:
            ${JSON.stringify(issues)}
            
            For each issue, locate the corresponding area on the clothing in the image.
            Return the center coordinates (x, y) as percentages (0-100) from the top-left corner.
            Also suggest a radius (0-100) relative to the image size for the heatmap blob.
            
            IMPORTANT: Provide structured information for the tooltip.
            - category: One of ['weight', 'texture', 'fit', 'length', 'wrinkle', 'other'].
            - keyword: A very short, catchy Korean phrase (2-3 words) suitable for an icon label (e.g., "무거움 주의", "마찰 보풀", "박스 핏", "기장 짧음").
            - description: A specific and descriptive Korean explanation of WHY this is an issue. Make it sound like a helpful tip from a friend.
            
            Output JSON format:
            {
                "points": [
                    { 
                        "x": 50, 
                        "y": 20, 
                        "radius": 15, 
                        "intensity": 80, 
                        "category": "fit",
                        "keyword": "어깨 낌 주의",
                        "description": "팔을 들 때 어깨 라인이 타이트하게 느껴질 수 있어요."
                    },
                    ...
                ]
            }
        `;

        const visionResult = await model.generateContent([
            visionPrompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: "image/jpeg" // Assuming JPEG, but Gemini handles most common types
                }
            }
        ]);

        const visionResponse = await visionResult.response;
        const visionText = visionResponse.text();

        let points = [];
        try {
            const cleanText = visionText.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                points = JSON.parse(jsonMatch[0]).points;
            }
        } catch (e) {
            console.error('Error parsing vision analysis:', e);
        }

        return NextResponse.json({ points });

    } catch (error) {
        console.error('Fit Heatmap Error:', error);
        return NextResponse.json({ error: 'Failed to generate heatmap' }, { status: 500 });
    }
}
