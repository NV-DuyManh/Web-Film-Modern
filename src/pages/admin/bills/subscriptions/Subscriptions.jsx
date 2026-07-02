import React, { useState } from "react";
import Search from '../../../../components/admin/search/Search';
import ModalSubscriptions from "./ModalSubscriptions";
import TableSubscriptions from "./TableSubscriptions";
import { addDocument, updateDocument } from "../../../../services/firebaseService";

const inner = { transactionID: "", userId: "", planID: "", paymentMethod: "", price: 0, startDate: "", expiryDate: "", status: "success" };

function Subscriptions() {
    const [open, setOpen] = useState(false);
    const [subscription, setSubscription] = useState(inner);
    const [error, setError] = useState({});
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setSubscription(inner);
        setError({});
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setSubscription(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.transactionID = subscription.transactionID ? "" : "Please enter a transaction ID";
        newError.userId = subscription.userId ? "" : "Please select a user";
        newError.planID = subscription.planID ? "" : "Please select a plan";
        newError.paymentMethod = subscription.paymentMethod ? "" : "Please select a payment method";
        newError.price = subscription.price !== "" ? "" : "Please enter a price";
        newError.startDate = subscription.startDate ? "" : "Please enter a start date";
        newError.expiryDate = subscription.expiryDate ? "" : "Please enter an expiry date";
        newError.status = subscription.status ? "" : "Please select a status";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addSubscription = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);
        setProgress(20);

        try {
            let submitData = { ...subscription };
            submitData.price = parseFloat(submitData.price) || 0;

            setProgress(50);

            if (!subscription.id) {
                submitData.createdAt = new Date().toISOString();
                await addDocument("Subscriptions", submitData);
            } else {
                await updateDocument("Subscriptions", submitData);
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
                name={"List Subscriptions"}
                tuKhoa={"Search by Transaction ID"}
                onChangeSearch={onChangeSearch}
            />
            <ModalSubscriptions
                addSubscription={addSubscription}
                onChangeInput={onChangeInput}
                open={open}
                handleClickOpen={handleClickOpen}
                handleClose={handleClose}
                error={error}
                loading={loading}
                progress={progress}
                subscription={subscription}
                setSubscription={setSubscription}
                setError={setError}
            />
            <TableSubscriptions
                setSubscription={setSubscription}
                handleClickOpen={handleClickOpen}
                subscription={subscription}
                search={search}
            />
        </div>
    );
}

export default Subscriptions;
