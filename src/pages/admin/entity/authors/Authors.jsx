import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalAuthors from './ModalAuthors';
import TableAuthors from './TableAuthors';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { name: "", description: "", imgUrl: "", sexID: "", countriesID: "" };

function Authors() {
    const [open, setOpen] = useState(false);
    const [author, setAuthor] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
        setAuthor(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setAuthor({ ...author, [e.target.name]: e.target.value })
    }

    const validation = () => {
        const newError = {};
        newError.name = author.name ? "" : "Please enter your name";
        newError.description = author.description ? "" : "Please enter your description";
        newError.imgUrl = author.imgUrl ? "" : "Please enter your image";
        newError.sexID = author.imgUrl ? "" : "Please enter your sex";
        newError.countriesID = author.countriesID ? "" : "Please enter your country";
        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addauthor = async () => {
        if (validation()) {
            return;
        }
        setLoading(true);
        !author.id ? await addDocument("Author", author) : await updateDocument("Author", author);
        handleClose();
        setLoading(false);
    }

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Authors"}
                tuKhoa={"Search Author"}
            />
            <ModalAuthors
                addauthor={addauthor}
                onChangeInput={onChangeInput}
                open={open}
                handleClickOpen={handleClickOpen}
                handleClose={handleClose}
                error={error}
                loading={loading}
                author={author}
            />
            <TableAuthors
                setAuthor={setAuthor}
                handleClickOpen={handleClickOpen}
                author={author}
            />
        </div>
    );
}

export default Authors;