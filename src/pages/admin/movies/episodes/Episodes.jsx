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
        setEpisode({ ...episode, [e.target.name]: e.target.value });
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

        let submitData = { ...episode };
        submitData.numberEpisode = parseInt(submitData.numberEpisode) || 0;

        if (!episode.id) {
            submitData.createdAt = new Date().toISOString();
            await addDocument("Episodes", submitData);
        } else {
            await updateDocument("Episodes", submitData);
        }

        handleClose();
        setLoading(false);
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