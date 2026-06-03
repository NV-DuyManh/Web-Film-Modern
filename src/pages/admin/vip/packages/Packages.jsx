import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalPackages from './ModalPackages';
import TablePackages from './TablePackages';
import { addDocument, updateDocument } from '../../../../services/firebaseService';

const inner = { planID: "", discount: "", time: "" };

function Packages() {
    const [open, setOpen] = useState(false);
    const [packageItem, setPackageItem] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setPackageItem(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setPackageItem({ ...packageItem, [e.target.name]: e.target.value });
    }

    const validation = () => {
        const newError = {};
        newError.planID = packageItem.planID ? "" : "Please select plan";
        newError.discount = packageItem.discount !== "" ? "" : "Please enter discount";
        newError.time = packageItem.time !== "" ? "" : "Please enter time";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addPackage = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);

        let submitData = { ...packageItem };
        submitData.discount = parseFloat(submitData.discount) || 0;
        submitData.time = parseInt(submitData.time) || 0;

        !packageItem.id ? await addDocument("Packages", submitData) : await updateDocument("Packages", submitData);

        handleClose();
        setLoading(false);
    }

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Packages"}
                tuKhoa={"Search Package by Plan"}
                onChangeSearch={onChangeSearch}
            />
            <ModalPackages
                addPackage={addPackage}
                onChangeInput={onChangeInput}
                open={open}
                handleClickOpen={handleClickOpen}
                handleClose={handleClose}
                error={error}
                loading={loading}
                packageItem={packageItem}
            />
            <TablePackages
                setPackageItem={setPackageItem}
                handleClickOpen={handleClickOpen}
                packageItem={packageItem}
                search={search}
            />
        </div>
    );
}

export default Packages;