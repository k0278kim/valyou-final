import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'profile.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read data
function getProfileData() {
    if (!fs.existsSync(DATA_FILE)) {
        return { items: [], userStats: { height: '', weight: '' } };
    }
    try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(fileContent);
        if (!data.userStats) data.userStats = { height: '', weight: '' };
        return data;
    } catch (e) {
        return { items: [], userStats: { height: '', weight: '' } };
    }
}

// Helper to write data
function saveProfileData(data: any) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper to calculate ideal size by category
function calculateIdealSize(items: any[]) {
    const goodItems = items.filter(i => i.fitStatus === 'GOOD' && i.selectedSize && i.sizeTable);
    if (goodItems.length === 0) return null;

    // Group by category1
    const categoryStats: any = {};

    goodItems.forEach(item => {
        const cat = item.category1 || '기타'; // Default to '기타' if missing
        if (!categoryStats[cat]) categoryStats[cat] = {};

        const sizeRow = item.sizeTable.rows.find((r: any) => r.name === item.selectedSize);
        if (!sizeRow) return;

        item.sizeTable.headers.forEach((header: string, idx: number) => {
            const val = parseFloat(sizeRow.values[idx]);
            if (!isNaN(val)) {
                if (!categoryStats[cat][header]) categoryStats[cat][header] = { sum: 0, count: 0, min: val, max: val };
                categoryStats[cat][header].sum += val;
                categoryStats[cat][header].count += 1;
                categoryStats[cat][header].min = Math.min(categoryStats[cat][header].min, val);
                categoryStats[cat][header].max = Math.max(categoryStats[cat][header].max, val);
            }
        });
    });

    const result: any = {};
    for (const cat in categoryStats) {
        result[cat] = {};
        for (const key in categoryStats[cat]) {
            result[cat][key] = {
                avg: (categoryStats[cat][key].sum / categoryStats[cat][key].count).toFixed(1),
                min: categoryStats[cat][key].min,
                max: categoryStats[cat][key].max
            };
        }
    }
    return result;
}

export async function GET() {
    const data = getProfileData();
    const idealSize = calculateIdealSize(data.items);
    return NextResponse.json({ success: true, data: { ...data, idealSize } });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, item } = body;

        const data = getProfileData();

        if (action === 'ADD_ITEM') {
            // Check if item already exists
            const exists = data.items.find((i: any) => i.goodsNo === item.goodsNo);
            if (!exists) {
                data.items.push({
                    ...item,
                    addedAt: new Date().toISOString(),
                    fitStatus: null, // 'GOOD', 'BIG', 'SMALL'
                    selectedSize: null,
                    category1: item.category1 || '기타',
                    category2: item.category2 || ''
                });
            }
        } else if (action === 'UPDATE_FIT') {
            const { goodsNo, fitStatus, selectedSize } = item;
            const targetIndex = data.items.findIndex((i: any) => i.goodsNo === goodsNo);
            if (targetIndex !== -1) {
                data.items[targetIndex] = {
                    ...data.items[targetIndex],
                    fitStatus,
                    selectedSize
                };
            }
        } else if (action === 'DELETE_ITEM') {
            const { goodsNo } = item;
            data.items = data.items.filter((i: any) => i.goodsNo !== goodsNo);
        } else if (action === 'UPDATE_STATS') {
            const { height, weight } = body;
            data.userStats = { height, weight };
        }

        saveProfileData(data);
        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

