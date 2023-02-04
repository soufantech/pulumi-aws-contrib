/** @internal */
export default function lazyLoad(exports: any, props: string[], loadModule: any) {
    for (const property of props) {
        Object.defineProperty(exports, property, {
            enumerable: true,
            get() {
                return loadModule()[property];
            },
        });
    }
}
