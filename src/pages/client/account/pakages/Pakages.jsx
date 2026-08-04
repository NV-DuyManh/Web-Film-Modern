import React, { useContext } from 'react';

import { AuthContext } from '../../../../contexts/AuthProvider';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { SubscriptionContext } from '../../../../contexts/SubscriptionProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { getObjectById } from '../../../../services/firebaseResponse';

function Pakages(props) {
    const { isLogin } = useContext(AuthContext)
    const movies = useContext(MovieContext);
    const subscriptions = useContext(SubscriptionContext);
    const plans = useContext(PlanContext);

    return (
        <div className="w-full flex flex-col gap-6 p-6 bg-[#1e293b]/60 rounded-2xl border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] min-h-full">
            {subscriptions.filter(s => s.userID === isLogin.id).map((s) => (
                <div key={s.id}>
                    <p>{s.price}</p>
                    <p>{s.status}</p>
                    <p>
                        {getObjectById(plans, s.planID)?.name}
                    </p>
                </div>
            ))}

        </div>
    );
}

export default Pakages;