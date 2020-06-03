// Permutation and combination of each element of multiple arrays
import { SEPARATOR } from './constants';

export default (...arrays) => {
    return arrays.length
        ? arrays.reduce((prev, curr) => {
            const arr = [];
            prev.forEach(_prevEl => {
                curr.forEach(_currEl => {
                    arr.push(_prevEl + SEPARATOR + _currEl);
                });
            });
            return arr;
        })
        : arrays;
}