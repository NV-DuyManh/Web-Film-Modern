import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalReview from './ModalReview';
import TableReviews from './TableReviews';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { moviesId: "", userId: "", rate: 5, content: "" };

function Reviews() {
    const [open, setOpen] = useState(false);
    const [review, setReview] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setReview(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setReview(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.moviesId = review.moviesId ? "" : "Please select a movie";
        newError.userId = review.userId ? "" : "Please select a user";
        newError.rate = review.rate !== "" ? "" : "Please provide a rating";
        newError.content = review.content ? "" : "Please enter review content";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addReview = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);
        setProgress(20);

        try {
            let submitData = { ...review };
            submitData.rate = parseFloat(submitData.rate) || 0;

            setProgress(50);

            if (!review.id) {
                submitData.createdAt = new Date().toISOString();
                await addDocument("Reviews", submitData);
            } else {
                await updateDocument("Reviews", submitData);
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
                name={"List Reviews"}
                tuKhoa={"Search Reviews by Content"}
                onChangeSearch={onChangeSearch}
            />
            <ModalReview
                addReview={addReview}
                onChangeInput={onChangeInput}
                open={open}
                handleClickOpen={handleClickOpen}
                handleClose={handleClose}
                error={error}
                loading={loading}
                progress={progress}
                review={review}
                setReview={setReview}
                setError={setError}
            />
            <TableReviews
                setReview={setReview}
                handleClickOpen={handleClickOpen}
                review={review}
                search={search}
            />
        </div>
    );
}

export default Reviews;