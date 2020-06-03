// Find the category
export default (keys = [], data = []) => {
    const _result = {};
    data.forEach(item => {
        keys.forEach(key => {
            _result[key] = _result[key] || []; // Remove duplicates
            _result[key].push(item[key]);
            _result[key] = [...new Set(_result[key])];
        });
    });
    return _result;
}