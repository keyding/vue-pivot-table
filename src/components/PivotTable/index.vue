<template>
    <div style="margin: 20px;">
        <table>
            <template v-for="(tr, index) in combineHeads">
                <tr>
                    <td
                        v-if="!cell.__hide"
                        v-for="cell in tr"
                        :key="cell.__index"
                        :rowspan="cell.rowspan"
                        :colspan="cell.colspan"
                    >
                        <div
                            :class="{
                                        'col-summary-bg': cell.__colSummary,
                                        dragged: cell.dragged,
                                    }"
                            :style="{
                                        'min-height': _getMinHeightByRowCount(
                                            cell.rowspan
                                        ),
                                    }"
                        >{{ cell.value }}</div>
                    </td>
                </tr>
            </template>

            <tr v-for="(tr, index) in combineValues" :key="tr.__index" v-if="!tr.__hide">
                <td
                    v-if="!cell.__hide"
                    v-for="cell in tr.data"
                    :key="cell.__index"
                    :rowspan="cell.rowspan"
                    :colspan="cell.colspan"
                >
                    <!-- summary: cell.isSummary, -->
                    <div
                        :class="{
                                    'col-summary-bg': cell.__colSummary,
                                    'row-summary-bg': cell.__rowSummary,
                                    dragged: cell.dragged,
                                }"
                        :style="{
                                    'min-height': _getMinHeightByRowCount(
                                        cell.rowspan
                                    ),
                                }"
                    >{{ cell.value }}</div>
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
    getHeightByCount,
    randomString
} from "./utils";
import { CELL_MIN_HEIGHT, SEPARATOR } from "./utils/constants";

// const IMG = new Image(85, 20);

/**
 * Feature:
 * - empty props checkout
 * - √ 新增列时，需要将新增列的计算后的结果和条件存入 calcData 中，并在 cell 中保存对应的 key
 * - 新增行时，直接通过key 和 条件来查找对应的计算列的汇总
 *
 * handle 的使用
 * 计算名称的填写
 * 区分列和行
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
        summary: {
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
        // localRowSummary: [],
        // localColumnSummary: [],
        // 计算列的数据
        calcData: [],
        // Separator
        Separator: SEPARATOR,

        // 合并后的表头
        combineHeads: [],
        // 合并后的单元格
        combineValues: []
    }),
    computed: {
        rowPaths() {
            const _paths = combinePaths(
                ...this.localRows.map(({ values }) => values),
                true
            );

            _paths.push("");

            return _paths;
        },
        colPaths() {
            const keys = this.localColumns.map(({ values }) => values);
            // .concat([this.localValues.map(({ key }) => key)]);

            if (this.localValues.length) {
                keys.push(this.localValues.map(({ key }) => key));
            }

            const _paths = combinePaths(...keys, true);

            _paths.push("");

            return _paths;
        },
        pathKeys() {
            return this.localRows
                .map(({ key }) => key)
                .concat(this.localColumns.map(({ key }) => key));
        },
        // monitor all props value changes
        watchAllProps() {
            const { rows, columns, values, data } = this;

            return {
                rows,
                columns,
                values,
                data
            };
        },
        // 列的表头
        colHeads() {
            // 共有多少行
            const _rows = this.localColumns.map(() => []);

            // 有几个值
            const valuesLen = this.localValues.length;

            if (valuesLen) {
                _rows.push([]);
            }

            // todo: 仅有 values 的时候会有一个空的path

            this.colPaths.forEach((path, pathIndex) => {
                // 条件值
                const pathValues = path.split(this.Separator);

                // 是否为汇总字段, +1 是因为还有 values
                // pathValues 有一个元素，且为空字符串的话，表示是全部的汇总
                const isSummary =
                    pathValues[0] === "" ||
                    pathValues.length !==
                        this.localColumns.length +
                            +Boolean(this.localValues.length);

                // 存储路径
                const currPath = [];

                _rows.forEach((row, rowIndex) => {
                    const cellData = {};

                    const currVal = pathValues[rowIndex] || "";

                    const isValueKey =
                        valuesLen && currVal && rowIndex === _rows.length - 1;

                    // 是否为 values 行
                    const isLastRow = rowIndex === _rows.length - 1;

                    // 存储路径
                    currPath.push(currVal);

                    const baseX = rowIndex;
                    const baseY =
                        rowIndex === 0 && this.localRows.length
                            ? this.localRows.length + pathIndex
                            : pathIndex;

                    Object.assign(
                        cellData,
                        mergeBaseInfo({
                            x: baseX,
                            y: baseY,
                            isSummary,
                            path: currPath.filter(item => !!item),
                            __index: `${baseX}-${baseY}`,
                            __hide: isSummary,
                            __clone: isSummary,
                            __colSummary: isSummary
                        })
                    );

                    // 最后一行是 values，替换显示文本
                    row.push(
                        Object.assign(cellData, {
                            value:
                                valuesLen && isLastRow && currVal
                                    ? this.localValues.find(
                                          ({ key }) => key === currVal
                                      ).label
                                    : currVal
                        })
                    );
                });
            });

            return _rows;
        },
        // 行的表头
        rowHeads() {
            return this.localRows.map(({ label }, index) => {
                return mergeBaseInfo({
                    value: label,
                    y: index,
                    __index: `0-${index}`,
                    rowspan:
                        this.localColumns.length +
                            Number(Boolean(this.localValues.length)) || 1
                });
            });
        },
        // 行对应的值
        rowHeadValues() {
            return this.localRows.length
                ? this.rowPaths.map((path, index) => {
                      const values = path.split(this.Separator);
                      const currPath = [];
                      // values 仅有一个元素，且为空字符串，表示是全部的汇总
                      const isSummary =
                          values[0] === "" ||
                          this.localRows.length !== values.length;

                      return this.localRows.map((...args) => {
                          const _index = args[1];
                          const _currVal = values[_index] || "";
                          const baseX =
                              this.localColumns.length +
                              +Boolean(this.localValues.length) +
                              index;
                          const baseY = _index;

                          currPath.push(_currVal);

                          return mergeBaseInfo({
                              path: currPath.filter(item => !!item),
                              value: _currVal,
                              x: baseX,
                              y: baseY,
                              isSummary,
                              rowSummary: isSummary,
                              __index: `${baseX}-${baseY}`,
                              __hide: isSummary,
                              __clone: false
                          });
                      });
                  })
                : [];
        },
        // 计算所有对应条件的值
        dataValues() {
            // 列对应的条件
            const colConditions = convertPathToMap(
                this.colPaths,
                this.localColumns
                    .map(({ key }) => key)
                    .concat(this.localValues.length ? ["value"] : [])
            );

            // 行对应的条件
            const rowConditions = convertPathToMap(
                this.rowPaths,
                this.localRows.map(({ key }) => key)
            );

            // console.log("colConditions", colConditions);
            // console.log("rowConditions", rowConditions);

            // 针对没传入行或列的处理
            // !colConditions.length && colConditions.push({});
            // !rowConditions.length && rowConditions.push({});

            // 过滤数据, 遍历行以及遍历行对应的列
            return rowConditions.map((rowCondition, rowConditionIndex) => {
                const _data = colConditions.map(
                    (colCondition, colConditionIndex) => {
                        // 存储当前单元对应的数据
                        const cellData = {};

                        // 当前单元对应的条件
                        const conditions = Object.assign(
                            {},
                            rowCondition,
                            colCondition
                        );

                        const _filterConditions = Object.fromEntries(
                            Object.entries(conditions).filter(
                                item => item[0] !== "value"
                            )
                        );

                        // 通过当前单元对应的条件，过滤数据
                        const filterData = this._filterData(
                            _filterConditions,
                            this.localData
                        );

                        // 对应表格的坐标位置
                        const baseX =
                            this.localColumns.length +
                            +Boolean(this.localValues.length) +
                            rowConditionIndex;

                        const baseY = this.localRows.length + colConditionIndex;

                        Object.assign(
                            cellData,
                            mergeBaseInfo({
                                conditions,
                                x: baseX,
                                y: baseY,
                                __index: `${baseX}-${baseY}`
                            })
                        );

                        // 针对为指定值 props.values 的空处理(绘制空表格)
                        const isEmptyValues =
                            this.localColumns.length &&
                            this.localRows.length &&
                            !this.localValues.length;

                        if (isEmptyValues) {
                            const isSummary =
                                Object.keys(conditions).length !==
                                this.localColumns.length +
                                    +Boolean(this.localValues.length) +
                                    this.localRows.length;

                            Object.assign(cellData, {
                                value: "",
                                isSummary,
                                __hide: isSummary,
                                __clone: isSummary
                            });
                        } else {
                            // 如果没有 value key，说明是一个汇总维度。
                            const isSummary = !conditions.value;

                            // 从 props.values 中找出对应的值 handle
                            // 注意：this.localValues 通过 JSON.xxx 序列化后，handle 会被忽略
                            const _value = this.values.find(
                                ({ key }) => key === conditions.value
                            );

                            Object.assign(cellData, {
                                isSummary,
                                __hide: isSummary,
                                __clone: isSummary,
                                value:
                                    _value && _value.handle
                                        ? _value.handle(filterData)
                                        : ""
                            });
                        }

                        return cellData;
                    }
                );

                // 行条件为空表示是全部汇总
                const isSummary =
                    Object.keys(rowCondition).length !== this.localRows.length;

                return {
                    isSummary,
                    __clone: isSummary,
                    __hide: isSummary,
                    __index: _data[0].x,
                    data: _data
                };
            });
        }
    },
    created() {
        this.init();
        this.log();
    },
    methods: {
        log() {
            // console.log("this.colHeads", this.colHeads);
            // console.log("this.rowHeads", this.rowHeads);
            // console.log("this.combineHeads", this.combineHeads);
            // console.log("this.dataValues", this.dataValues);
            // console.log("this.rowHeadValues", this.rowHeadValues);
            // console.log("this.combineValues", this.combineValues);
            // 增加计算列 - 每一个计算单元需要增加一个value，并将值存进去。
            // this.handleAddCalcRow();
            // console.log("this.combineHeads", this.combineHeads);
            // console.log("this.combineValues", this.combineValues);
            // 增加计算航
            // 关于空值的处理
        },
        // 合并表头
        handleCombineHeads() {
            let combineColHeads = [...this.colHeads];
            combineColHeads[0] = combineColHeads[0] || [];
            combineColHeads[0].unshift(...this.rowHeads);
            combineColHeads = combineColHeads.filter(item => item.length);

            this.combineHeads = combineColHeads;
        },
        // 合并值
        handleCombineValues() {
            // values
            const combineValues = [];

            const valueRowCount =
                this.dataValues.length || this.rowHeadValues.length;

            for (let i = 0; i < valueRowCount; i++) {
                const _currRowHeadValue = this.rowHeadValues[i] || [];
                const _currValue = this.dataValues[i] || {};
                const _row = [..._currRowHeadValue, ...(_currValue.data || [])];

                combineValues.push(
                    Object.assign({}, _currValue, { data: _row })
                );
            }

            this.combineValues = combineValues;
        },
        init() {
            if (this.rows.length || this.columns.length || this.values) {
                this.handleDataClone();
                this.setValuesToColAndRow();
                this.handleCalcData();
                this.handleCombineHeads();
                this.handleCombineValues();
                this.handleAddCalcColumn();
                this.handleAddCalcRow();
                // this.handleAddCalcColumn();

                if (this.summary.length) {
                    this.handleAddCalcColumn();
                    this.handleAddCalcRow();
                    this.handleAddCalcColumn();
                }
            } else {
                console.warn(
                    "[Warn]: props.rows, props.columns, props.values at least one is not empty."
                );
                // this.tableData = [];
            }
        },
        // clone data
        handleDataClone() {
            this.localColumns = deepClone(this.columns);
            this.localRows = deepClone(this.rows);
            // Note: this.localValues can't clone handle function.
            this.localValues = deepClone(this.values);
            this.localData = Object.freeze(this.data);

            // this.localRowSummary = this.rowSummary.map(item =>
            //     Object.assign(
            //         {},
            //         { ...item },
            //         { key: item.key || randomString() }
            //     )
            // );

            // this.localColumnSummary = this.columnSummary.map(item =>
            //     Object.assign(
            //         {},
            //         { ...item },
            //         { key: item.key || randomString() }
            //     )
            // );
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
        // 增加一个计算列
        handleAddCalcColumn() {
            if (!this.localColumns.length || !this.localValues.length) return;

            const key = randomString();

            const keys = [];

            // console.log("this.combineValues", this.combineValues);

            // 生成每个计算列对应的 key
            this.combineValues[0].data.forEach(col => {
                if (col.__clone) {
                    keys.push(randomString());
                }
            });

            this.combineHeads = this.combineHeads.map(row => {
                const _row = [];

                row.forEach((col, index) => {
                    // 插入计算列
                    if (col.__clone) {
                        const cloneCol = Object.fromEntries(
                            Object.entries(col).filter(
                                item =>
                                    item[0] !== "__hide" &&
                                    item[0] !== "__clone"
                            )
                        );
                        _row.push(cloneCol);
                    }
                    _row.push(col);
                });

                // 更新位置
                const _x = _row[0].x;
                let _y = _row[0].y;

                _row.forEach(item =>
                    Object.assign(item, { y: _y, __index: `${_x}-${_y++}` })
                );

                return _row;
            });

            // console.log("this.combineHeads", this.combineHeads);

            const _calcData = [];

            const _handle = data =>
                data
                    .map(item => {
                        const { click = 0, download = 0 } = item;
                        return +click + +download;
                    })
                    .reduce((prev, next) => prev + next);

            this.combineValues = this.combineValues.map(row => {
                const _row = [];
                // 仅新增的计算列保存数据
                const isSaveData = !row.__clone;

                let keyIndex = 0;

                // console.log("row", row);

                row.data.forEach((col, index) => {
                    // console.log("col", col, Object.entries(col));
                    // 插入计算列
                    if (col.__clone) {
                        const cloneCol = Object.fromEntries(
                            Object.entries(col).filter(
                                item =>
                                    item[0] !== "__hide" &&
                                    item[0] !== "__clone"
                            )
                        );
                        // console.log(cloneCol.conditions);
                        const _conditions = Object.fromEntries(
                            Object.entries(cloneCol.conditions).filter(
                                item => item[0] !== "value"
                            )
                        );
                        const filterData = this._filterData(
                            _conditions,
                            this.calcData
                        );

                        // console.log(filterData, "filterData");

                        const key = keys[keyIndex++];

                        // console.log(filterData);
                        cloneCol.value = _handle(filterData);

                        cloneCol.conditions.value = key;

                        cloneCol.__rowSummary = false;
                        cloneCol.__colSummary = true;

                        isSaveData &&
                            _calcData.push(
                                Object.assign({}, _conditions, {
                                    [key]: cloneCol.value
                                })
                            );

                        _row.push(cloneCol);
                    }
                    _row.push(col);
                });

                // 更新位置
                const _x = _row[0].x;
                let _y = _row[0].y;

                _row.forEach(item =>
                    Object.assign(item, { y: _y, __index: `${_x}-${_y++}` })
                );

                return Object.assign(row, { data: _row });
            });

            this.calcData = this.calcData.concat(_calcData);

            // console.log(_calcData);
        },
        // 初始计算值
        handleCalcData() {
            if (!this.localValues.length) return;

            const _colPaths = combinePaths(
                ...this.localColumns.map(({ values }) => values)
            );

            const _colKeys = this.localColumns.map(({ key }) => key);

            const _rowPaths = combinePaths(
                ...this.localRows.map(({ values }) => values)
            );

            const _rowKeys = this.localRows.map(({ key }) => key);

            // conditions of col head
            const colConditions = convertPathToMap(_colPaths, _colKeys);

            // conditions of row-head
            const rowConditions = convertPathToMap(_rowPaths, _rowKeys);

            // Note: if there are no props.rows or props.column, push an empty object
            !colConditions.length && colConditions.push({});
            !rowConditions.length && rowConditions.push({});

            // draw data
            this.calcData = Object.freeze(
                rowConditions
                    .map((rowCondition, rowConditionIndex) =>
                        colConditions
                            .map((colCondition, colConditionIndex) => {
                                // the condition of current cell
                                const conditions = Object.assign(
                                    {},
                                    rowCondition,
                                    colCondition
                                );

                                const cellData = {};

                                // filter the data
                                const filterData = this._filterData(
                                    conditions,
                                    this.localData
                                );

                                // empty cell
                                const isEmptyCell =
                                    this.localColumns.length &&
                                    this.localRows.length &&
                                    !this.localValues.length;

                                const _values = {};

                                // 多个值，多条数据
                                this.values.forEach(({ key, handle }) => {
                                    _values[key] = isEmptyCell
                                        ? ""
                                        : handle
                                        ? handle(filterData)
                                        : "";
                                });

                                return Object.assign({}, conditions, _values);
                            })
                            .flat()
                    )
                    .filter(item => item.length)
                    .flat()
            );
        },
        // 增加一个计算行
        handleAddCalcRow() {
            const combineValues = [];

            console.log("this.combineValues", this.combineValues);

            // console.log("this.calcData", this.calcData);

            this.combineValues.forEach(row => {
                if (row.__clone) {
                    const cloneRow = Object.assign({}, row, {
                        __clone: false,
                        __hide: false
                    });
                    cloneRow.data = cloneRow.data.map(col => {
                        let handle = data => {
                            return data.length
                                ? data
                                      .map(item => item[col.conditions.value])
                                      .reduce((prev, next) => prev + next)
                                : "-";
                        };
                        let filterData = [];

                        if (col.conditions) {
                            filterData = this._filterData(
                                Object.fromEntries(
                                    Object.entries(col.conditions).filter(
                                        item => item[0] !== "value"
                                    )
                                ),
                                this.calcData
                            );
                            filterData = filterData.filter(item =>
                                Object.keys(item).includes(col.conditions.value)
                            );
                            // console.log(col.conditions, filterData);
                        }

                        return Object.assign({}, col, {
                            value: handle(filterData),
                            isSummary: true,
                            __hide: false,
                            __colSummary: false,
                            __rowSummary: true
                        });
                    });
                    console.log("cloneRow", cloneRow);
                    combineValues.push(cloneRow);
                }

                combineValues.push(row);
            });

            let _x = combineValues[0].__index;

            combineValues.forEach(row => {
                row.__index = _x;

                row.data = row.data.map(col =>
                    Object.assign({}, col, { x: _x, __index: `${_x}-${col.y}` })
                );

                ++_x;
            });

            this.combineValues = combineValues;
        },
        // recalc the position(x-y)
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
                    data: [...this.calcData]
                }
            );
        },
        _filterData(conditions, data) {
            return data.filter(data => {
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

            &.col-summary-bg {
                // background: #eee;
                background: #f0f0f0;
            }

            &.row-summary-bg {
                background: #e0e0e0;
            }
        }
    }
}
</style>
