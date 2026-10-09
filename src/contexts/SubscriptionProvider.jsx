import React, { createContext } from 'react';
import { useSubscriptions } from '../hooks/useCollections';

export const SubscriptionContext = createContext();

function SubscriptionProvider({ children }) {
    const subscriptions = useSubscriptions();

    return (
        <SubscriptionContext.Provider value={subscriptions}>
            {children}
        </SubscriptionContext.Provider>
    );
}
export default SubscriptionProvider;
