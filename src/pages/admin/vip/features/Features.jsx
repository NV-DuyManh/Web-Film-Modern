import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalFeatures from './ModalFeatures';
import TableFeatures from './TableFeatures';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { planID: "", description: "", available: "" };

function Features() {
    const [open, setOpen] = useState(false);
    const [feature, setFeature] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);

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
        setFeature({ ...feature, [e.target.name]: e.target.value });
    }

    const validation = () => {
        const newError = {};
        newError.planID = feature.planID ? "" : "Please select plan";
        newError.description = feature.description ? "" : "Please enter description";
        newError.available = feature.available !== "" ? "" : "Please select available";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addFeature = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);

        let submitData = { ...feature };
        submitData.available = submitData.available === true || submitData.available === "true";

        !feature.id ? await addDocument("Features", submitData) : await updateDocument("Features", submitData);

        handleClose();
        setLoading(false);
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