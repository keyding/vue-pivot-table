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
    findCategory,
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
            type: Array,
            default: () => []
        },
        // display row summary info. The default value is `false`
        rowSummary: {
            type: Array,
            default: () => []
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
            const isSummary = this.rowSummary.length;

            const _paths = combinePaths(
                ...this.localRows.map(({ values }) => values),
                isSummary
            );

            // total summary
            if (isSummary) {
                _paths.push("");
            }

            return _paths;
        },
        colPaths() {
            const isSummary = this.columnSummary.length;

            const _paths = combinePaths(
                ...this.localColumns.map(({ values }) => values),
                isSummary
            );

            if (isSummary) {
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
        /*
            computedColHeads() {
                const computedColumnSummary = this.computedSummary.filter(
                    ({ type }) => type === "column"
                );

                return this.colHeads.map(row => {
                    let _row = [];
                    let _startY = row[0].y;

                    row.forEach(cell => {
                        _row.push(cell);

                        if (cell.isSummary) {
                            computedColumnSummary.forEach(item => {
                                _row.push(
                                    Object.assign({}, cell, {
                                        colspan: 1,
                                        name: item.name
                                    })
                                );
                            });
                        }
                    });

                    _row = _row.map(item => Object.assign(item, { y: _startY++ }));

                    return _row;
                });
            },
        */
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
                    const path = currPath ? currPath.split(this.Separator) : [];
                    const baseX = this.localColumns.length;
                    const baseY =
                        this.localRows.length +
                        i * this.localValues.length +
                        valueIndex;
                    const isSummary = currPathsLen !== this.localColumns.length;

                    _valueHeads.push(
                        mergeBaseInfo({
                            path,
                            value: value.label,
                            x: baseX,
                            y: baseY,
                            isSummary
                        })
                    );
                });
            }

            return _valueHeads;
        },
        /*
            computedValueHeads() {
                const _valueHeads = [];

                const _paths = this.colPaths;

                const colCount = _paths.length || 1;

                let index = 0;

                const computedRowSummary = this.computedSummary.filter(
                    ({ type }) => type === "column"
                );

                for (let i = 0; i < colCount; i++) {
                    const currPath = _paths[i];

                    const currPathsLen =
                        _paths[i] !== undefined
                            ? _paths[i].split(this.Separator).length
                            : -1;

                    const path = currPath ? currPath.split(this.Separator) : [];

                    const isSummary = currPathsLen !== this.localColumns.length;

                    const baseX = this.localColumns.length;

                    const baseY =
                        this.localRows.length + i * this.localValues.length;

                    this.localValues.forEach((value, valueIndex) => {
                        _valueHeads.push(
                            mergeBaseInfo({
                                path,
                                x: baseX,
                                value: value.label,
                                y: baseY + valueIndex + index,
                                isSummary
                            })
                        );
                    });

                    if (isSummary && computedRowSummary.length) {
                        computedRowSummary.forEach((item, itemIndex) => {
                            _valueHeads.push(
                                mergeBaseInfo({
                                    path,
                                    x: baseX,
                                    value: item.name,
                                    y:
                                        baseY +
                                        this.localValues.length +
                                        index +
                                        itemIndex,
                                    isSummary
                                })
                            );
                        });
                        index += computedRowSummary.length;
                    }
                }

                return _valueHeads;
            },
        */
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

                            const isSummary =
                                this.pathKeys.length !==
                                Object.keys(conditions).length;

                            const baseX =
                                this.localColumns.length +
                                +Boolean(this.localValues.length) +
                                rowConditionIndex;

                            const baseY =
                                this.localRows.length +
                                colConditionIndex * this.localValues.length;

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
                                        x: baseX,
                                        y: baseY,
                                        value: "",
                                        isSummary
                                    })
                                );
                            } else {
                                cellData = this.values.map((item, index) => {
                                    return mergeBaseInfo({
                                        path: conditions,
                                        x: baseX,
                                        y: baseY + index,
                                        key: item.key,
                                        value: item.handle
                                            ? item.handle(filterData)
                                            : "",
                                        isSummary
                                    });
                                });
                            }

                            return cellData;
                        })
                        .flat()
            );

            return _dataValues.filter(item => item.length);
        },
        computedDataValues() {
            const _dataValues = [];

            this.dataValues.forEach(row => {
                row.forEach(cell => {
                    // if (cell.value !== "" && !cell.isSummary) {
                    if (!cell.isSummary) {
                        _dataValues.push(
                            Object.assign({}, cell.path, {
                                [cell.key]: cell.value
                            })
                        );
                    }
                });
            });

            return _dataValues;
        },
        /*
            _computedDataValues() {
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

                const computedRowSummary = this.computedSummary.filter(
                    ({ type }) => type === "column"
                );

                // Note: if there are no props.rows or props.column, push an empty object
                !colConditions.length && colConditions.push({});
                !rowConditions.length && rowConditions.push({});

                // draw data
                const _dataValues = rowConditions.map(
                    (rowCondition, rowConditionIndex) => {
                        let computedIndex = 0;

                        return colConditions
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

                                const isSummary =
                                    this.pathKeys.length !==
                                    Object.keys(conditions).length;

                                const baseX =
                                    this.localColumns.length +
                                    +Boolean(this.localValues.length) +
                                    rowConditionIndex;

                                const baseY =
                                    this.localRows.length +
                                    colConditionIndex *
                                        (this.localValues.length || 1) +
                                    computedIndex;

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
                                            x: baseX,
                                            y: baseY,
                                            value: "",
                                            isSummary
                                        })
                                    );

                                    if (isSummary && computedRowSummary.length) {
                                        computedRowSummary.forEach(
                                            (item, itemIndex) => {
                                                cellData.push(
                                                    mergeBaseInfo({
                                                        path: conditions,
                                                        x: baseX,
                                                        value: item.name,
                                                        y: baseY + itemIndex,
                                                        isSummary
                                                    })
                                                );
                                            }
                                        );
                                        computedIndex += computedRowSummary.length;
                                    }
                                } else {
                                    cellData = this.values.map((item, index) => {
                                        return mergeBaseInfo({
                                            path: conditions,
                                            x: baseX,
                                            y: baseY + index,
                                            key: item.key,
                                            value: item.handle
                                                ? item.handle(filterData)
                                                : "",
                                            isSummary
                                        });
                                    });

                                    if (isSummary && computedRowSummary.length) {
                                        computedRowSummary.forEach(
                                            (item, itemIndex) => {
                                                cellData.push(
                                                    mergeBaseInfo({
                                                        path: conditions,
                                                        x: baseX,
                                                        value: item.name,
                                                        y:
                                                            baseY +
                                                            this.localValues
                                                                .length +
                                                            itemIndex,
                                                        isSummary
                                                    })
                                                );
                                            }
                                        );
                                        computedIndex += computedRowSummary.length;
                                    }
                                }

                                return cellData;
                            })
                            .flat();
                    }
                );

                return _dataValues.filter(item => item.length);
            },
        */
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
            const columnValues = findCategory(columnKeys, this.localData);
            const rowValues = findCategory(rowKeys, this.localData);

            this.localColumns.forEach(column => {
                const { key, values } = column;
                this.$set(column, "values", values || columnValues[key] || []);
            });

            this.localRows.forEach(row => {
                const { key, values } = row;
                this.$set(row, "values", values || rowValues[key] || []);
            });
        },
        // combination table
        combineTable() {
            // console.log("1. rowHeads", this.rowHeads);
            // console.log("2. colHeads", this.colHeads);
            // console.log("3. valueHeads", this.valueHeads);
            // console.log("4. rowHeadValues", this.rowHeadValues);
            // console.log("5. dataValues", this.dataValues);

            // console.log("this.computedDataValues", this.computedDataValues);

            // console.log("this.computedColHeads", this.computedColHeads);

            // console.log("this.computedValueHeads", this.computedValueHeads);

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
                    data: [...this.computedDataValues]
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