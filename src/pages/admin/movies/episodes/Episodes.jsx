import React, { useState } from 'react';
import Search from '../../../../components/admin/search/Search';
import ModalEpisodes from './ModalEpisodes';
import TableEpisodes from './TableEpisodes';
import { addDocument, updateDocument } from '../../../../services/firebaseService';
import { EpisodeContext } from '../../../../contexts/EpisodeProvider';
import { useContext } from 'react';

const inner = { numberEpisode: "", movieID: "", url: "" };

function Episodes() {
    const episodes = useContext(EpisodeContext);
    const [open, setOpen] = useState(false);
    const [episode, setEpisode] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkText, setBulkText] = useState("");

    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleClickOpen = () => {
        setOpen(true);
        setEpisode(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
        setIsBulkMode(false);
        setBulkText("");
    };

    const onChangeInput = (e) => {
        setEpisode(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    }

    const validation = () => {
        const newError = {};
        newError.numberEpisode = episode.numberEpisode !== "" ? "" : "Please enter episode number";
        newError.movieID = episode.movieID ? "" : "Please select a movie";
        newError.url = episode.url ? "" : "Please enter episode url";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addEpisode = async () => {
        if (validation()) {
            return;
        }

        setLoading(true);
        setProgress(20);

        try {
            let submitData = { ...episode };
            submitData.numberEpisode = parseInt(submitData.numberEpisode) || 0;

            setProgress(50);

            if (!episode.id) {
                const existingEp = episodes?.find(e => e.movieID === submitData.movieID && Number(e.numberEpisode) === Number(submitData.numberEpisode));
                if (existingEp) {
                    submitData.id = existingEp.id;
                    submitData.createdAt = existingEp.createdAt || new Date().toISOString();
                    await updateDocument("Episodes", submitData);
                } else {
                    submitData.createdAt = new Date().toISOString();
                    await addDocument("Episodes", submitData);
                }
            } else {
                await updateDocument("Episodes", submitData);
            }

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

    const addBulkEpisodes = async () => {
        if (!episode.movieID) {
            setError({ ...inner, movieID: "Vui lòng chọn phim trước" });
            return;
        }
        if (!bulkText.trim()) {
            alert("Vui lòng nhập nội dung!");
            return;
        }

        setLoading(true);
        setProgress(5);
        
        try {
            const lines = bulkText.split('\n').filter(line => line.trim() !== '');
            const total = lines.length;
            let count = 0;

            for (let i = 0; i < total; i++) {
                const line = lines[i];
                const parts = line.split('|');
                
                if (parts.length >= 2) {
                    const epName = parts[0].trim();
                    const url = parts.slice(1).join('|').trim();
                    
                    const numMatch = epName.match(/\d+/);
                    const numberEpisode = numMatch ? parseInt(numMatch[0]) : (i + 1);

                    const existingEp = episodes?.find(e => e.movieID === episode.movieID && Number(e.numberEpisode) === Number(numberEpisode));

                    const submitData = {
                        movieID: episode.movieID,
                        numberEpisode: numberEpisode,
                        url: url,
                        createdAt: existingEp?.createdAt || new Date().toISOString()
                    };

                    if (existingEp) {
                        submitData.id = existingEp.id;
                        await updateDocument("Episodes", submitData);
                    } else {
                        await addDocument("Episodes", submitData);
                    }
                }
                
                count++;
                setProgress(Math.floor((count / total) * 100));
            }

            setProgress(100);
            setTimeout(() => {
                handleClose();
                setLoading(false);
                setProgress(0);
                setBulkText("");
            }, 1000);
            
        } catch (err) {
            console.error(err);
            alert("Có lỗi xảy ra trong quá trình thêm hàng loạt!");
            setLoading(false);
            setProgress(0);
        }
    }

    return (
        <div>
            <Search
                handleClickOpen={handleClickOpen}
                name={"List Episodes"}
                tuKhoa={"Search Episode"}
                onChangeSearch={onChangeSearch}
            />
            <ModalEpisodes
                addEpisode={addEpisode}
                addBulkEpisodes={addBulkEpisodes}
                onChangeInput={onChangeInput}
                open={open}
                handleClose={handleClose}
                error={error}
                loading={loading}
                progress={progress}
                episode={episode}
                setEpisode={setEpisode}
                isBulkMode={isBulkMode}
                setIsBulkMode={setIsBulkMode}
                bulkText={bulkText}
                setBulkText={setBulkText}
            />
            <TableEpisodes
                setEpisode={setEpisode}
                handleClickOpen={handleClickOpen}
                episode={episode}
                search={search}
            />
        </div>
    );
}

export default Episodes;
