import { SEPARATOR } from './constants'
// Convert path to object
export default (paths, keys) => {
    return paths.map(path => {
        const pathArr = path.split(SEPARATOR);
        const obj = {};

        keys.forEach((key, index) => {
            if (pathArr[index]) {
                obj[key] = pathArr[index];
            }
        });

        return obj;
    });
}