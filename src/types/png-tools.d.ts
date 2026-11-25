declare module 'png-tools' {
    export declare enum ColorType {
        GRAYSCALE = 0,
        RGB = 2,
        INDEXED = 3,
        GRAYSCALE_ALPHA = 4,
        RGBA = 6,
    }

    export interface EncodeOptions {
        /** Raw pixel data to encode */
        data: Uint8Array | Uint16Array;

        /** Image width */
        width: number;

        /** Image height */
        height: number;

        /** Color type (defaults to RGBA, or INDEXED if a palette is provided) */
        colorType?: ColorType;

        /** Bit depth (defaults to 8) */
        depth?: number;

        /** Filter method */
        filter?: number;

        /** First scanline filter method */
        firstFilter?: number;

        /** Flat RGBA entries for indexed encoding */
        palette?: Uint8Array;

        /** Grayscale or RGB transparent color samples */
        transparentColor?: Uint16Array;

        /** Additional PNG chunks */
        ancillary?: Chunk[];
    }

    export interface Chunk {
        type: number;
        data?: Uint8Array;
    }

    declare function deflateFunction(input: DeflateInput, options?: DeflateOptions): Uint8Array<ArrayBuffer>

    /**
     * Encodes a PNG buffer from the given image and options, using the specified `deflate` algorithm and optional compression options.
     * The deflate function should have the signature `(buf, [deflateOptions]) => Uint8Array`.
     *
     * @param {EncodeOptions} options the encoding options
     * @param {Function} deflate the sync deflate function to use
     * @param {Object} [DeflateFunction] optional deflate options passed to the deflate() function
     */
    export declare function encode(
        options: EncodeOptions,
        deflate: deflateFunction,
        deflateOptions?: any
    ): Uint8Array;
}