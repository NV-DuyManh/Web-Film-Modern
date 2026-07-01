import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalComments from './ModalComments';
import TableComments from './TableComments';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { moviesId: "", userId: "", description: "" };

function Comments() {
    const [open, setOpen] = useState(false);
    const [comment, setComment] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setComment(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setComment(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.moviesId = comment.moviesId ? "" : "Please select a movie";
        newError.userId = comment.userId ? "" : "Please select a user";
        newError.description = comment.description ? "" : "Please enter comment description";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addComment = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);
        setProgress(20);

        try {
            let submitData = { ...comment };

            setProgress(50);

            if (!comment.id) {
                submitData.createdAt = new Date().toISOString();
                await addDocument("Comments", submitData);
            } else {
                await updateDocument("Comments", submitData);
            }

            setProgress(100);
            setTimeout(() => {
                handleClose();
                setLoading(false);
                setProgress(0);
            }, 500);
        } catch (err) {
            console.error(err);
            alert("Đã xảy ra lỗi, vui lòng thử lại!");
            setLoading(false);
            setProgress(0);
        }
    }

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Comments"}
                tuKhoa={"Search Comments by Content"}
                onChangeSearch={onChangeSearch}
            />
            <ModalComments
                addComment={addComment}
                onChangeInput={onChangeInput}
                open={open}
                handleClickOpen={handleClickOpen}
                handleClose={handleClose}
                error={error}
                loading={loading}
                progress={progress}
                comment={comment}
                setComment={setComment}
                setError={setError}
            />
            <TableComments
                setComment={setComment}
                handleClickOpen={handleClickOpen}
                comment={comment}
                search={search}
            />
        </div>
    );
}

export default Comments;