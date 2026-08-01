import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

export const CategoryContext = createContext();
function CategoryProvider({children}) {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const unsubcribe = fetchDocumentsRealtime("Categories", (categoriesList) => {
            setCategories(categoriesList);
        });
        return () => unsubcribe();
    }, []);
    return (
        <CategoryContext.Provider value={categories}>
            {children}
        </CategoryContext.Provider>
    );
}

export default CategoryProvider;
