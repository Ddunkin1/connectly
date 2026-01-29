import { EdgeStoreProvider, useEdgeStore } from '@edgestore/react';

/**
 * EdgeStore Client Configuration
 * Creates the EdgeStore provider for React components
 * 
 * EdgeStore React components upload files directly to EdgeStore's cloud service.
 * The basePath points to our Laravel API endpoint that handles EdgeStore API requests.
 * 
 * Note: EdgeStore components communicate with EdgeStore's API, and our Laravel endpoint
 * may be used for additional operations or webhooks.
 */
const EdgeStoreProviderWrapper = ({ children }) => {
    // EdgeStore React components need a basePath to our API endpoint
    // This endpoint handles EdgeStore API requests
    const basePath = '/api/edgestore';
    
    return (
        <EdgeStoreProvider
            basePath={basePath}
        >
            {children}
        </EdgeStoreProvider>
    );
};

export { EdgeStoreProviderWrapper, useEdgeStore };
