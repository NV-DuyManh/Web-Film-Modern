import { createContext } from 'react';

// Outside a section boundary, the current page always remains an active reader.
export const SectionVisibilityContext = createContext(true);
