import React, { useSyncExternalStore } from 'react';
import { getCatalogStatus, subscribeCatalogStatus } from '../../../utils/catalogStatus';
import { BsSearch } from 'react-icons/bs';
import { FaPlus } from 'react-icons/fa';

const labels = { Actor: 'diễn viên', Author: 'đạo diễn', Character: 'nhân vật', Category: 'thể loại', Plan: 'gói', Topic: 'chủ đề', Feature: 'quyền lợi', Package: 'gói dịch vụ', Review: 'đánh giá', Comment: 'bình luận', User: 'người dùng', Movies: 'phim', Users: 'người dùng', Actors: 'diễn viên', Authors: 'đạo diễn', Characters: 'nhân vật', Categories: 'thể loại', Topics: 'chủ đề', Plans: 'gói', Features: 'quyền lợi', Packages: 'gói dịch vụ', Reviews: 'đánh giá', Comments: 'bình luận', RentMovies: 'lượt thuê', Subscriptions: 'đăng ký gói', ShowTimes: 'lịch chiếu', CategoryTypes: 'loại phim' };
const translate = text => {
    if (!text) return text;
    const title = text.match(/^List (.*)$/);
    if (title) return `Danh sách ${labels[title[1]] || title[1]}`;
    const byName = text.match(/^Search (.+?) by Name$/);
    if (byName) return `Tìm ${labels[byName[1]] || byName[1]} theo tên`;
    if (text.startsWith('Search ')) return `Tìm ${labels[text.slice(7)] || text.slice(7)}`.replace('Movie by Name', 'phim theo tên').replace('User by Name/Email/Phone', 'tên, email hoặc số điện thoại');
    return text.replace('Search Movie by Name', 'Tìm phim theo tên').replace('Search User by Name/Email/Phone', 'Tìm tên, email hoặc số điện thoại').replace(/^Search /, 'Tìm ').replace(' by Name', ' theo tên');
};
function Search({ handleClickOpen, name, tuKhoa, onChangeSearch }) {
    const raw = String(name || '').replace(/^List /, '');
    const aliases = { User: 'Users', Actor: 'Actors', Author: 'Authors', Character: 'Characters', Category: 'Categories', Topic: 'Topics', Plan: 'Plans', Feature: 'Features', Package: 'Packages', Review: 'Reviews', Comment: 'Comments' };
    const collection = aliases[raw] || raw;
    const state = useSyncExternalStore(subscribeCatalogStatus, () => getCatalogStatus(collection));


    return (
        <div className='grid lg:grid-cols-8 gap-3 p-4 bg-black/20 text-white items-center'>
            <h1 className='font-bold text-3xl glow-text lg:col-span-2 m-0 flex items-center'>{translate(name)}</h1>
            {state.status === 'error' && <p role="alert" className="text-red-300 lg:col-span-8">Không tải được dữ liệu. Kiểm tra kết nối hoặc hạn mức, rồi tải lại trang.</p>}
            {state.status === 'loading' && collection !== 'Movies' && <p role="status" className="text-cyan-300 lg:col-span-8">Đang tải dữ liệu...</p>}

            <div className="search lg:col-span-4">
                <input
                    type="text"
                    placeholder={translate(tuKhoa)}
                    className="search-input"
                    onChange={onChangeSearch}
                />

                <BsSearch className="search-icon" />
            </div>

            <div className="lg:col-span-2 flex justify-end items-center">
                <button onClick={handleClickOpen} className="btn-add">
                    THÊM <FaPlus />
                </button>
            </div>
        </div>
    );
}

export default Search;
