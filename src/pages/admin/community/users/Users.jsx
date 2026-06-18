// src/pages/admin/community/users/Users.jsx
import React, { useState } from 'react';
import Search from '../../../../components/admin/Search';
import ModalUsers from './ModalUsers';
import TableUsers from './TableUsers';
import { addDocument, updateDocument } from '../../../../services/firebaseService';
import LOGO from "../../../../assets/Logo.png";

const inner = { name: "", email: "", password: "", phone: "", avatarUrl: LOGO, sexId: "" };

const getBase64FromUrl = (url) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => {
            resolve(url); 
        };
        img.src = url;
    });
};

function Users() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setUser(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    }

    const validation = () => {
        const newError = {};
        newError.name = user.name ? "" : "Please enter name";
        newError.email = user.email ? "" : "Please enter email";
        newError.password = user.password ? "" : "Please enter password";
        newError.phone = user.phone ? "" : "Please enter phone";
        newError.sexId = user.sexId ? "" : "Please select sex";
        
        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addUser = async () => {
        if (validation()) {
            return;
        }
        
        setLoading(true);

        try {
            let submitData = { ...user };

            if (submitData.avatarUrl === LOGO) {
                submitData.avatarUrl = await getBase64FromUrl(LOGO);
            }

            if (!user.id) {
                submitData.createdAt = new Date().toISOString();
                await addDocument("Users", submitData);
            } else {
                await updateDocument("Users", submitData);
            }

            handleClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setUser({ ...user, avatarUrl: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Users"}
                tuKhoa={"Search User by Name/Email/Phone"}
                onChangeSearch={onChangeSearch}
            />
            <ModalUsers
                handleImageChange={handleImageChange}
                addUser={addUser}
                onChangeInput={onChangeInput}
                open={open}
                handleClose={handleClose}
                error={error}
                loading={loading}
                user={user}
            />
            <TableUsers
                setUser={setUser}
                handleClickOpen={handleClickOpen}
                user={user}
                search={search}
            />
        </div>
    );
}

export default Users;