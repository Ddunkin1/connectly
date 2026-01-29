import { initEdgeStore } from '@edgestore/server';
import { z } from 'zod';

const es = initEdgeStore.context();

/**
 * EdgeStore Router Configuration
 * Defines buckets for different file types with validation rules
 * This router is used by EdgeStore React components
 */
export const edgeStoreRouter = es.router({
    /**
     * Profile Pictures Bucket
     * For user profile pictures - images only, max 5MB
     */
    profilePictures: es
        .imageBucket()
        .maxSize(5 * 1024 * 1024) // 5MB
        .beforeUpload(({ ctx, input }) => {
            // Add any custom validation logic here
            return true;
        })
        .input(
            z.object({
                userId: z.string().optional(),
            })
        ),

    /**
     * Post Media Bucket
     * For post images and videos - max 10MB
     */
    postMedia: es
        .fileBucket()
        .maxSize(10 * 1024 * 1024) // 10MB
        .beforeUpload(({ ctx, input }) => {
            // Validate file type and size
            return true;
        })
        .input(
            z.object({
                postId: z.string().optional(),
                mediaType: z.enum(['image', 'video']).optional(),
            })
        ),

    /**
     * Cover Images Bucket
     * For user cover images - images only, max 5MB
     */
    coverImages: es
        .imageBucket()
        .maxSize(5 * 1024 * 1024) // 5MB
        .beforeUpload(({ ctx, input }) => {
            return true;
        })
        .input(
            z.object({
                userId: z.string().optional(),
            })
        ),
});

export type EdgeStoreRouter = typeof edgeStoreRouter;
