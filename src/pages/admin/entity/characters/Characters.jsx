import React, { useState } from 'react';
import Search from '../../../../components/admin/search/Search';
import ModalCharacters from './ModalCharacters';
import TableCharacters from './TableCharacters';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { name: "", description: "", imgUrl: "", sexID: "", countriesID: "" };

function Characters() {
    const [open, setOpen] = useState(false);
    const [character, setCharacter] = useState(inner);
    const [error, setError] = useState({});
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setCharacter(inner);
        setError({});
    };

    const handleClose = () => {
        if (!loading) setOpen(false);
    };

    const onChangeInput = (e) => {
        setCharacter(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.name = character.name ? "" : "Please enter name";
        newError.description = character.description ? "" : "Please enter description";
        newError.countriesID = character.countriesID ? "" : "Please select country";
        newError.sexID = character.sexID ? "" : "Please select gender";
        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addcharacter = async () => {
        if (validation()) return;

        setLoading(true);
        setProgress(20);

        try {
            let submitData = { ...character };

            setProgress(50);

            if (!submitData.imgUrl || submitData.imgUrl.includes("Logo.png")) {
                submitData.imgUrl = "";
            }

            setProgress(75);

            if (!character.id) {
                await addDocument("Characters", submitData);
            } else {
                await updateDocument("Characters", submitData);
            }

            setProgress(100);

            setTimeout(() => {
                setOpen(false);
                setLoading(false);
                setProgress(0);
            }, 500);

        } catch (err) {
            setLoading(false);
            setProgress(0);
        }
    }

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setCharacter(prev => ({ ...prev, imgUrl: reader.result }));
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
                handleClose={handleClose}
                error={error}
                loading={loading}
                progress={progress}
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