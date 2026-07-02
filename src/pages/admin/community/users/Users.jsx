import React, { useState } from 'react';
import Search from '../../../../components/admin/search/Search';
import ModalUsers from './ModalUsers';
import TableUsers from './TableUsers';
import { addDocument, updateDocument } from '../../../../services/firebaseService';
import LOGO from "../../../../assets/Logo.png";

const inner = { displayName: "", email: "", password: "", phone: "", imgUrl: LOGO, sexId: "", role: "user" };
const innerError = { displayName: "", email: "", password: "", phone: "", imgUrl: "", sexId: "", role: "" };

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
    const [error, setError] = useState(innerError);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setUser(inner);
        setError(innerError);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const onChangeInput = (e) => {
        setUser(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.displayName = user.displayName || user.name ? "" : "Please enter name";
        newError.email = user.email ? "" : "Please enter email";
        newError.password = user.password ? "" : "Please enter password";
        newError.role = user.role ? "" : "Please select role";
        
        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addUser = async () => {
        if (validation()) {
            return;
        }
        
        setLoading(true);
        setProgress(20);

        try {
            let submitData = { ...user };

            setProgress(50);

            if (!submitData.imgUrl && submitData.avatarUrl) {
                submitData.imgUrl = submitData.avatarUrl;
            }

            if (submitData.imgUrl === LOGO || submitData.imgUrl?.includes("Logo.png")) {
                submitData.imgUrl = await getBase64FromUrl(LOGO);
            }

            setProgress(75);

            if (!user.id) {
                submitData.createdAt = new Date().toISOString();
                await addDocument("Users", submitData);
            } else {
                await updateDocument("Users", submitData);
            }

            setProgress(100);

            setTimeout(() => {
                handleClose();
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
                setUser(prev => ({ ...prev, imgUrl: reader.result }));
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
                progress={progress}
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