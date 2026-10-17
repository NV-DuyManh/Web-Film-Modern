import { useContext } from 'react';
import { createRoot } from 'react-dom/client';
import Swal from 'sweetalert2';
import FramedUserAvatar from './FramedUserAvatar';
import { PlanContext } from '../contexts/PlanProvider';
import { useSubscriptions } from '../hooks/useCollections';
import { getUserPlanInfo } from '../utils/appUtils';

export default function useAuthSuccessToast(defaultMessage) {
    const plans = useContext(PlanContext) || [];
    const subscriptions = useSubscriptions() || [];
    return (customer, message = defaultMessage) => {
        let root;
        return Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: 'transparent',
            html: '<div></div>',
            customClass: { popup: 'swal2-toast-mfilm' },
            didOpen: toast => {
                root = createRoot(Swal.getHtmlContainer());
                root.render(<div className="flex items-center gap-3 text-left">
                    <FramedUserAvatar user={customer} plan={getUserPlanInfo(customer, subscriptions, plans)} />
                    <div className="flex min-w-0 flex-col gap-1">
                        <span className="w-fit rounded-full border border-yellow-500/30 bg-yellow-500/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-yellow-500">{message}</span>
                        <span className="max-w-48 truncate text-sm font-bold text-white">{customer.name || customer.displayName || 'Người dùng'}</span>
                        <span className="text-[11px] text-slate-400">Chào mừng bạn đến với MFILM!</span>
                    </div>
                </div>);
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            },
            willDestroy: () => root?.unmount(),
        });
    };
}
