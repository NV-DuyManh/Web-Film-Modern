import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalActor from './ModalActor';
import TableActor from './TableActor';
import { addDocument, updateDocument } from '../../../../services/firebaseService';
import LOGO from "../../../../assets/Logo.png";

const inner = { name: "", description: "", imgUrl: LOGO, sexID: "", countriesID: "" };

const getBase64FromUrl = async (url) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result;
            resolve(base64data);
        };
    });
};

function Actors() {
    const [open, setOpen] = useState(false);
    const [actor, setActor] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const onChangeSearch = (e) => {
        setSearch(e.target.value)
    }

    const handleClickOpen = () => {
        setOpen(true);
        setActor(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setActor(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.name = actor.name ? "" : "Please enter your name";
        newError.description = actor.description ? "" : "Please enter your description";
        newError.countriesID = actor.countriesID ? "" : "Please select your country";
        newError.sexID = actor.sexID ? "" : "Please select your gender";
        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addactor = async () => {
        if (validation()) {
            return;
        }
        setLoading(true);

        let submitData = { ...actor };

        if (submitData.imgUrl === LOGO) {
            submitData.imgUrl = await getBase64FromUrl(LOGO);
        }

        !actor.id ? await addDocument("Actors", submitData) : await updateDocument("Actors", submitData);

        handleClose();
        setLoading(false);
    }

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setActor(prev => ({ ...prev, imgUrl: reader.result }));
                setError(prev => ({ ...prev, imgUrl: "" }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Actor"}
                tuKhoa={"Search Actor"}
                onChangeSearch={onChangeSearch}
            />
            <ModalActor
                handleImageChange={handleImageChange}
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
                actor={actor}
                search={search}
            />
        </div>
    );
}

export default Actors;