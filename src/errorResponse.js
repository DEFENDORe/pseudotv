export class ErrorResponse {
    /**
     * Format error to response for client.
     * Return a translated message.
     *
     * @static
     * @param {*} options { code: number; message: string; }
     * @returns
     * @memberof ErrorResponse
     */
    static errorMessage(options = { code: 0, message: '' }) {
        return {
            code: options.code,
            message: options.message
        }
    }
}