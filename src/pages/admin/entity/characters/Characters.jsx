import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalCharacters from './ModalCharacters';
import TableCharacters from './TableCharacters';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { name: "", description: "", imgUrl: "", roleType: "" };

function Characters() {
    const [open, setOpen] = useState(false);
    const [character, setCharacter] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
        setCharacter(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setCharacter({ ...character, [e.target.name]: e.target.value })
    }

    const validation = () => {
        const newError = {};
        newError.name = character.name ? "" : "Please enter your name";
        newError.description = character.description ? "" : "Please enter your description";
        newError.imgUrl = character.imgUrl ? "" : "Please enter your image";
        newError.roleType = character.roleType ? "" : "Please enter your role type";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addcharacter = async () => {
        if (validation()) {
            return;
        }
        setLoading(true);
        !character.id ? await addDocument("Character", character) : await updateDocument("Character", character);
        handleClose();
        setLoading(false);
    }

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Characters"}
                tuKhoa={"Search Character"}
            />
            <ModalCharacters
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
            />
        </div>
    );
}

export default Characters;