import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

export const PlanContext = createContext();

function PlanProvider({ children }) {
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("Plans", (planList) => {
            setPlans(planList);
        });
        return () => unsubscribe();
    }, []);

    return (
        <PlanContext.Provider value={plans}>
            {children}
        </PlanContext.Provider>
    );
}

export default PlanProvider;