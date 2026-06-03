import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

export const PackageContext = createContext();

function PackageProvider({ children }) {
    const [packages, setPackages] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("Packages", (packageList) => {
            setPackages(packageList);
        });
        return () => unsubscribe();
    }, []);

    return (
        <PackageContext.Provider value={packages}>
            {children}
        </PackageContext.Provider>
    );
}

export default PackageProvider;