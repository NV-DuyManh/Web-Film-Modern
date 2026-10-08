import { useSyncExternalStore } from 'react';
import { getCatalogStatus, subscribeCatalogStatus } from '../utils/catalogStatus';

export default function useCatalogStatus(collection) {
    return useSyncExternalStore(subscribeCatalogStatus, () => getCatalogStatus(collection));
}
