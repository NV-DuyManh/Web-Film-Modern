import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Slide from '@mui/material/Slide';
import { AuthContext } from '../contexts/AuthProvider';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function LogOut({ open, handleClose, handleConfirm }) {
    const { isLogin, loginByUser, handleLogout } = React.useContext(AuthContext);

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
            <DialogTitle className="modal-header-x" style={{ background: 'linear-gradient(90deg, #00f2fe, #7b2ff7)' }}>
                Xác Nhận Đăng Xuất
            </DialogTitle>

            <DialogContent className="modal-body-x">
                <DialogContentText style={{ color: '#e5e7eb', paddingTop: '10px', fontSize: '16px', fontWeight: '500' }}>
                    Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
                </DialogContentText>
                <DialogContentText style={{ color: '#9ca3af', paddingTop: '4px', fontSize: '13px' }}>
                    Các phiên làm việc hiện tại sẽ được đóng lại.
                </DialogContentText>
            </DialogContent>

            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-neutral-x">
                    Hủy bỏ
                </Button>
                <Button onClick={handleLogout} className="btn-danger-x">
                    Đăng xuất
                </Button>
            </DialogActions>
        </Dialog>
    );
}
