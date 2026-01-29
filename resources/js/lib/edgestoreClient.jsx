import { createEdgeStoreProvider } from '@edgestore/react';

/**
 * EdgeStore Client Configuration
 * Creates the EdgeStore provider for React components
 * 
 * EdgeStore React components upload files through our Laravel backend endpoint.
 * The backend endpoint then handles the upload to EdgeStore cloud service.
 */
const { EdgeStoreProvider, useEdgeStore } = createEdgeStoreProvider({
    basePath: '/api/edgestore',
});

const EdgeStoreProviderWrapper = ({ children }) => {
    return (
        <EdgeStoreProvider>
            {children}
        </EdgeStoreProvider>
    );
};

export { EdgeStoreProviderWrapper, useEdgeStore };
