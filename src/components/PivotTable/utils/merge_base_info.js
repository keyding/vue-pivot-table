// merge base info
export default function mergeBaseInfo(info = {}) {
    const _baseCellInfo = {
        value: "",
        x: 0,
        y: 0,
        selected: false,
        drag: false,
        colspan: 1,
        rowspan: 1,
        isSummary: false,
        // drag cell state
        dragged: false,
        // draggable: false
    };

    return Object.assign({}, _baseCellInfo, info);
}