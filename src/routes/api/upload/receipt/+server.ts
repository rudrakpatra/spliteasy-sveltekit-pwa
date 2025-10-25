import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BLOB_READ_WRITE_TOKEN } from '$env/static/private';

export const POST: RequestHandler = async ({ request, locals }) => {
    console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? 'Found' : 'NOT FOUND');
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            token: BLOB_READ_WRITE_TOKEN, // Explicitly pass the token
            onBeforeGenerateToken: async (pathname) => {
                // Authenticate user before allowing upload
                if (!locals.user) throw new Error('Unauthorized');

                return {
                    allowedContentTypes: [
                        'image/jpeg',
                        'image/png',
                        'image/webp',
                        'image/gif'
                    ],
                    tokenPayload: JSON.stringify({
                        userId: locals.user.id, // Pass user context
                        uploadType: 'receipt'
                    }),
                    addRandomSuffix: true
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // Called when upload completes
                console.log('Receipt uploaded:', blob.url);

                // Optional: Save to database
                // const payload = JSON.parse(tokenPayload);
                // await db.insert(uploads).values({
                //     userId: payload.userId,
                //     url: blob.url,
                //     type: 'receipt'
                // });
            }
        });

        return json(jsonResponse);
    } catch (error) {
        return json(
            { error: (error as Error).message },
            { status: 400 }
        );
    }
};
