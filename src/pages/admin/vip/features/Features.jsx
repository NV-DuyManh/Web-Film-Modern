import { adminAlert } from '../../../../services/adminOperations';
import React, { useState } from 'react';
import Search from '../../../../components/admin/search/Search';
import ModalFeatures from './ModalFeatures';
import TableFeatures from './TableFeatures';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { planID: "", description: "", available: "" };

function Features() {
    const [open, setOpen] = useState(false);
    const [feature, setFeature] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setFeature(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setFeature(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.planID = feature.planID ? "" : "Vui lòng chọn gói";
        newError.description = feature.description ? "" : "Vui lòng nhập mô tả";
        newError.available = feature.available !== "" ? "" : "Please select available";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addFeature = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);
        setProgress(20);

        try {
            let submitData = { ...feature };
            submitData.available = submitData.available === true || submitData.available === "true";

            setProgress(50);

            !feature.id ? await addDocument("Features", submitData) : await updateDocument("Features", submitData);

            setProgress(100);
            setTimeout(() => {
                handleClose();
                setLoading(false);
                setProgress(0);
            }, 500);
        } catch (err) {
            adminAlert("Có lỗi xảy ra, vui lòng thử lại!");
            setLoading(false);
            setProgress(0);
        }
    }

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Features"}
                tuKhoa={"Search Feature by Description"}
                onChangeSearch={onChangeSearch}
            />
            <ModalFeatures
                addFeature={addFeature}
                onChangeInput={onChangeInput}
                open={open}
                handleClickOpen={handleClickOpen}
                handleClose={handleClose}
                error={error}
                loading={loading}
                progress={progress}
                feature={feature}
            />
            <TableFeatures
                setFeature={setFeature}
                handleClickOpen={handleClickOpen}
                feature={feature}
                search={search}
            />
        </div>
    );
}

export default Features;
