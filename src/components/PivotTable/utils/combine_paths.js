import combine from './combine';

// compile table head
// e.g. combinePaths(['a', 'b'], ['c', 'd'], ..., isSummary)
export default (...args) => {
    // show summary info, the default is `false`
    let _isHasSummary = false;

    const lastArg = args[args.length - 1];

    if (Array.isArray(lastArg)) {
        _isHasSummary = false;
    } else {
        _isHasSummary = !!lastArg;
        args.pop();
    }

    const paths = combine(...args.filter(item => item.length));

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

            paths.splice(start + end, 0, total);
        });
    }

    return paths;
}