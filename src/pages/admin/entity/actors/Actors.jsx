import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalActor from './ModalActor';
import TableActor from './TableActor';
import { addDocument, updateDocument } from '../../../../services/firebaseService';
const inner = { name: "", description: "", imgUrl: "", sexId: "", countriesID: "" };
function Actors() {
    const [open, setOpen] = useState(false);
    const [actor, setActor] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);
    const handleClickOpen = () => {
        setOpen(true);
        setActor(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };
    const onChangeInput = (e) => {
        setActor({ ...actor, [e.target.name]: e.target.value })
    }

    const validation = () => {
        const newError = {};
        newError.name = actor.name ? "" : "Please enter your name";
        newError.description = actor.description ? "" : "Please enter your description";
        newError.imgUrl = actor.imgUrl ? "" : "Please enter your imgUrl";
        newError.sexId = actor.sexId ? "" : "Please enter your sex";
        newError.countriesID = actor.countriesID ? "" : "Please enter your country";
        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }
    const addactor = async () => {
        if (validation()) {
            return;
        }
        setLoading(true);
        !actor.id ? await addDocument("Actor", actor) : await updateDocument("Actor", actor);
        handleClose();
        setLoading(false);
    }
    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Actor"}
                tuKhoa={"Search Actor"}
            />
            <ModalActor
                addactor={addactor}
                onChangeInput={onChangeInput}
                open={open}
                handleClickOpen={handleClickOpen}
                handleClose={handleClose}
                error={error}
                loading={loading}
                actor={actor}
            />
            <TableActor
                setActor={setActor}
                handleClickOpen={handleClickOpen}
                actor={actor} />
        </div>
    );
}

export default Actors;