import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalAuthors from './ModalAuthors';
import TableAuthors from './TableAuthors';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { name: "", description: "", imgUrl: "", sexID: "", countriesID: "" };

function Authors() {
    const [open, setOpen] = useState(false);
    const [author, setAuthor] = useState(inner);
    const [error, setError] = useState({});
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value)
    }

    const handleClickOpen = () => {
        setOpen(true);
        setAuthor(inner);
        setError({});
    };

    const handleClose = () => {
        if (!loading) setOpen(false);
    };

    const onChangeInput = (e) => {
        setAuthor(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.name = author.name ? "" : "Please enter your name";
        newError.description = author.description ? "" : "Please enter your description";
        newError.countriesID = author.countriesID ? "" : "Please select your country";
        newError.sexID = author.sexID ? "" : "Please select your gender";
        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addauthor = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);
        setProgress(20);

        try {
            let submitData = { ...author };

            setProgress(50);

            if (!submitData.imgUrl || submitData.imgUrl.includes("Logo.png")) {
                submitData.imgUrl = "";
            }

            setProgress(75);

            if (!author.id) {
                await addDocument("Authors", submitData);
            } else {
                await updateDocument("Authors", submitData);
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
                setAuthor(prev => ({ ...prev, imgUrl: reader.result }));
                setError(prev => ({ ...prev, imgUrl: "" }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Authors"}
                tuKhoa={"Search Author by Name"}
                onChangeSearch={onChangeSearch}
            />
            <ModalAuthors
                handleImageChange={handleImageChange}
                addauthor={addauthor}
                onChangeInput={onChangeInput}
                open={open}
                handleClose={handleClose}
                error={error}
                loading={loading}
                progress={progress}
                author={author}
            />
            <TableAuthors
                setAuthor={setAuthor}
                handleClickOpen={handleClickOpen}
                author={author}
                search={search}
            />
        </div>
    );
}

export default Authors;