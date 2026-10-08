import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import useAdminCursor from '../../../hooks/useAdminCursor';
import AdminCursorFooter from '../../../components/admin/AdminCursorFooter';
import { notifyAdmin, restoreAdminTrash } from '../../../services/adminOperations';
import { dateMillis } from '../../../utils/adminData';

const time = value => Number.isFinite(dateMillis(value)) ? new Date(dateMillis(value)).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa ghi nhận';
const actions = { create: 'Thêm', update: 'Sửa', trash: 'Chuyển vào thùng rác', restore: 'Khôi phục' };

function JobCard({ name, document, schedule }) {
    const [state, setState] = useState({ loading: true });
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
    useEffect(() => onSnapshot(doc(db, 'Settings', document), snapshot => setState({ loading: false, data: snapshot.data() || {} }), () => setState({ loading: false, error: 'Không tải được trạng thái tác vụ.' })), [document]);
    const data = state.data || {};
    const failed = Number(data.lastErrorAt || 0) > Number(data.lastSuccessAt || 0);
    const running = Number(data.lockUntil || 0) > now;
    const next = new Date(now);
    if (document === 'CatalogMaintenance') { next.setUTCHours(19, 23, 0, 0); if (next.getTime() <= now) next.setUTCDate(next.getUTCDate() + 1); }
    else { next.setUTCSeconds(0, 0); const minute = next.getUTCMinutes(); next.setUTCMinutes(minute < 17 ? 17 : minute < 47 ? 47 : 77); }
    return <div className="p-4 bg-slate-900/80 rounded-xl border border-cyan-500/20">
        <h3 className="font-bold text-cyan-300">{name}</h3><p className="text-sm text-slate-400 mt-1">{schedule} · Giờ Việt Nam</p>
        <p role={state.error || failed ? 'alert' : 'status'} className={`mt-3 ${state.error || failed ? 'text-red-300' : 'text-emerald-300'}`}>{state.loading ? 'Đang tải...' : state.error || (running ? 'Đang chạy' : failed ? 'Lần chạy gần nhất có lỗi' : data.lastSuccessAt ? 'Lần chạy gần nhất thành công' : 'Chưa có kết quả được ghi nhận')}</p>
        <p className="text-sm text-slate-400 mt-2">Lần tiếp theo dự kiến: {time(next)}</p>
        <p className="text-sm text-slate-300 mt-2">Thành công gần nhất: {time(data.lastSuccessAt)}</p>
        {data.lastErrorAt && <p className="text-sm text-amber-300 mt-1">Lỗi gần nhất: {time(data.lastErrorAt)} · {data.lastError || 'Chưa có chi tiết'}</p>}
        {data.lastSummary && <div className="flex flex-wrap gap-3 text-sm text-slate-300 mt-3">{Object.entries(data.lastSummary).map(([key, value]) => <span key={key}>{({ checked: 'Đã kiểm tra', repaired: 'Đã bổ sung gói/giá', archivedDuplicates: 'Bản trùng đã lưu', protectedDuplicates: 'Bản trùng giữ lại', movies: 'Phim cập nhật', added: 'Tập mới', fixed: 'Link đã sửa' })[key] || key}: <b className="text-amber-300">{value}</b></span>)}</div>}
    </div>;
}

export default function Operations() {
    const [tab, setTab] = useState('jobs');
    const [revision, setRevision] = useState(0);
    const [restoring, setRestoring] = useState('');
    const [confirm, setConfirm] = useState(null);
    return <div className="p-4 text-slate-200">
        <h1 className="text-3xl font-bold glow-text mb-5">Vận hành</h1>
        <div className="flex flex-wrap gap-3 mb-5">{[['jobs', 'Tác vụ ngầm'], ['trash', 'Thùng rác'], ['audit', 'Lịch sử thao tác']].map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`rounded-xl border px-4 py-2 ${tab === key ? 'border-amber-400 text-amber-300 bg-amber-400/10' : 'border-slate-600 bg-slate-900'}`}>{label}</button>)}</div>
        {tab === 'jobs' ? <div className="grid gap-4"><JobCard name="Bảo trì danh mục phim" document="CatalogMaintenance" schedule="Mỗi ngày một lần, dự kiến 02:23" /><JobCard name="Đồng bộ tập phim" document="CloudEpisodeSync" schedule="Theo lịch đồng bộ hiện có, mỗi 30 phút" /><p className="text-xs text-slate-400">Lịch là thời gian dự kiến; hàng đợi của GitHub có thể làm tác vụ bắt đầu muộn. Trang chỉ theo dõi, không tự chạy thêm tác vụ.</p></div> : <OperationTable key={tab} tab={tab} revision={revision} restoring={restoring} onRestore={setConfirm} />}
        <Dialog open={!!confirm} onClose={() => { if (!restoring) setConfirm(null); }} aria-labelledby="admin-restore-title" slotProps={{ paper: { sx: { bgcolor: '#0f172a', color: '#e2e8f0', border: '1px solid #fbbf2466', borderRadius: 4 } } }}>
            <DialogTitle id="admin-restore-title">Khôi phục {confirm?.name}?</DialogTitle>
            <DialogContent>Khôi phục các bản ghi đã lưu về đúng vị trí cũ. Nếu phát hiện dữ liệu trùng đang tồn tại, thao tác sẽ dừng.</DialogContent>
            <DialogActions><Button disabled={!!restoring} onClick={() => setConfirm(null)}>Hủy</Button><Button disabled={!!restoring} color="success" onClick={async () => { setRestoring(confirm.id); try { await restoreAdminTrash(confirm.id); setConfirm(null); setRevision(p => p + 1); } catch (error) { notifyAdmin(error.message, 'error'); } finally { setRestoring(''); } }}>{restoring ? 'Đang khôi phục...' : 'Khôi phục'}</Button></DialogActions>
        </Dialog>
    </div>;
}

function OperationTable({ tab, revision, onRestore, restoring }) {
    const cursor = useAdminCursor(tab === 'trash' ? 'AdminTrashGroups' : 'AdminActivity', 20, revision);
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
    return <section className="rounded-xl border border-purple-500/30 bg-slate-900/80 overflow-hidden">
        <div className="p-3 flex justify-between"><p>{tab === 'trash' ? 'Các mục được xóa từ bản cập nhật này có thể khôi phục.' : 'Nhật ký được ghi từ bản cập nhật này; không lưu mật khẩu hoặc nội dung nhạy cảm.'}</p><button className="text-cyan-300 shrink-0 ml-3" onClick={cursor.reload}>Tải lại</button></div>
        {cursor.loading ? <p role="status" className="p-6">Đang tải...</p> : cursor.error ? <p role="alert" className="p-6 text-red-300">{cursor.error}</p> : !cursor.rows.length ? <p className="p-6 text-slate-400">Chưa có dữ liệu.</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-800"><tr>{['Thời gian', 'Nội dung', 'Người thực hiện', tab === 'trash' ? 'Khôi phục' : 'Thay đổi'].map(text => <th key={text} className="p-3">{text}</th>)}</tr></thead><tbody>{cursor.rows.map(row => <tr key={row.id} className="border-t border-white/10"><td className="p-3 whitespace-nowrap">{time(row.deletedAt || row.createdAt)}</td><td className="p-3">{tab === 'trash' ? row.name : `${actions[row.action] || row.action}: ${row.entityName || row.entityID}`}<p className="text-xs text-slate-400">{row.collectionName}{tab === 'trash' && ` · ${row.archived}/${row.total} bản ghi · ${row.status === 'ready' ? 'Sẵn sàng khôi phục' : 'Tác vụ chưa hoàn tất'}`}</p></td><td className="p-3">{row.actor?.name || 'Admin'}</td><td className="p-3">{tab === 'trash' ? <button className="text-emerald-300 disabled:opacity-50" disabled={!!restoring || !row.archived || (row.status === 'moving' && now - Number(row.updatedAt || row.deletedAt || 0) < 300000)} onClick={() => onRestore(row)}>Khôi phục</button> : (row.fields || []).join(', ')}</td></tr>)}</tbody></table></div>}
        <AdminCursorFooter {...cursor} />
    </section>;
}
