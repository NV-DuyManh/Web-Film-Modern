import React, { useState } from 'react';
import Search from '../../../../components/admin/search/Search';
import ModalPlans from './ModalPlans';
import TablePlans from './TablePlans';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { name: "", level: "", price: "" };

function Plans() {
    const [open, setOpen] = useState(false);
    const [plan, setPlan] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setPlan(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setPlan(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.name = plan.name ? "" : "Please enter plan name";
        newError.level = plan.level !== "" ? "" : "Please enter plan level";
        newError.price = plan.price !== "" ? "" : "Please enter plan price";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addPlan = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);
        setProgress(20);

        try {
            let submitData = { ...plan };
            submitData.level = parseInt(submitData.level) || 0;
            submitData.price = parseFloat(submitData.price) || 0;

            setProgress(50);

            !plan.id ? await addDocument("Plans", submitData) : await updateDocument("Plans", submitData);

            setProgress(100);
            setTimeout(() => {
                handleClose();
                setLoading(false);
                setProgress(0);
            }, 500);
        } catch (err) {
            console.error(err);
            alert("Có lỗi xảy ra, vui lòng thử lại!");
            setLoading(false);
            setProgress(0);
        }
    }

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Plans"}
                tuKhoa={"Search Plan by Name"}
                onChangeSearch={onChangeSearch}
            />
            <ModalPlans
                addPlan={addPlan}
                onChangeInput={onChangeInput}
                open={open}
                handleClickOpen={handleClickOpen}
                handleClose={handleClose}
                error={error}
                loading={loading}
                progress={progress}
                plan={plan}
            />
            <TablePlans
                setPlan={setPlan}
                handleClickOpen={handleClickOpen}
                plan={plan}
                search={search}
            />
        </div>
    );
}

export default Plans;