// import * as React from 'react';
// import Button from '@mui/material/Button';
// import Dialog from '@mui/material/Dialog';
// import DialogActions from '@mui/material/DialogActions';
// import DialogContent from '@mui/material/DialogContent';
// import DialogTitle from '@mui/material/DialogTitle';
// import Slide from '@mui/material/Slide';
// import { TextField } from '@mui/material';

// const Transition = React.forwardRef(function Transition(props, ref) {
//     return <Slide direction="up" ref={ref} {...props} />;
// });

// export default function ModalCategoryType({
//     open,
//     onChangeInput,
//     handleClose,
//     addCategoryType
// }) {
//     return (
//         <React.Fragment>
//             <Dialog
//                 open={open}
//                 slots={{
//                     transition: Transition,
//                 }}
//                 keepMounted
//                 onClose={handleClose}
//                 aria-describedby="alert-dialog-slide-description"
//                 role="alertdialog"
//             >
//                 <DialogTitle>{"Add Category Type"}</DialogTitle>

//                 <DialogContent>
//                     <TextField
//                         name='name'
//                         onChange={onChangeInput}
//                         fullWidth
//                         sx={{ mt: 2 }}
//                         label="Type Name"
//                         variant="outlined"
//                     />

//                     <TextField
//                         name='description'
//                         onChange={onChangeInput}
//                         fullWidth
//                         sx={{ mt: 2 }}
//                         multiline
//                         rows={3}
//                         label="Description"
//                         variant="outlined"
//                     />
//                 </DialogContent>

//                 <DialogActions>
//                     <Button onClick={handleClose} autoFocus>
//                         Disagree
//                     </Button>
//                     <Button onClick={addCategoryType}>
//                         Agree
//                     </Button>
//                 </DialogActions>
//             </Dialog>
//         </React.Fragment>
//     );
// }

import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Slide from '@mui/material/Slide';
import { FaSpinner } from 'react-icons/fa';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalCategoryType({open, onChangeInput, handleClose, addCategoryType, error, loading, categoryType}) {
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
                {categoryType.id ? "Update Category Type" : "Add Category Type"}
            </DialogTitle>

            <DialogContent className="modal-body-x">
                <TextField
                    className="modal-input-x"
                    name="name"
                    onChange={onChangeInput}
                    fullWidth
                    label="Name"
                    variant="outlined"
                    value={categoryType.name}
                    helperText={error.name}
                    error={!!error.name}
                />
                <TextField
                    className="modal-input-x"
                    name="description"
                    onChange={onChangeInput}
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    variant="outlined"
                    value={categoryType.description}
                    helperText={error.description}
                    error={!!error.description}
                />
            </DialogContent>

            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-cancel-x">
                    Cancel
                </Button>
                <Button disabled={loading} onClick={addCategoryType} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin" /> : categoryType.id ? "UPDATE" : "ADD"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}