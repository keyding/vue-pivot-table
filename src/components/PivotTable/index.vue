<template>
    <div style="margin: 20px;">
        <table>
            <tr v-for="(tr, trIndex) in tableData" :key="trIndex">
                <td
                    v-for="(td, tdIndex) in tr"
                    :rowspan="td.rowspan"
                    :colspan="td.colspan"
                    :key="tdIndex"
                >
                    <div
                        draggable
                        :class="{ summary: td.isSummary, dragged: td.dragged,}"
                        :style="{ 'min-height': _getMinHeightByRowCount(td.rowspan) }"
                        @dragstart="handleDragStart($event, td)"
                        @drag="handleDrag"
                        @dragend="handleDragEnd($event, td)"
                    >{{ td.value }}</div>
                </td>
            </tr>
        </table>
    </div>
</template>

<script>
/**
 * pivot table
 */
import {
    mergeBaseInfo,
    deepClone,
    combine,
    combinePaths,
    convertPathToMap,
    getHeightByCount
} from "./utils";
import { CELL_MIN_HEIGHT, SEPARATOR } from "./utils/constants";

// const IMG = new Image(85, 20);

/**
 * Feature:
 * - summary title
 * - add computed summary
 */

export default {
    name: "PivotTable",
    props: {
        rows: {
            type: Array,
            default: () => []
        },
        columns: {
            type: Array,
            default: () => []
        },
        values: {
            type: Array,
            default: () => []
        },
        // data
        data: {
            type: Array,
            default: () => []
        },
        // display column summary info. The default value is `false`
        columnSummary: {
            type: Boolean,
            default: false
        },
        // display row summary info. The default value is `false`
        rowSummary: {
            type: Boolean,
            default: false
        },

        // add computed column summary.
        computedColumnSummary: {
            type: Object
        },
        // add computed row summary. e.g. { name: '', handle: () => {} }
        computedRowSummary: {
            type: Object
        }
    },
    data: () => ({
        localRows: [],
        localColumns: [],
        localValues: [],
        tableData: [],
        // Separator
        Separator: SEPARATOR
    }),
    computed: {
        rowPaths() {
            const _paths = combinePaths(
                ...this.localRows.map(({ values }) => values),
                this.rowSummary
            );

            // all summary
            if (this.localValues.length) {
                _paths.push("");
            }

            return _paths;
        },
        colPaths() {
            const _paths = combinePaths(
                ...this.localColumns.map(({ values }) => values),
                this.columnSummary
            );

            if (this.localValues.length) {
                _paths.push("");
            }

            return _paths;
        },
        rowHeads() {
            return this.localRows.map(({ label }, index) => {
                return mergeBaseInfo({
                    value: label,
                    y: index,
                    rowspan:
                        this.localColumns.length +
                            Number(Boolean(this.localValues.length)) || 1
                });
            });
        },
        colHeads() {
            const _colHeads = this.localColumns.map(() => []);

            const valuesLen = this.localValues.length;

            this.colPaths.forEach((path, pathIndex) => {
                const values = path.split(this.Separator);
                const currPath = [];

                _colHeads.forEach((row, rowIndex) => {
                    const currVal = values[rowIndex] || "";
                    currPath.push(currVal);

                    row.push(
                        mergeBaseInfo({
                            path: currPath.filter(item => !!item),
                            value: currVal,
                            x: rowIndex,
                            y:
                                rowIndex === 0 && this.localRows.length
                                    ? this.localRows.length + pathIndex
                                    : pathIndex,
                            colspan: valuesLen || 1,
                            isSummary:
                                values.length !== this.localColumns.length
                        })
                    );
                });
            });

            return _colHeads;
        },
        valueHeads() {
            const _valueHeads = [];

            const _paths = this.colPaths;

            const colCount = _paths.length || 1;

            for (let i = 0; i < colCount; i++) {
                this.localValues.forEach((value, valueIndex) => {
                    const currPath = _paths[i];
                    const currPathsLen =
                        _paths[i] !== undefined
                            ? _paths[i].split(this.Separator).length
                            : -1;

                    _valueHeads.push(
                        mergeBaseInfo({
                            path: currPath
                                ? currPath.split(this.Separator)
                                : [],
                            value: value.label,
                            x: this.localColumns.length,
                            y: this.localRows.length + i * 2 + valueIndex,
                            isSummary: currPathsLen !== this.localColumns.length
                        })
                    );
                });
            }

            return _valueHeads;
        },
        rowHeadValues() {
            return this.rowPaths.map((path, index) => {
                const values = path.split(this.Separator);
                const currPath = [];
                return this.localRows.map((...args) => {
                    const _index = args[1];
                    const _currVal = values[_index] || "";

                    return mergeBaseInfo({
                        path:
                            (currPath.push(_currVal),
                            currPath.filter(item => !!item)),
                        value: _currVal,
                        x:
                            this.localColumns.length +
                            +Boolean(this.localValues.length) +
                            index,
                        y: _index,
                        isSummary: this.localRows.length !== values.length
                    });
                });
            });
        },
        dataValues() {
            // conditions of col head
            const colConditions = convertPathToMap(
                this.colPaths,
                this.localColumns.map(({ key }) => key)
            );

            // conditions of row-head
            const rowConditions = convertPathToMap(
                this.rowPaths,
                this.localRows.map(({ key }) => key)
            );

            // Note: if there are no props.rows or props.column, push an empty object
            !colConditions.length && colConditions.push({});
            !rowConditions.length && rowConditions.push({});

            // draw data
            const _dataValues = rowConditions.map(
                (rowCondition, rowConditionIndex) =>
                    colConditions
                        .map((colCondition, colConditionIndex) => {
                            // the condition of current cell
                            const conditions = Object.assign(
                                {},
                                rowCondition,
                                colCondition
                            );

                            let cellData = [];

                            // filter the data
                            const filterData = this._filterData(conditions);

                            // the filtered data is passed to the `handle` of `props.values`, return calculated data.
                            // Note: there is no `handle` in the `this.localValues`.
                            if (
                                this.localColumns.length &&
                                this.localRows.length &&
                                !this.localValues.length
                            ) {
                                // render empty cell
                                cellData.push(
                                    mergeBaseInfo({
                                        path: conditions,
                                        x:
                                            this.localColumns.length +
                                            +Boolean(this.localValues.length) +
                                            rowConditionIndex,
                                        y:
                                            this.localRows.length +
                                            colConditionIndex,
                                        value: "",
                                        isSummary:
                                            this.pathKeys.length !==
                                            Object.keys(conditions).length
                                    })
                                );
                            } else {
                                cellData = this.values.map((item, index) => {
                                    return mergeBaseInfo({
                                        path: conditions,
                                        x:
                                            this.localColumns.length +
                                            +Boolean(this.localValues.length) +
                                            rowConditionIndex,
                                        y:
                                            this.localRows.length +
                                            colConditionIndex * 2 +
                                            index,
                                        value: item.handle
                                            ? item.handle(filterData)
                                            : "",
                                        isSummary:
                                            this.pathKeys.length !==
                                            Object.keys(conditions).length
                                    });
                                });
                            }

                            return cellData;
                        })
                        .flat()
            );

            return _dataValues.filter(item => item.length);
        },
        pathKeys() {
            return this.localRows
                .map(({ key }) => key)
                .concat(this.localColumns.map(({ key }) => key));
        },
        // monitor all props value changes
        watchAllProps() {
            const {
                rows,
                columns,
                values,
                data,
                columnSummary,
                rowSummary,
                computedColumnSummary,
                computedRowSummary
            } = this;

            return {
                rows,
                columns,
                values,
                data,
                columnSummary,
                rowSummary,
                computedColumnSummary,
                computedRowSummary
            };
        }
    },
    created() {
        this.init();
    },
    methods: {
        init() {
            if (this.rows.length || this.columns.length || this.values) {
                this.handleDataClone();
                this.setValuesToColAndRow();
                this.combineTable();
            } else {
                console.warn(
                    "[Warn]: props.rows, props.columns, props.values at least one is not empty."
                );
                this.tableData = [];
            }
        },
        // clone data
        handleDataClone() {
            this.localColumns = deepClone(this.columns);
            this.localRows = deepClone(this.rows);
            // Note: this.localValues can't clone handle function.
            this.localValues = deepClone(this.values);
            this.localData = Object.freeze(this.data);
        },
        // set the `values` attribute to rows and columns
        setValuesToColAndRow() {
            const columnKeys = this.localColumns.map(({ key }) => key);
            const rowKeys = this.localRows.map(({ key }) => key);
            const columnValues = this.findValues(columnKeys, this.localData);
            const rowValues = this.findValues(rowKeys, this.localData);

            this.localColumns.forEach(column => {
                const { key, values } = column;
                this.$set(column, "values", values || columnValues[key] || []);
            });

            this.localRows.forEach(row => {
                const { key, values } = row;
                this.$set(row, "values", values || rowValues[key] || []);
            });
        },
        // filter type values from data
        findValues(keys = [], data = []) {
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
        // combination table
        combineTable() {
            // console.log("1. rowHeads", this.rowHeads);
            // console.log("2. colHeads", this.colHeads);
            // console.log("3. valueHeads", this.valueHeads);
            // console.log("4. rowHeadValues", this.rowHeadValues);
            // console.log("5. dataValues", this.dataValues);

            // heads
            let combineColHeads = [...this.colHeads, this.valueHeads];
            combineColHeads[0] = combineColHeads[0] || [];
            combineColHeads[0].unshift(...this.rowHeads);
            combineColHeads = combineColHeads.filter(item => item.length);

            // console.log("6. combineColHeads", combineColHeads);

            // values
            const combineValues = [];

            const valueRowCount =
                this.dataValues.length || this.rowHeadValues.length;

            for (let i = 0; i < valueRowCount; i++) {
                const _currRowHeadValue = this.rowHeadValues[i] || [];
                const _currValue = this.dataValues[i] || [];
                combineValues.push([..._currRowHeadValue, ..._currValue]);
            }

            // console.log("7. valueRowCount", valueRowCount);

            // console.log("8. combineValues", combineValues);

            this.tableData = [...combineColHeads, ...combineValues];

            // console.log("9. tabledata", this.tableData);
        },
        // drag cell start
        handleDragStart(e, data) {
            const { target, dataTransfer } = e;

            data.dragged = true;

            dataTransfer.effectAllowed = "copy";

            dataTransfer.setData("data", JSON.stringify(data));

            dataTransfer.setDragImage(target, 0, 0);

            // IMG.src = dragTip;

            // const canvas = document.createElement("canvas");

            // const ctx = canvas.getContext("2d");

            // canvas.width = 170;
            // canvas.height = 42;

            // ctx.fillStyle = "white";
            // ctx.fillRect(0, 0, canvas.width, canvas.height);

            // ctx.fillStyle = "red";
            // ctx.font = "14px serif";

            // ctx.fillText("推拽生成图表", 10, 24);

            // IMG.src = canvas.toDataURL("image/png");

            // IMG.onload = () => {
            //     dataTransfer.setDragImage(IMG, 0, 0);
            // };
        },
        // dragging cell
        handleDrag(e) {
            e.dataTransfer.effectAllowed = "copy";
        },
        // dragging cell end
        handleDragEnd(e, data) {
            data.dragged = false;
            this.$emit(
                "on-dragend",
                { ...data },
                {
                    rows: [...this.localRows],
                    columns: [...this.localColumns],
                    values: [...this.values],
                    data: [...this.data]
                }
            );
        },
        _filterData(conditions) {
            return this.localData.filter(data => {
                let status = true;

                for (let key in conditions) {
                    if (conditions[key] !== data[key]) {
                        status = false;
                        return;
                    }
                }

                return status;
            });
        },
        // get min height by rowspan
        _getMinHeightByRowCount(count) {
            return getHeightByCount(count);
        },

        // compile all summary
        compileAllSummary() {
            if (this.localValues.length) {
                // all row summary
                this.compileAllRowSummary();
                // all column summary
                this.compileAllColumnSummary();
            }
        },
        // compile data of all row summary
        compileAllRowSummary() {
            // Only effective when `props.allRowSummaryHandle` exists.
            if (this.allRowSummaryHandle) {
                const colKeys = this.localColumns.map(({ key }) => key);

                const _head = this.localRows.map((row, index) =>
                    mergeBaseInfo({
                        value: index === 0 ? "Total" : "",
                        x: this.tableData.length,
                        y: index,
                        isSummary: true
                    })
                );

                const _filterData = this.colHead.length
                    ? this.colHead.map(colConditions => {
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
                      })
                    : [this.localData];

                const _data = _filterData
                    .map(item => {
                        return this.localValues.map(({ key }) =>
                            item.map(sItem => sItem[key])
                        );
                    })
                    .flat();

                const _combineRow = _head.concat(
                    _data.map((item, index) =>
                        mergeBaseInfo({
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
            if (this.allColumnSummaryHandle) {
                const rowKeys = this.localRows.map(({ key }) => key);

                const _head = this.localColumns.map((item, index) =>
                    mergeBaseInfo({
                        value: index === 0 ? "Total" : "",
                        x: index,
                        y: this.tableData[0].length,
                        isSummary: true
                    })
                );

                _head.push(
                    mergeBaseInfo({
                        value: "",
                        x: this.localColumns.length,
                        y: this.tableData[0].length,
                        isSummary: true
                    })
                );

                const _filterData = this.rowHead.length
                    ? this.rowHead.map(rowConditions => {
                          const _conditionValues = rowConditions.split(
                              this.SEPARATOR
                          );

                          return this.localData.filter(item =>
                              rowKeys.every((key, index) =>
                                  _conditionValues[index]
                                      ? _conditionValues[index] === item[key]
                                      : true
                              )
                          );
                      })
                    : [this.localData];

                const _data = _filterData.map(item => {
                    return this.localValues.reduce((prev, curr) => {
                        const _sum = item
                            .map(i => i[curr.key])
                            .reduce((sum, num) => sum + num);
                        return Object.assign({}, prev, { [curr.key]: _sum });
                    }, {});
                });

                const _combineCol = _head.concat(
                    _data.map((item, index) =>
                        mergeBaseInfo({
                            value: this.allColumnSummaryHandle(item),
                            x: _head.length + index,
                            y: this.tableData[0].length,
                            isSummary: true
                        })
                    )
                );

                if (this.allRowSummaryHandle) {
                    _combineCol.push(
                        mergeBaseInfo({
                            value: "-",
                            x: _combineCol.length,
                            y: this.tableData[0].length,
                            isSummary: true
                        })
                    );
                }

                this.tableData = this.tableData.map((row, rowIndex) =>
                    row.concat(_combineCol[rowIndex] || [])
                );
            }
        }
    },
    watch: {
        watchAllProps() {
            this.init();
            this.$emit("on-change");
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
        box-sizing: border-box;

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
            cursor: default;

            &.dragging {
                user-select: none;
            }

            &.summary {
                background: #eee;
            }

            &.active {
                // outline: 1px solid #aaa;
                // background: #ccc;
                outline: 1px dashed rgba(0, 0, 0, 0.5);
                background: #bbb;
            }

            &.dragged {
                outline: 1px dashed rgba(0, 0, 0, 0.5);
                background: #bbb;
            }
        }
    }
}
</style>