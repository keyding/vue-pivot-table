<template>
    <div>
        <table v-if="false && this.data && this.data.length" @click="handleTableClick">
            <!-- Has props.columns -->
            <template v-if="localColumns.length">
                <!-- column head label -->
                <template v-for="n in localColumns.length">
                    <tr>
                        <template v-if="n === 1 && localRows.length">
                            <td
                                v-for="(rowHead, rowHeadIndex) in localRows"
                                :key="rowHead.key"
                                :rowspan="localColumns.length + 1"
                            >
                                <div>{{ rowHead.label }} [{{ n - 1 }} - {{ rowHeadIndex }}]</div>
                            </td>
                        </template>
                        <template v-for="(col, colIndex) in colHead">
                            <td :colspan="localValues.length">
                                <div>
                                    {{ col.split(SEPARATOR)[n - 1] }} [{{ n - 1 }} -
                                    {{ n === 1 ? colIndex + localRows.length : colIndex }}]
                                </div>
                            </td>
                        </template>
                    </tr>
                </template>
                <!-- values head label -->
                <tr>
                    <template v-for="n in colHead.length">
                        <td v-for="(item, index) in localValues" :key="item.key + n">
                            <div>
                                {{ item.label }} [{{ localColumns.length }} -
                                {{ (n - 1) * 2 + index }}]
                            </div>
                        </td>
                    </template>
                </tr>
            </template>
            <!-- No props.columns -->
            <template v-else>
                <tr>
                    <!-- row head label -->
                    <td v-for="(rowHead, rowHeadIndex) in localRows" :key="rowHead.key">
                        <div>{{ rowHead.label }} [{{ 0 + "-" + rowHeadIndex }}]</div>
                    </td>
                    <!-- values head label -->
                    <td v-for="(item, index) in localValues" :key="item.key">
                        <div>{{ item.label }} {{ 0 + "-" + (localRows.length + index) }}</div>
                    </td>
                </tr>
            </template>

            <!-- Has rows -->
            <template v-if="localRows.length">
                <tr v-for="(rowHeadValue, rowHeadIndex) in rowHead" :key="rowHeadValue">
                    <!-- row head label -->
                    <td v-for="n in localRows.length" :key="rowHeadValue + n">
                        <div>
                            {{ rowHeadValue.split(SEPARATOR)[n - 1] || "" }} [{{
                            localColumns.length + (localValues.length ? 1 : 0) + rowHeadIndex
                            }}
                            - {{ n - 1 }}]
                        </div>
                    </td>

                    <!-- row values -->
                    <template v-for="(rowValue, rowValueIndex) in tableData[rowHeadIndex]">
                        <td
                            v-for="(value, index) in emptyLocalValues.length
                  ? emptyLocalValues
                  : localValues"
                            :key="'' + rowHeadIndex + rowValueIndex + index"
                        >
                            <div>
                                {{ rowValue[value.key] }} [{{
                                localColumns.length +
                                (localValues.length ? 1 : 0) +
                                rowHeadIndex
                                }}
                                - {{ localRows.length + rowValueIndex * 2 + index }}]
                            </div>
                        </td>
                    </template>
                </tr>
            </template>
            <!-- No rows -->
            <template v-else>
                <tr>
                    <!-- row values -->
                    <template v-for="(rowValue, rowValueIndex) in tableData[0]">
                        <td v-for="(value, index) in localValues" :key="'' + rowValueIndex + index">
                            <div>{{ rowValue[value.key] }}</div>
                        </td>
                    </template>
                </tr>
            </template>
        </table>
        <table>
            <tr>
                <td :rowspan="4">date</td>
                <td :rowspan="4">time</td>
                <td v-if="false"></td>
                <td :colspan="2">3</td>
                <td>4</td>
                <td>5</td>
                <td>6</td>
            </tr>
            <tr>
                <td v-if="false"></td>
                <td v-if="false"></td>
                <td v-if="false"></td>
                <td :colspan="2">3</td>
                <td>4</td>
                <td>5</td>
                <td>6</td>
            </tr>
            <tr>
                <td v-if="false"></td>
                <td v-if="false"></td>
                <td v-if="false"></td>
                <td :colspan="2">3</td>
                <td>4</td>
                <td>5</td>
                <td>6</td>
            </tr>
            <tr>
                <td v-if="false"></td>
                <td v-if="false"></td>
                <td>3-1</td>
                <td>3-2</td>
                <td>4</td>
                <td>5</td>
                <td>6</td>
            </tr>
        </table>
        <table>
            <tr v-for="(tr, trIndex) in result" :key="trIndex">
                <td
                    v-if="!td.shadow"
                    :rowspan="td.rowspan"
                    :colspan="td.colspan"
                    v-for="(td, tdIndex) in tr"
                    :key="tdIndex"
                    :class="{ active: td.selected }"
                    @click="handleTdClick(td)"
                    @mouseenter="handleEnter(td)"
                    @mousedown="hadnleDown(td)"
                    @mouseup="handleUp(td)"
                >
                    <div :class="{ dragging: dragging, summary: td.isSummary }">{{ td.value }}</div>
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
        }
    },
    data: () => ({
        dragging: false,
        start: {},
        end: {},
        timer: null,

        localRows: [],
        localColumns: [],
        localValues: [],
        tableData: [],
        // Note: if no props.values, draw empty table
        emptyLocalValues: [],
        // Separator
        SEPARATOR: "__",
        result: []
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
                this.tableData = this.handleFormatData();

                console.log(this.tableData);
                console.log("rowHead", this.rowHead);
                console.log("colHead", this.colHead);
            } else {
                console.warn(
                    "[Warn]: props.data can't be empty. And props.rows, props.columns, props.values at least one is not empty."
                );
                this.tableData = [];
            }

            console.log(this.handleDataViews());
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
            // conditions of col head
            const colHeadConditions = this.colHead.map(condition => {
                const conditionArr = condition.split(this.SEPARATOR);
                const obj = {};

                this.localColumns.forEach((value, index) => {
                    const { key } = value;

                    if (conditionArr[index]) {
                        obj[key] = conditionArr[index];
                    }
                });

                return obj;
            });

            // conditions of row-head
            const rowHeadConditions = this.rowHead.map(condition => {
                const conditionArr = condition.split(this.SEPARATOR);
                const obj = {};

                this.localRows.forEach((value, index) => {
                    const { key } = value;

                    if (conditionArr[index]) {
                        obj[key] = conditionArr[index];
                    }
                });

                return obj;
            });

            // the keys of condition that props.row and props.columns
            const conditionKeys = this.localRows
                .map(({ key }) => key)
                .concat(this.localColumns.map(({ key }) => key));

            // Note: if there are no props.rows or props.column, push an empty object
            !colHeadConditions.length && colHeadConditions.push({});
            !rowHeadConditions.length && rowHeadConditions.push({});

            // draw data
            return rowHeadConditions.map((row, rowIndex) =>
                colHeadConditions.map((col, colIndex) => {
                    // the condition of current cell
                    const conditions = Object.assign({}, row, col);

                    // the data of current cell (Contains conditions and data)
                    const cellData = {
                        x: rowIndex,
                        y: colIndex,
                        ...conditions
                    };

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
                    // Note: if has `props.row` and `props.columns`, but no `props.values`, set `this.emptyLocalValues` to draw empty table.
                    if (
                        this.localColumns.length &&
                        this.localRows.length &&
                        !this.values.length
                    ) {
                        this.emptyLocalValues = [
                            {
                                key: "__empty",
                                label: "__empty",
                                handle: () => ""
                            }
                        ];
                        cellData.__empty = "";
                    } else {
                        this.values.forEach(item => {
                            cellData[item.key] = item.handle(filterData);
                        });
                    }

                    return cellData;
                })
            );
        },
        handleFormatData2() {
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
                        // Note: if has `props.row` and `props.columns`, but no `props.values`, set `this.emptyLocalValues` to draw empty table.
                        if (
                            this.localColumns.length &&
                            this.localRows.length &&
                            !this.values.length
                        ) {
                            this.emptyLocalValues = [
                                {
                                    key: "__empty",
                                    label: "__empty",
                                    handle: () => ""
                                }
                            ];
                            // cellData.__empty = "";
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
                                // cellData[item.key] = item.handle(filterData);
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

            console.log(
                "handleDataViews: "
                // this.rowHead,
                // this.colHead,
                // this.localValues,
                // this.localData
            );

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
                    row.push(
                        mergeInfo({
                            value: colArr[rowIndex] || "",
                            x: rowIndex,
                            y:
                                rowIndex === 0 && this.localRows.length
                                    ? this.localRows.length + colIndex
                                    : colIndex,
                            colspan: this.localValues.length || 1,
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
                            y:
                                (this.localColumns.length
                                    ? 0
                                    : this.localRows.length) +
                                i * 2 +
                                cellIndex,
                            isSummary: col
                                ? col.split(this.SEPARATOR).length !==
                                  this.localColumns.length
                                : false
                        })
                    );
                });
            }

            // all col head
            let head = [...columnsHead, valuesHead];
            // head[0] = head[0] || [];
            // head[0].unshift(...rowsHead);
            // head = head.filter(row => row.length);

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

            console.log("rowsHead", rowsHead);
            // console.log("columnsHead", columnsHead);
            // console.log("valuesHead", valuesHead);
            console.log("head", head);

            const data = this.handleFormatData2();

            // console.log('data', data);

            const finalData = rowsValue.length
                ? rowsValue.map((row, index) =>
                      [].concat(row).concat(data[index])
                  )
                : data;

            console.log(finalData);

            this.result = [].concat(head).concat(finalData);

            console.log("result", this.result);
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
        },
        // handle table click event
        handleTableClick(event) {
            console.log(event);
        },

        handleTdClick(td) {
            // td.active = !td.active;
        },
        // move
        handleEnter(td) {
            const { x, y } = td;
            if (this.dragging) {
                this.setActive(x, y);
            }
        },
        // 设置选中
        setActive(rowEndIndex, colEndInex) {
            let row = rowEndIndex,
                col = colEndInex;

            const { x: rowStartIndex, y: colStartIndex } = this.start;

            const rowStep = rowEndIndex >= rowStartIndex ? -1 : 1;
            const colStep = colEndInex >= colStartIndex ? -1 : 1;

            requestAnimationFrame(() => {
                this.result.forEach(item => {
                    item.forEach(sItem => {
                        if (sItem.selected) {
                            sItem.selected = false;
                        }
                    });
                });
                while (
                    (rowStep < 0 && row >= rowStartIndex) ||
                    (rowStep > 0 && row <= rowStartIndex)
                ) {
                    while (
                        (colStep < 0 && col >= colStartIndex) ||
                        (colStep > 0 && col <= colStartIndex)
                    ) {
                        this.result[row][col].selected = true;
                        col += colStep;
                    }
                    // 还原 col
                    col = colEndInex;
                    row += rowStep;
                }
            });
        },
        hadnleDown(td) {
            const { x, y } = td;
            this.result.forEach(item => {
                item.forEach(sItem => {
                    sItem.selected = false;
                });
            });

            td.selected = true;

            this.dragging = true;

            this.start = {
                x,
                y
            };

            console.log("start", x, y);
        },
        handleUp(td) {
            const { x, y } = td;
            this.dragging = false;
            this.end = {
                x,
                y
            };
            console.log("end", td, x, y);

            this.calcActiveCell();
        },
        handleTableLeave() {
            this.dragging = false;
        },
        calcActiveCell() {}
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

        &.active {
            border-color: red;
            background: #ccc;
        }

        > div {
            // display: flex;
            // align-items: center;
            // justify-content: center;
            display: inline-table;
            box-sizing: border-box;
            padding: 5px;
            text-align: center;
            white-space: nowrap;
            width: 100%;
            height: 100%;
            // min-height: 36px;

            &.dragging {
                user-select: none;
            }

            &.summary {
                background: #eee;
            }

            &.active {
                // outline: 1px solid red;
                // background: #ccc;
            }
        }
    }
}
</style>