import { collection, getDocFromServer, getDocs, query, limit, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { publicCatalogCache } from './publicCatalogCache';
import { trackedSetDoc, trackedUpdateDoc, catalogChange } from './catalogWrites';
import { createKkphimImporter } from '../utils/kkphimImporter';
import { rentalPriceRange } from '../utils/importRentalPricing';
import { publicCatalogRecord } from '../utils/publicCatalogFields';

export async function immediateKkphimImporter() {
    let cached;
    const pendingMovies = new Map();
    const rememberPending = snapshot => {
        if (snapshot.ref.parent.id === 'Movies' && snapshot.data()?.crawlImportState === 'pending') pendingMovies.set(snapshot.ref.id, snapshot.data());
        return snapshot;
    };
    const savePending = async (reference, values, update = false) => {
        const batch = writeBatch(db);
        if (update) batch.update(reference, values);
        else batch.set(reference, values);
        const change = catalogChange(reference, values);
        if (change) batch.set(change.ref, change.values);
        await batch.commit();
        const movie = { ...pendingMovies.get(reference.id), ...values, id: reference.id };
        if (movie.crawlImportState === 'complete') {
            pendingMovies.delete(reference.id);
            publicCatalogCache.patch('Movies', publicCatalogRecord(movie));
        } else pendingMovies.set(reference.id, movie);
    };
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
        read: async reference => rememberPending(await getDocFromServer(reference)),
        query: async request => {
            const snapshot = await getDocs(request);
            snapshot.docs.forEach(rememberPending);
            return snapshot;
        },
        set: (reference, values, options) => reference.parent.id === 'Movies' && values.crawlImportState === 'pending'
            ? savePending(reference, values) : trackedSetDoc(reference, values, options),
        update: (reference, values) => reference.parent.id === 'Movies' && pendingMovies.has(reference.id)
            ? savePending(reference, values, true) : trackedUpdateDoc(reference, values),
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
