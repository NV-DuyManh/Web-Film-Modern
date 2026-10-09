import { doc, getDocFromServer, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { CRAWLER_ACTIVE, CRAWLER_SETTINGS_ID, createCrawlerJob } from '../utils/crawlerJob';

const jobRef = () => doc(db, 'Settings', CRAWLER_SETTINGS_ID);
export const subscribeCrawlerJob = (callback, onError) => onSnapshot(jobRef(), snapshot => callback(snapshot.data()), onError);

export async function queueCrawlerJob(options) {
    const current = (await getDocFromServer(jobRef())).data();
    if (current && CRAWLER_ACTIVE.includes(current.status)) throw new Error('A cloud crawl is already active.');
    const job = createCrawlerJob(options, crypto.randomUUID());
    job.logs = [{ message: 'Queued on cloud. You can leave this page or close the browser. Scheduled workers may take a few minutes to start.', type: 'info', time: new Date().toLocaleTimeString('en-GB') }];
    await setDoc(jobRef(), job);
}

export async function controlCrawlerJob(action) {
    if (!['run', 'pause', 'stop'].includes(action)) throw new Error('Invalid crawler control.');
    const current = (await getDocFromServer(jobRef())).data();
    if (!current || !CRAWLER_ACTIVE.includes(current.status)) return;
    const locked = Number(current.lockUntil) > Date.now();
    await updateDoc(jobRef(), { control: action, ...(action === 'run' ? { status: locked ? 'running' : 'queued' }
        : !locked ? { status: action === 'pause' ? 'paused' : 'stopped' } : {}) });
}
