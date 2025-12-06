export interface ProfileItem {
    goodsNo: string;
    title: string;
    brand: string;
    imageUrl: string;
    sizeTable: any;
    category1?: string;
    category2?: string;
    link?: string;
    addedAt?: string;
    fitStatus?: 'GOOD' | 'BIG' | 'SMALL';
    selectedSize?: string;
}

export interface ProfileData {
    items: ProfileItem[];
    userStats: {
        height: string;
        weight: string;
    };
}

const STORAGE_KEY = 'closai_profile_data';
const OLD_STORAGE_KEY = 'valyou_profile_data';

export const storage = {
    get: (): ProfileData => {
        if (typeof window === 'undefined') return { items: [], userStats: { height: '', weight: '' } };

        try {
            // Migration Logic
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) {
                // Check for old data
                const oldData = localStorage.getItem(OLD_STORAGE_KEY);
                if (oldData) {
                    localStorage.setItem(STORAGE_KEY, oldData);
                    // Optional: localStorage.removeItem(OLD_STORAGE_KEY); // Keep for safety for now
                    return JSON.parse(oldData);
                }
                return { items: [], userStats: { height: '', weight: '' } };
            }
            return JSON.parse(data);
        } catch (e) {
            return { items: [], userStats: { height: '', weight: '' } };
        }
    },

    save: (data: ProfileData) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event('closai_storage_change'));
    },

    addItem: (item: Omit<ProfileItem, 'addedAt' | 'fitStatus' | 'selectedSize'>) => {
        const data = storage.get();
        const exists = data.items.find(i => i.goodsNo === item.goodsNo);
        if (!exists) {
            const newItem: ProfileItem = {
                ...item,
                goodsNo: item.goodsNo || '',
                title: item.title || '',
                brand: item.brand || '',
                imageUrl: item.imageUrl || '',
                addedAt: new Date().toISOString(),
                fitStatus: undefined,
                selectedSize: undefined,
                category1: item.category1 || '기타',
                category2: item.category2 || ''
            };
            data.items.push(newItem);
            storage.save(data);
        }
        return data;
    },

    updateFit: (goodsNo: string, fitStatus: 'GOOD' | 'BIG' | 'SMALL', selectedSize: string) => {
        const data = storage.get();
        const index = data.items.findIndex(i => i.goodsNo === goodsNo);
        if (index !== -1) {
            const updatedItem: ProfileItem = {
                ...data.items[index],
                fitStatus,
                selectedSize
            };
            data.items[index] = updatedItem;
            storage.save(data);
        }
        return data;
    },

    deleteItem: (goodsNo: string) => {
        const data = storage.get();
        data.items = data.items.filter(i => i.goodsNo !== goodsNo);
        storage.save(data);
        return data;
    },

    updateStats: (height: string, weight: string) => {
        const data = storage.get();
        data.userStats = { height, weight };
        storage.save(data);
        return data;
    },

    calculateIdealSize: (items: ProfileItem[]) => {
        const goodItems = items.filter(i => i.fitStatus === 'GOOD' && i.selectedSize && i.sizeTable);
        if (goodItems.length === 0) return null;

        // Group by category1
        const categoryStats: any = {};

        goodItems.forEach(item => {
            const cat = item.category1 || '기타';
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
};
