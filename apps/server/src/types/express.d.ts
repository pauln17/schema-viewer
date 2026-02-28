// Schema The Request is Authorized For (From Token Verification).
declare global {
    namespace Express {
        interface Request {
            schema?: { id: string };
        }
    }
}

export { };
