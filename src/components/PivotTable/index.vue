<template>
    <table v-if="this.data && this.data.length">
        <!-- Has props.columns -->
        <template v-if="localColumns.length">
            <!-- column head label -->
            <template v-for="n in localColumns.length">
                <tr>
                    <template v-if="n === 1 && localRows.length">
                        <td
                            v-for="rowHead in localRows"
                            :key="rowHead.key"
                            :rowspan="localColumns.length + 1"
                        >
                            <div>{{ rowHead.label }}</div>
                        </td>
                    </template>
                    <template v-for="col in colHead">
                        <td :colspan="localValues.length">
                            <div>{{ col.split(SEPARATOR)[n - 1] }}</div>
                        </td>
                    </template>
                </tr>
            </template>
            <!-- values head label -->
            <tr>
                <template v-for="n in colHead.length">
                    <td v-for="item in localValues" :key="item.key + n">
                        <div>{{ item.label }}</div>
                    </td>
                </template>
            </tr>
        </template>
        <!-- No props.columns -->
        <template v-else>
            <tr>
                <!-- row head label -->
                <td v-for="rowHead in localRows" :key="rowHead.key">
                    <div>{{ rowHead.label }}</div>
                </td>
                <!-- values head label -->
                <td v-for="item in localValues" :key="item.key">
                    <div>{{ item.label }}</div>
                </td>
            </tr>
        </template>

        <!-- Has rows -->
        <template v-if="localRows.length">
            <tr v-for="(rowHeadValue, rowHeadIndex) in rowHead" :key="rowHeadValue">
                <!-- row head label -->
                <td v-for="n in localRows.length" :key="rowHeadValue + n">
                    <div>{{ rowHeadValue.split(SEPARATOR)[n - 1] || '' }}</div>
                </td>

                <!-- row values -->
                <template v-for="(rowValue, rowValueIndex) in tableData[rowHeadIndex]">
                    <td
                        v-for="(value, index) in (emptyLocalValues.length ? emptyLocalValues : localValues)"
                        :key="'' + rowHeadIndex + rowValueIndex + index"
                    >
                        <div>{{ rowValue[value.key] }}</div>
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
        localRows: [],
        localColumns: [],
        localValues: [],
        tableData: [],
        // Note: if no props.values, draw empty table
        emptyLocalValues: [],
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
                this.tableData = this.handleFormatData();
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
            return rowHeadConditions.map(row =>
                colHeadConditions.map((col, index) => {
                    // the condition of current cell
                    const conditions = Object.assign({}, row, col);

                    // the data of current cell (Contains conditions and data)
                    const cellData = {
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
                paths.push("");
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
    td {
        border: 1px solid #ccc;
        padding: 0;
        > div {
            box-sizing: border-box;
            padding: 5px;
            text-align: center;
            white-space: nowrap;
            &.dragging {
                user-select: none;
            }
            &.active {
                outline: 1px solid red;
                background: #ccc;
            }
        }
    }
}
</style>
