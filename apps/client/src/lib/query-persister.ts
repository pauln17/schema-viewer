import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryPersister = createAsyncStoragePersister({
    storage: typeof window !== 'undefined' ? window.localStorage : null,
});