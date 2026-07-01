import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalEpisodes from './ModalEpisodes';
import TableEpisodes from './TableEpisodes';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { numberEpisode: "", movieID: "", url: "" };

function Episodes() {
    const [open, setOpen] = useState(false);
    const [episode, setEpisode] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setEpisode(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setEpisode(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.numberEpisode = episode.numberEpisode !== "" ? "" : "Please enter episode number";
        newError.movieID = episode.movieID ? "" : "Please select a movie";
        newError.url = episode.url ? "" : "Please enter episode url";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addEpisode = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);
        setProgress(20);

        try {
            let submitData = { ...episode };
            submitData.numberEpisode = parseInt(submitData.numberEpisode) || 0;

            setProgress(50);

            if (!episode.id) {
                submitData.createdAt = new Date().toISOString();
                await addDocument("Episodes", submitData);
            } else {
                await updateDocument("Episodes", submitData);
            }

            setProgress(100);
            setTimeout(() => {
                handleClose();
                setLoading(false);
                setProgress(0);
            }, 500);
        } catch (err) {
            console.error(err);
            alert("Có lỗi xảy ra, vui lòng thử lại!");
            setLoading(false);
            setProgress(0);
        }
    }

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Episodes"}
                tuKhoa={"Search Episode"}
                onChangeSearch={onChangeSearch}
            />
            <ModalEpisodes
                addEpisode={addEpisode}
                onChangeInput={onChangeInput}
                open={open}
                handleClose={handleClose}
                error={error}
                loading={loading}
                progress={progress}
                episode={episode}
                setEpisode={setEpisode}
            />
            <TableEpisodes
                setEpisode={setEpisode}
                handleClickOpen={handleClickOpen}
                episode={episode}
                search={search}
            />
        </div>
    );
}

export default Episodes;