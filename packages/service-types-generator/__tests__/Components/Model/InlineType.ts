import {InlineType} from "../../../lib/Components/Model";
import {SerializationModel} from "@aws/types";

describe('InlineType', () => {
    it('should return a type node of a serialization model tree', () => {
        const scalarShapeMap: {[key: string]: SerializationModel} = {
            blob: {type: 'blob'},
            boolean: {type: 'boolean'},
            number: {type: 'number'},
            string: {type: 'string'},
            timestamp: {type: 'timestamp'},
        };
        for (let scalar of Object.keys(scalarShapeMap)) {
            expect((new InlineType(scalarShapeMap[scalar])).toString())
                .toEqual(
`{
    type: '${scalar}',
}`
                );
        }
    });

    it('should include sensitive traits in the emitted type definition', () => {
        expect((new InlineType({type: 'string', sensitive: true})).toString())
            .toEqual(
`{
    type: 'string',
    sensitive: true,
}`
            );
    });

    it('should include streaming traits in the emitted type definition', () => {
        expect((new InlineType({type: 'blob', streaming: true})).toString())
            .toEqual(
`{
    type: 'blob',
    streaming: true,
}`
            );
    });

    it('should include jsonValue traits in the emitted type definition', () => {
        expect((new InlineType({type: 'string', jsonValue: true})).toString())
            .toEqual(
`{
    type: 'string',
    jsonValue: true,
}`
            );
    });

    it('should include timestampFormat traits in the emitted type definition', () => {
        expect((new InlineType({type: 'timestamp', timestampFormat: 'rfc822'})).toString())
            .toEqual(
`{
    type: 'timestamp',
    timestampFormat: 'rfc822',
}`
            );
    });

    it('should include min traits for strings', () => {
            expect((new InlineType({min: 1, type: 'string'})).toString())
                .toEqual(
`{
    type: 'string',
    min: 1,
}`
                );
    });

    it('should include min traits for numbers', () => {
        expect((new InlineType({min: 1, type: 'number'})).toString())
            .toEqual(
`{
    type: 'number',
    min: 1,
}`
            );
    });
});
