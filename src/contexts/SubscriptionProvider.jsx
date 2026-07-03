import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

export const SubscriptionContext = createContext();

const SubscriptionProvider = ({ children }) => {
    const [subscriptions, setSubscriptions] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime('Subscriptions', (data) => {
            setSubscriptions(data);
        });

        return () => unsubscribe();
    }, []);

    return (
        <SubscriptionContext.Provider value={subscriptions}>
            {children}
        </SubscriptionContext.Provider>
    );
};
export default SubscriptionProvider;
