import { fail } from './service.js';
import { rentalExpiry } from '../../src/utils/rentalPolicy.js';

// The owner uses checkout as a demo. This records simulated access only; it
// never contacts PayPal, verifies a real capture or requires a client secret.
export function createPaymentService(db) {
    async function recordDemo(identity, { kind, productId, packageId, transactionId }) {
        if (!/^[A-Z0-9]{8,64}$/.test(transactionId || '')) fail(400, 'Invalid demo transaction');
        const orderId = `DEMO_${transactionId}`;
        const ledgerRef = db.collection('PaymentLedger').doc(orderId);
        const completed = await ledgerRef.get();
        if (completed.exists) {
            if (completed.data().userId !== identity.user.id || completed.data().productId !== productId || completed.data().kind !== kind) fail(403, 'Demo transaction belongs to another account or product');
            return completed.data();
        }
        if (!['rental', 'subscription', 'deposit'].includes(kind) || !/^[\w-]{1,128}$/.test(productId || '')) fail(400, 'Invalid payment product');
        const deposit = { '1': { price: 52000, amountR: 40 }, '2': { price: 130000, amountR: 110 }, '3': { price: 260000, amountR: 250 } }[productId];
        const product = kind === 'deposit' ? { exists: !!deposit, data: () => deposit } : await db.collection(kind === 'rental' ? 'Movies' : 'Plans').doc(productId).get();
        if (!product.exists) fail(404, 'Product not found');
        let price = Number(product.data()[kind === 'rental' ? 'rent' : 'price']);
        let months;
        if (kind === 'subscription') {
            let duration;
            if (/^[\w-]{1,128}$/.test(packageId || '')) {
                const saved = await db.collection('Packages').doc(packageId).get();
                if (saved.exists && saved.data().planID === productId) duration = saved.data();
            }
            if (!duration) {
                const actualPackages = await db.collection('Packages').where('planID', '==', productId).limit(1).get();
                if (!actualPackages.empty) fail(400, 'Invalid subscription duration');
                duration = { '1': { time: 1, discount: 15 }, '2': { time: 2, discount: 20 }, '6': { time: 6, discount: 25 } }[packageId];
            }
            months = Number(duration?.time);
            const discount = Number(duration?.discount || 0);
            if (!Number.isInteger(months) || months < 1 || months > 36 || discount < 0 || discount >= 100 || Number(product.data().level) <= 0) fail(400, 'Invalid subscription duration');
            price *= months * (1 - discount / 100);
        } else if (kind === 'rental') {
            const planId = product.data().planID;
            if (planId) {
                const plan = await db.collection('Plans').doc(planId).get();
                if (plan.exists && Number(plan.data().level) === 0) fail(400, 'Free movies do not need a rental');
            }
        }
        if (!(price > 0 && price <= 100_000_000)) fail(400, 'Price unavailable');
        const amount = (price / 26000).toFixed(2);
        if (Number(amount) <= 0) fail(400, 'Price unavailable');
        const intent = { kind, productId, amount, price, months };
        const captureId = transactionId;
        return db.runTransaction(async tx => {
            const prior = await tx.get(ledgerRef);
            if (prior.exists) {
                if (prior.data().userId !== identity.user.id || prior.data().productId !== productId || prior.data().kind !== kind) fail(403, 'Demo transaction belongs to another account or product');
                return prior.data();
            }
            const userRef = db.collection('Users').doc(identity.user.id);
            const user = await tx.get(userRef);
            if (!user.exists) fail(404, 'Account not found');
            const now = Date.now();
            let result;
            if (intent.kind === 'deposit') {
                tx.update(userRef, { rBalance: (Number(user.data().rBalance) || 0) + deposit.amountR });
                tx.set(db.collection('Deposits').doc(orderId), { userID: identity.user.id, transactionID: orderId, paymentMode: 'demo', amountR: deposit.amountR, priceUSD: Number(amount), paymentMethod: 'PayPal', date: new Date(now), status: 'Success' });
                result = { orderId, kind, amountR: deposit.amountR };
            } else if (intent.kind === 'rental') {
                const existing = user.data().rentedMovies || [];
                const previous = existing.find(item => item?.movieID === intent.productId);
                const expireDate = rentalExpiry(previous?.expireDate, now);
                const rent = { movieID: intent.productId, transactionId: orderId, rentDate: new Date(now).toISOString(), expireDate };
                tx.update(userRef, { rentedMovies: [...existing.filter(item => item?.movieID !== intent.productId && item !== intent.productId), rent], updatedAt: now });
                tx.set(db.collection('RentMovies').doc(orderId), { id: orderId, userID: identity.user.id, movieID: intent.productId, transactionID: orderId, captureID: captureId, price: intent.amount, paymentMethod: 'PayPal', paymentMode: 'demo', rentDate: rent.rentDate, expireDate, startDate: new Date(now), expiryDate: new Date(expireDate), status: 'Success', createdAt: now });
                result = { orderId, kind: intent.kind, expireDate };
            } else {
                const query = db.collection('Subscriptions').where('userID', '==', identity.user.id).where('planID', '==', intent.productId).limit(100);
                const subs = await tx.get(query);
                let base = now;
                for (const doc of subs.docs) {
                    const expiry = doc.data().expiryDate;
                    const time = expiry?.toMillis ? expiry.toMillis() : new Date(expiry).getTime();
                    if (time > base && doc.data().status === 'Success') base = time;
                }
                if (subs.size === 100) fail(409, 'Subscription history needs administrator review');
                const expiryDate = new Date(base); expiryDate.setMonth(expiryDate.getMonth() + intent.months);
                tx.set(db.collection('Subscriptions').doc(orderId), { id: orderId, userID: identity.user.id, planID: intent.productId, transactionID: orderId, captureID: captureId, paymentMethod: 'PayPal', paymentMode: 'demo', price: intent.amount, startDate: new Date(now), expiryDate, status: 'Success', createdAt: now });
                result = { orderId, kind: intent.kind, expiryDate: expiryDate.toISOString() };
            }
            tx.set(ledgerRef, { ...result, paymentMode: 'demo', productId, userId: identity.user.id, captureId, createdAt: now });
            return result;
        });
    }
    return { recordDemo };
}
