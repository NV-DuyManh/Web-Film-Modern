import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalShowTimes from './ModalShowTimes';
import TableShowTimes from './TableShowTimes';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { time: "", movieId: "", roomName: "" };

function ShowTimes() {
    const [open, setOpen] = useState(false);
    const [showTime, setShowTime] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setShowTime(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setShowTime(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.time = showTime.time ? "" : "Please select time";
        newError.movieId = showTime.movieId ? "" : "Please select movie";
        newError.roomName = showTime.roomName ? "" : "Please enter room name";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addShowTime = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);

        let submitData = { ...showTime };

        !showTime.id ? await addDocument("ShowTimes", submitData) : await updateDocument("ShowTimes", submitData);

        handleClose();
        setLoading(false);
    }

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List ShowTimes"}
                tuKhoa={"Search ShowTime by Movie or Room"}
                onChangeSearch={onChangeSearch}
            />
            <ModalShowTimes
                addShowTime={addShowTime}
                onChangeInput={onChangeInput}
                open={open}
                handleClose={handleClose}
                error={error}
                loading={loading}
                showTime={showTime}
            />
            <TableShowTimes
                setShowTime={setShowTime}
                handleClickOpen={handleClickOpen}
                showTime={showTime}
                search={search}
            />
        </div>
    );
}

export default ShowTimes;