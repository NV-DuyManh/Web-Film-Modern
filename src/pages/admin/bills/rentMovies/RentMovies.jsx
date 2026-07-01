import React, { useState } from "react";
import Search from "../../../../components/admin/Search";
import ModalRentMovies from "./ModalRentMovies";
import TableRentMovies from "./TableRentMovies";
import { addDocument, updateDocument } from "../../../../services/firebaseService";

const inner = { transactionID: "", userId: "", moviesId: "", paymentMethod: "", price: 0, startDate: "", expiryDate: "", status: "success" };

function RentMovies() {
    const [open, setOpen] = useState(false);
    const [rentMovie, setRentMovie] = useState(inner);
    const [error, setError] = useState({});
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setRentMovie(inner);
        setError({});
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setRentMovie(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.transactionID = rentMovie.transactionID ? "" : "Please enter a transaction ID";
        newError.userId = rentMovie.userId ? "" : "Please select a user";
        newError.moviesId = rentMovie.moviesId ? "" : "Please select a movie";
        newError.paymentMethod = rentMovie.paymentMethod ? "" : "Please select a payment method";
        newError.price = rentMovie.price !== "" ? "" : "Please enter a price";
        newError.startDate = rentMovie.startDate ? "" : "Please enter a start date";
        newError.expiryDate = rentMovie.expiryDate ? "" : "Please enter an expiry date";
        newError.status = rentMovie.status ? "" : "Please select a status";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addRentMovie = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);
        setProgress(20);

        try {
            let submitData = { ...rentMovie };
            submitData.price = parseFloat(submitData.price) || 0;

            setProgress(50);

            if (!rentMovie.id) {
                submitData.createdAt = new Date().toISOString();
                await addDocument("RentMovies", submitData);
            } else {
                await updateDocument("RentMovies", submitData);
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
                name={"List Rent Movies"}
                tuKhoa={"Search by Transaction ID"}
                onChangeSearch={onChangeSearch}
            />
            <ModalRentMovies
                addRentMovie={addRentMovie}
                onChangeInput={onChangeInput}
                open={open}
                handleClickOpen={handleClickOpen}
                handleClose={handleClose}
                error={error}
                loading={loading}
                progress={progress}
                rentMovie={rentMovie}
                setRentMovie={setRentMovie}
                setError={setError}
            />
            <TableRentMovies
                setRentMovie={setRentMovie}
                handleClickOpen={handleClickOpen}
                rentMovie={rentMovie}
                search={search}
            />
        </div>
    );
}

export default RentMovies;
