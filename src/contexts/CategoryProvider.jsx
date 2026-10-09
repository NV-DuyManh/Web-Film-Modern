import React, { createContext } from 'react';
import { useCategories } from '../hooks/useCollections';

export const CategoryContext = createContext();
function CategoryProvider({children}) {
    const categories = useCategories();

    return (
        <CategoryContext.Provider value={categories}>
            {children}
        </CategoryContext.Provider>
    );
}

export default CategoryProvider;
