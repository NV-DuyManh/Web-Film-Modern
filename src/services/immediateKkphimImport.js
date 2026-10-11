import { collection, getDocFromServer, getDocs, query, limit, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { publicCatalogCache } from './publicCatalogCache';
import { trackedSetDoc, trackedUpdateDoc, catalogChange } from './catalogWrites';
import { createKkphimImporter } from '../utils/kkphimImporter';
import { rentalPriceRange } from '../utils/importRentalPricing';

export async function immediateKkphimImporter() {
    let cached;
    const catalog = async () => {
        if (!cached) {
            const names = ['Movies', 'Categories', 'CategoryTypes', 'Actors', 'Authors'];
            const data = await Promise.all(names.map(name => publicCatalogCache.load(name)));
            const plans = await getDocs(query(collection(db, 'Plans'), limit(30)));
            cached = Object.fromEntries(names.map((name, index) => [name, [...data[index]]]));
            cached.Plans = plans.docs.map(value => ({ ...value.data(), id: value.id }));
            if (!cached.Plans.length || cached.Plans.some(plan => !rentalPriceRange(plan))) throw new Error('Check movie plans and rental prices before importing.');
        }
        return cached;
    };
    const io = {
        read: reference => getDocFromServer(reference),
        query: request => getDocs(request),
        set: (reference, values, options) => trackedSetDoc(reference, values, options),
        update: (reference, values) => trackedUpdateDoc(reference, values),
        async batch(items) {
            const batch = writeBatch(db);
            for (const item of items) {
                batch.set(item.ref, item.values, { merge: item.merge });
                const change = catalogChange(item.ref, item.values);
                if (change) batch.set(change.ref, change.values);
            }
            await batch.commit();
        },
    };
    return createKkphimImporter({ db, io, catalog });
}
