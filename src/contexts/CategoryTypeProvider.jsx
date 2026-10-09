import React, { createContext } from 'react';
import { useCategoryTypes } from '../hooks/useCollections';

export const CategoryTypeContext = createContext();

function CategoryTypeProvider({ children }) {
    const categoryTypes = useCategoryTypes();


    return (
        <CategoryTypeContext.Provider value={categoryTypes}>
            {children}
        </CategoryTypeContext.Provider>
    );
}

export default CategoryTypeProvider;
