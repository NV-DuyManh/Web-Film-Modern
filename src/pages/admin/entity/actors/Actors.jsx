import React, { useState } from 'react';
import Search from '../../../../components/admin/search/Search';
import ModalActor from './ModalActor';
import TableActor from './TableActor';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { name: "", description: "", imgUrl: "", sexID: "", countriesID: "" };

function Actors() {
    const [open, setOpen] = useState(false);
    const [actor, setActor] = useState(inner);
    const [error, setError] = useState({});
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value)
    }

    const handleClickOpen = () => {
        setOpen(true);
        setActor(inner);
        setError({});
    };

    const handleClose = () => {
        if (!loading) setOpen(false);
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
        setProgress(20);

        try {
            let submitData = { ...actor };

            setProgress(50);

            if (!submitData.imgUrl || submitData.imgUrl.includes("Logo.png")) {
                submitData.imgUrl = "";
            }

            setProgress(75);

            if (!actor.id) {
                await addDocument("Actors", submitData);
            } else {
                await updateDocument("Actors", submitData);
            }

            setProgress(100);

            setTimeout(() => {
                setOpen(false);
                setLoading(false);
                setProgress(0);
            }, 500);

        } catch (err) {
            console.error(err);
            alert("An error occurred, please try again!");
            setLoading(false);
            setProgress(0);
        }
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
                handleClose={handleClose}
                error={error}
                loading={loading}
                progress={progress}
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
