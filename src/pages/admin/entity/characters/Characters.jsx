import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalCharacters from './ModalCharacters';
import TableCharacters from './TableCharacters';
import { addDocument, updateDocument } from '../../../../services/firebaseService';
import LOGO from "../../../../assets/Logo.png";

const inner = {
    name: "",
    description: "",
    imgUrl: LOGO,
    sexID: "",
    countriesID: ""
};

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

function Characters() {
    const [open, setOpen] = useState(false);
    const [character, setCharacter] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setCharacter(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setCharacter({ ...character, [e.target.name]: e.target.value });
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};

        newError.name = character.name ? "" : "Please enter character name";
        newError.description = character.description ? "" : "Please enter description";
        newError.imgUrl = character.imgUrl ? "" : "Please enter image";
        newError.sexID = character.sexID ? "" : "Please select sex";
        newError.countriesID = character.countriesID ? "" : "Please select country";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addcharacter = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);

        let submitData = { ...character };

        if (submitData.imgUrl === LOGO) {
            submitData.imgUrl = await getBase64FromUrl(LOGO);
        }

        !character.id ? await addDocument("Characters", submitData) : await updateDocument("Characters", submitData);

        handleClose();
        setLoading(false);
    }

    const handleImageChange = (event) => {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = () => {
                setCharacter({ ...character, imgUrl: reader.result });
                setError(prev => ({ ...prev, imgUrl: "" }));
            };

            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Characters"}
                tuKhoa={"Search Character by Name"}
                onChangeSearch={onChangeSearch}
            />

            <ModalCharacters
                handleImageChange={handleImageChange}
                addcharacter={addcharacter}
                onChangeInput={onChangeInput}
                open={open}
                handleClickOpen={handleClickOpen}
                handleClose={handleClose}
                error={error}
                loading={loading}
                character={character}
            />

            <TableCharacters
                setCharacter={setCharacter}
                handleClickOpen={handleClickOpen}
                character={character}
                search={search}
            />
        </div>
    );
}

export default Characters;