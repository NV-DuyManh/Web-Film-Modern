
import * as React from 'react';
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, styled, TextField } from '@mui/material';
import Slide from '@mui/material/Slide';
import { FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';
import { COUNTRIES } from '../../../../utils/Contants';


const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});
const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});


export default function ModalActor({ open, onChangeInput, handleClose, addactor, error, loading, actor, handleImageChange }) {
    return (
        <Dialog
            open={open}
            slots={{ transition: Transition }}
            keepMounted
            onClose={handleClose}
            className="modal-wrapper"
            PaperProps={{ className: "modal-inner" }}
            BackdropProps={{ className: "modal-backdrop-x" }}
        >
            <DialogTitle className="modal-header-x">
                {actor.id ? "UPDATE ACTOR" : "ADD ACTOR"}
            </DialogTitle>

            <DialogContent className="modal-body-x">

                <TextField
                    className="modal-input-x"
                    name="name"
                    onChange={onChangeInput}
                    fullWidth
                    label="Name"
                    variant="outlined"
                    value={actor.name}
                    helperText={error.name}
                    error={!!error.name}
                />
                <TextField
                    className="modal-input-x"
                    name="description"
                    onChange={onChangeInput}
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    variant="outlined"
                    value={actor.description}
                    helperText={error.description}
                    error={!!error.description}
                />
                <Autocomplete
                    disablePortal
                    options={COUNTRIES}
                    fullWidth

                    PopperProps={{
                        placement: "top-end"
                    }}
                    value={actor.countriesID}
                    onChange={(e, value) => {
                        onChangeInput({ target: { name: "countriesID", value: value }, });
                    }}
                    renderInput={(params) => <TextField {...params} className="modal-input-x"
                        label="Country"
                        helperText={error.countriesID}
                        error={!!error.countriesID} />}
                />
                <div className="grid grid-cols-2">
                    <div className='col-span-1'>
                        <FormControl className="modal-input-x">
                            <FormLabel id="demo-radio-buttons-group-label">Gender</FormLabel>
                            <RadioGroup
                                aria-labelledby="demo-radio-buttons-group-label"
                                defaultValue="female"
                                name="sexID"
                                sx={{ flexDirection: "row" }}
                                value={actor.sexID}
                                onChange={onChangeInput}
                                error={!!error.sexID}
                            >
                                <FormControlLabel value="Female" control={<Radio />} label="Female" />
                                <FormControlLabel value="Male" control={<Radio />} label="Male" />
                                <FormControlLabel value="ther" control={<Radio />} label="Other" />
                            </RadioGroup>
                        </FormControl>
                        <Button
                            className="modal-input-x"
                            component="label"
                            role={undefined}
                            variant="contained"
                            tabIndex={-1}
                            startIcon={<FaCloudUploadAlt />}
                        >
                            Upload files
                            <VisuallyHiddenInput
                                type="file"
                                onChange={handleImageChange}
                            />
                        </Button>
                    </div>
                    <div className='col-span-1 mt-4'>
                        <img src={actor.imgUrl} alt="Logo" className="object-contain rounded-2xl transition-all duration-300 px-1" />
                    </div>
                </div>


            </DialogContent>
            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-cancel-x">
                    Cancel
                </Button>
                <Button disabled={loading} onClick={addactor} className="btn-submit-x">
                    {!loading ? <FaSpinner className="spin text-xl" /> : actor.id ? "UPDATE" : "ADD"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}