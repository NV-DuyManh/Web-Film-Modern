import { Autocomplete, TextField } from '@mui/material';

export default function MovieFilters({ filters, setFilters, plans, categories, size, setSize }) {
    const change = key => (_, value) => setFilters(previous => ({ ...previous, [key]: value?.id || '' }));
    const choices = [
        ['planID', 'Gói phim', [...plans].sort((a, b) => Number(a.level) - Number(b.level))],
        ['category', 'Thể loại', categories],
        ['status', 'Trạng thái', ['Sắp chiếu', 'Đang chiếu', 'Hoàn thành'].map(id => ({ id, name: id }))],
        ['source', 'Nguồn phim', [{ id: 'kkphim', name: 'KKPhim' }, { id: 'manual', name: 'Nhập thủ công / khác' }]],
        ['quality', 'Kiểm tra dữ liệu', [{ id: 'image', name: 'Thiếu ảnh / ảnh mặc định' }, { id: 'episodes', name: 'Chưa có tập' }, { id: 'rent', name: 'Thiếu giá thuê (gói trả phí)' }]],
    ];
    return <div className="mx-4 mt-3 rounded-xl border border-cyan-500/20 bg-slate-900/70 p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {choices.map(([key, label, options]) => <Autocomplete key={key} size="small" options={options} getOptionLabel={option => option.name || ''} value={options.find(option => option.id === filters[key]) || null} isOptionEqualToValue={(a, b) => a.id === b.id} onChange={change(key)} classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }} renderInput={params => <TextField {...params} label={label} className="modal-input-x" />} />)}
        <TextField label="Năm phát hành" type="number" size="small" value={filters.year || ''} onChange={e => setFilters(previous => ({ ...previous, year: e.target.value }))} className="modal-input-x" />
        <Autocomplete size="small" options={[5, 10, 20, 50]} value={size} disableClearable getOptionLabel={value => `${value} phim / trang`} onChange={(_, value) => setSize(value)} classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }} renderInput={params => <TextField {...params} label="Số dòng" className="modal-input-x" />} />
        <button className="text-amber-300 rounded-lg border border-amber-400/30" onClick={() => setFilters({})}>Xóa bộ lọc</button>
    </div>;
}
