import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

export const FeatureContext = createContext();

function FeatureProvider({ children }) {
    const [features, setFeatures] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("Features", (featureList) => {
            setFeatures(featureList);
        });
        return () => unsubscribe();
    }, []);

    return (
        <FeatureContext.Provider value={features}>
            {children}
        </FeatureContext.Provider>
    );
}

export default FeatureProvider;
