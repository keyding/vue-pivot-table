import combine from './combine';

// compile table head
// e.g. combinePaths(['a', 'b'], ['c', 'd'], ..., summaryCount)
export default (...args) => {
    // show summary info, the default is `false`
    let _isHasSummary = false;

    const lastArg = args[args.length - 1];

    if (Array.isArray(lastArg)) {
        _isHasSummary = false;
    } else {
        _isHasSummary = lastArg > 0;
        args.pop();
    }

    const paths = combine(...args);

    // add summary info
    if (_isHasSummary && paths.length) {
        let totalKeys = [];

        for (let i = args.length - 1; i > 0; i--) {
            totalKeys = totalKeys.concat(
                combine(...args.slice(0, i))
            );
        }

        totalKeys.forEach(total => {
            const start = paths.findIndex(item =>
                item.startsWith(total)
            );
            const end = paths.filter(item => item.startsWith(total))
                .length;

            const summarys = [...Array(lastArg)].map(() => total);

            paths.splice(start + end, 0, ...summarys);
        });
    }

    return paths;
}