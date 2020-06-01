<template>
    <div>
        <table>
            <tr v-for="(tr, trIndex) in tableData" :key="trIndex">
                <td
                    v-if="!td.shadow"
                    v-for="(td, tdIndex) in tr"
                    :rowspan="td.rowspan"
                    :colspan="td.colspan"
                    :key="tdIndex"
                >
                    <div :class="{ summary: td.isSummary }">{{ td.value }}</div>
                </td>
            </tr>
        </table>
    </div>
</template>

<script>
/**
 * pivot table
 */
export default {
    name: "PivotTable",
    props: {
        rows: {
            type: Array,
            default: () => [
                // {
                //     label: 'Date',
                //     key: 'date'
                // }
                // ...
            ]
        },
        columns: {
            type: Array,
            default: () => []
        },
        values: {
            type: Array,
            default: () => [
                // {
                //     label: 'clickSum',
                //     key: 'click',
                //     handle(data) { ... }
                // }
            ]
        },
        // data
        data: {
            type: Array,
            default: () => []
        },
        // display column summary info. The default value is `false`
        showColumnSummary: {
            type: Boolean,
            default: false
        },
        // display row summary info. The default value is `false`
        showRowSummary: {
            type: Boolean,
            default: false
        },
        // display all row summary info.
        // all row summary handle function.
        allRowSummaryHandle: {
            type: Function
        },
        // display all column summary info.
        // all column summary handle function.
        allColumnSummaryHandle: {
            type: Function
        }
    },
    data: () => ({
        // dragging: false,
        // start: {},
        // end: {},
        // timer: null,

        localRows: [],
        localColumns: [],
        localValues: [],
        tableData: [],
        // Separator
        SEPARATOR: "__"
    }),
    computed: {
        // handle column head
        colHead() {
            return this._compileHead(
                ...this.localColumns.map(({ values }) => values),
                this.showColumnSummary
            );
        },
        // handle row head
        rowHead() {
            return this._compileHead(
                ...this.localRows.map(({ values }) => values),
                this.showRowSummary
            );
        },
        // monitor all props value changes
        watchAllProps() {
            const {
                rows,
                columns,
                values,
                data,
                showColumnSummary,
                showRowSummary
            } = this;

            return {
                rows,
                columns,
                values,
                data,
                showColumnSummary,
                showRowSummary
            };
        }
    },
    created() {
        this.init();
    },
    methods: {
        init() {
            if (
                this.data.length &&
                (this.rows.length || this.columns.length || this.values)
            ) {
                this.handleDataClone();
                this.setValuesToColAndRow();
                this.handleDataViews();

                // handle all summary
                this.compileAllSummary();

                // console.log(this.tableData);
                // console.log("rowHead", this.rowHead);
                // console.log("colHead", this.colHead);
            } else {
                console.warn(
                    "[Warn]: props.data can't be empty. And props.rows, props.columns, props.values at least one is not empty."
                );
                this.tableData = [];
            }
        },
        // clone data
        handleDataClone() {
            this.localColumns = this._deepClone(this.columns);
            this.localRows = this._deepClone(this.rows);
            // Note: this.localValues can't clone handle function.
            this.localValues = this._deepClone(this.values);
            this.localData = Object.freeze(this.data);
        },
        // set the `values` attribute to rows and columns
        setValuesToColAndRow() {
            const columnKeys = this.localColumns.map(({ key }) => key);
            const rowKeys = this.localRows.map(({ key }) => key);
            const columnValues = this.findValues(columnKeys, this.localData);
            const rowValues = this.findValues(rowKeys, this.localData);

            this.localColumns.forEach(column => {
                const { key } = column;
                this.$set(column, "values", columnValues[key]);
            });

            this.localRows.forEach(row => {
                const { key } = row;
                this.$set(row, "values", rowValues[key]);
            });
        },
        // filter type values from data
        findValues(keys = [], data = []) {
            if (!keys.length || !data.length) return null;
            const _result = {};
            data.forEach(item => {
                keys.forEach(key => {
                    _result[key] = _result[key] || []; // 去重
                    _result[key].push(item[key]);
                    _result[key] = [...new Set(_result[key])];
                });
            });
            return _result;
        },
        // handle table data
        handleFormatData() {
            const baseCellInfo = {
                value: "",
                x: 0,
                y: 0,
                selected: false,
                drag: false,
                colspan: 1,
                rowspan: 1,
                isSummary: false
            };

            const mergeInfo = (info = {}) =>
                Object.assign({}, baseCellInfo, info);

            const _transConditionsToMap = (paths, types) =>
                paths.map(condition => {
                    const conditionArr = condition.split(this.SEPARATOR);
                    const obj = {};

                    types.forEach((value, index) => {
                        const { key } = value;

                        if (conditionArr[index]) {
                            obj[key] = conditionArr[index];
                        }
                    });

                    return obj;
                });

            // conditions of col head
            const colHeadConditions = _transConditionsToMap(
                this.colHead,
                this.localColumns
            );

            // conditions of row-head
            const rowHeadConditions = _transConditionsToMap(
                this.rowHead,
                this.localRows
            );

            // the keys of condition that props.row and props.columns
            const conditionKeys = this.localRows
                .map(({ key }) => key)
                .concat(this.localColumns.map(({ key }) => key));

            // Note: if there are no props.rows or props.column, push an empty object
            !colHeadConditions.length && colHeadConditions.push({});
            !rowHeadConditions.length && rowHeadConditions.push({});

            // draw data
            return rowHeadConditions.map((row, rowIndex) =>
                colHeadConditions
                    .map((col, colIndex) => {
                        // the condition of current cell
                        const conditions = Object.assign({}, row, col);

                        let cellData = [];

                        // filter the data
                        const filterData = this.localData.filter(dataItem => {
                            let status = true;

                            for (let key in conditions) {
                                if (conditions[key] !== dataItem[key]) {
                                    status = false;
                                    return;
                                }
                            }

                            return status;
                        });

                        // the filtered data is passed to the `handle` of `props.values`, return calculated data.
                        // Note: there is no `handle` in the `this.localValues`.
                        if (
                            this.localColumns.length &&
                            this.localRows.length &&
                            !this.values.length
                        ) {
                            cellData.push(
                                mergeInfo({
                                    x:
                                        this.localColumns.length +
                                        (this.localValues.length ? 1 : 0) +
                                        rowIndex,
                                    y: this.localRows.length + colIndex,
                                    value: "",
                                    isSummary:
                                        conditionKeys.length !==
                                        Object.keys(conditions).length
                                })
                            );
                        } else {
                            cellData = this.values.map((item, index) => {
                                return mergeInfo({
                                    x:
                                        this.localColumns.length +
                                        (this.localValues.length ? 1 : 0) +
                                        rowIndex,
                                    y:
                                        this.localRows.length +
                                        colIndex * 2 +
                                        index,
                                    value: item.handle
                                        ? item.handle(filterData)
                                        : "",
                                    isSummary:
                                        conditionKeys.length !==
                                        Object.keys(conditions).length
                                });
                            });
                        }

                        return cellData;
                    })
                    .flat()
            );
        },
        // handle data views
        handleDataViews() {
            const baseCellInfo = {
                value: "",
                x: 0,
                y: 0,
                selected: false,
                drag: false,
                colspan: 1,
                rowspan: 1,
                isSummary: false
            };

            // merge cell info
            const mergeInfo = (info = {}) =>
                Object.assign({}, baseCellInfo, info);

            // console.log(
            // "handleDataViews: "
            // this.rowHead,
            // this.colHead,
            // this.localValues,
            // this.localData
            // );

            // handle props.rows to head
            const rowsHead = this.localRows.map((row, index) => {
                return mergeInfo({
                    value: row.label,
                    y: index,
                    rowspan:
                        this.localColumns.length +
                            Number(Boolean(this.localValues.length)) || 1
                });
            });

            // handle props.columns to head
            const columnsHead = this.localColumns.map(() => []);
            this.colHead.forEach((col, colIndex) => {
                const colArr = col.split(this.SEPARATOR);

                columnsHead.forEach((row, rowIndex) => {
                    let shadowTds = [];

                    const localValuesLen = this.localValues.length;

                    // shadow td
                    if (localValuesLen && this.localRows.length) {
                        for (let i = 0; i < localValuesLen - 1; i++) {
                            shadowTds.push({
                                value: "",
                                x: rowIndex,
                                y: this.localRows.length + colIndex * 2 + i,
                                shadow: true
                            });
                        }
                    }

                    row.push(
                        ...shadowTds,
                        mergeInfo({
                            value: colArr[rowIndex] || "",
                            x: rowIndex,
                            y:
                                this.localRows.length +
                                colIndex * 2 +
                                localValuesLen -
                                1,
                            // y:
                            //     rowIndex === 0 && this.localRows.length
                            //         ? this.localRows.length + colIndex
                            //         : colIndex,
                            colspan: localValuesLen || 1,
                            isSummary:
                                colArr.length !== this.localColumns.length
                        })
                    );
                });
            });

            // handle props.values to head
            const valuesHead = [];
            const colCount = this.colHead.length || 1;
            for (let i = 0; i < colCount; i++) {
                this.localValues.forEach((cell, cellIndex) => {
                    const col = this.colHead[i];
                    valuesHead.push(
                        mergeInfo({
                            value: cell.label,
                            x: this.localColumns.length,
                            y: this.localRows.length + i * 2 + cellIndex,
                            isSummary:
                                col !== undefined
                                    ? col.split(this.SEPARATOR).length !==
                                      this.localColumns.length
                                    : false
                        })
                    );
                });
            }

            // all col head
            let head = [...columnsHead, valuesHead];

            head = head.map((item, index) => {
                if (index === 0) {
                    item.unshift(...rowsHead);
                } else {
                    const _shadowTd = rowsHead.map(rowH => {
                        const { y } = rowH;
                        return {
                            x: index,
                            y,
                            shadow: true
                        };
                    });
                    item.unshift(..._shadowTd);
                }
                return item;
            });

            // handle props.rows values
            const rowsValue = this.rowHead.map((row, rowIndex) => {
                const rowArr = row.split(this.SEPARATOR);
                return this.localRows.map((...args) =>
                    mergeInfo({
                        value: rowArr[args[1]] || "",
                        x: head.length + rowIndex,
                        y: args[1],
                        isSummary: this.localRows.length !== rowArr.length
                    })
                );
            });

            // console.log("rowsValue", rowsValue);

            // console.log("rowsHead", rowsHead);
            // console.log("columnsHead", columnsHead);
            // console.log("valuesHead", valuesHead);
            // console.log("head", head);

            const data = this.handleFormatData();

            // console.log('data', data);

            const finalData = rowsValue.length
                ? rowsValue.map((row, index) =>
                      [].concat(row).concat(data[index])
                  )
                : data;

            // console.log(finalData);

            this.tableData = [].concat(head).concat(finalData);
        },
        // compile all summary
        compileAllSummary() {
            // all row summary
            this.compileAllRowSummary();
            // all column summary
            this.compileAllColumnSummary();
        },
        // compile data of all row summary
        compileAllRowSummary() {
            // Only effective when `props.allRowSummaryHandle` exists.
            if (this.allRowSummaryHandle) {
                const colKeys = this.localColumns.map(({ key }) => key);

                const _head = this.localRows.map((row, index) =>
                    this._mergeBaseCellInfo({
                        value: "",
                        x: this.tableData.length,
                        y: index,
                        isSummary: true
                    })
                );

                const _filterData = this.colHead.map(colConditions => {
                    const _conditionValues = colConditions.split(
                        this.SEPARATOR
                    );

                    return this.localData.filter(item =>
                        colKeys.every((key, index) =>
                            _conditionValues[index]
                                ? _conditionValues[index] === item[key]
                                : true
                        )
                    );
                });

                const _data = _filterData
                    .map(item => {
                        return this.localValues.map(({ key }) =>
                            item.map(sItem => sItem[key])
                        );
                    })
                    .flat();

                const _combineRow = _head.concat(
                    _data.map((item, index) =>
                        this._mergeBaseCellInfo({
                            value: this.allRowSummaryHandle(item),
                            x: this.tableData.length,
                            y: _head.length + index,
                            isSummary: true
                        })
                    )
                );

                this.tableData.push(_combineRow);
            }
        },
        // compile data of all column summary
        compileAllColumnSummary() {
            console.log(this.colHead);
        },
        // merge base cell info
        _mergeBaseCellInfo(info = {}) {
            const baseCellInfo = {
                value: "",
                x: 0,
                y: 0,
                selected: false,
                drag: false,
                colspan: 1,
                rowspan: 1,
                isSummary: false
            };

            return Object.assign({}, baseCellInfo, info);
        },
        // compile table head
        // e.g. _compileHead(['a', 'b'], ['c', 'd'], ..., isShowSummary = false)
        _compileHead(...args) {
            // show summary info, the default is `false`
            let _isHasSummary = false;

            const lastArg = args[args.length - 1];

            if (Array.isArray(lastArg)) {
                _isHasSummary = false;
            } else {
                _isHasSummary = !!lastArg;
                args.pop();
            }

            const paths = this._combine(...args);

            // add summary info
            if (_isHasSummary) {
                let totalKeys = [];

                for (let i = args.length - 1; i > 0; i--) {
                    totalKeys = totalKeys.concat(
                        this._combine(...args.slice(0, i))
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

                // global total
                // paths.push("");
            }

            return paths;
        },
        // Permutation and combination of each element of multiple arrays
        _combine(...arrays) {
            return arrays.length
                ? arrays.reduce((prev, curr) => {
                      const arr = [];
                      prev.forEach(_prevEl => {
                          curr.forEach(_currEl => {
                              arr.push(_prevEl + this.SEPARATOR + _currEl);
                          });
                      });
                      return arr;
                  })
                : arrays;
        },
        // simple deep clone
        // Note: function can't be clone
        _deepClone(value) {
            return JSON.parse(JSON.stringify(value));
        }
    },
    watch: {
        watchAllProps() {
            this.init();
        }
    }
};
</script>

<style lang="scss" scoped>
table {
    border-collapse: collapse;
    border-spacing: 0;
    border: none;

    td {
        border: 1px solid #ccc;
        padding: 0;
        vertical-align: middle;

        > div {
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding: 5px;
            text-align: center;
            white-space: nowrap;
            width: 100%;
            height: 100%;
            min-height: 36px;

            &.dragging {
                user-select: none;
            }

            &.summary {
                background: #eee;
            }

            &.active {
                outline: 1px solid red;
                background: #ccc;
            }
        }
    }
}
</style>